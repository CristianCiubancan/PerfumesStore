import bcrypt from 'bcrypt'
import { prisma } from '../lib/prisma'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  TokenPayload,
} from '../lib/jwt'
import { AppError } from '../middleware/errorHandler'
import { RegisterInput, LoginInput, ChangePasswordInput } from '../schemas/auth'
import { logger } from '../lib/logger'
import { AUTH } from '../config/constants'

interface TokenContext {
  userAgent?: string
  ipAddress?: string
}

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15

/**
 * Store a refresh token in the database for revocation support
 */
async function storeRefreshToken(
  userId: number,
  token: string,
  context?: TokenContext
): Promise<void> {
  const tokenHash = hashToken(token)
  const expiresAt = getRefreshTokenExpiry()

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
    },
  })
}

/**
 * Revoke a specific refresh token
 */
async function revokeRefreshToken(token: string): Promise<boolean> {
  const tokenHash = hashToken(token)

  const result = await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })

  return result.count > 0
}

/**
 * Revoke all refresh tokens for a user (used on password change, security events)
 */
async function revokeAllUserTokens(userId: number): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })

  // Also increment tokenVersion to invalidate all access tokens immediately
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  })

  logger.info(`All tokens revoked for user ${userId}`, 'AuthService')
}

/**
 * Verify a refresh token exists in DB and is not revoked.
 * Returns the token record if valid, null otherwise.
 */
async function findValidRefreshToken(token: string) {
  const tokenHash = hashToken(token)

  return prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
}

/**
 * Clean up expired tokens (should be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  })

  if (result.count > 0) {
    logger.info(`Cleaned up ${result.count} expired/revoked tokens`, 'AuthService')
  }

  return result.count
}

/**
 * Check if user account is locked
 */
function isAccountLocked(user: { lockedUntil: Date | null }): boolean {
  if (!user.lockedUntil) return false
  return new Date() < user.lockedUntil
}

/**
 * Reset failed login attempts after successful login
 */
async function resetFailedLoginAttempts(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  })
}

/**
 * Increment failed login attempts and lock account if threshold exceeded
 */
async function handleFailedLogin(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  })

  if (!user) return

  const newAttempts = user.failedLoginAttempts + 1
  const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newAttempts,
      lockedUntil: shouldLock
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
        : undefined,
    },
  })

  if (shouldLock) {
    logger.warn(
      `User ${userId} account locked after ${MAX_FAILED_ATTEMPTS} failed login attempts`,
      'AuthService'
    )
  }
}

export async function register(input: RegisterInput, context?: TokenContext) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (existingUser) {
    throw new AppError('Email already registered', 400, 'EMAIL_EXISTS')
  }

  const passwordHash = await bcrypt.hash(input.password, AUTH.BCRYPT_SALT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tokenVersion: true,
      createdAt: true,
    },
  })

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  }

  const accessToken = generateAccessToken(payload)
  const { token: refreshToken } = generateRefreshToken(payload)

  // Store refresh token in database
  await storeRefreshToken(user.id, refreshToken, context)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  }
}

export async function login(input: LoginInput, context?: TokenContext) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  // Check if account is locked
  if (isAccountLocked(user)) {
    const lockExpiry = user.lockedUntil!
    const minutesRemaining = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000)
    throw new AppError(
      `Account is locked due to too many failed login attempts. Try again in ${minutesRemaining} minute(s).`,
      401,
      'ACCOUNT_LOCKED'
    )
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash)

  if (!isValidPassword) {
    // Increment failed login attempts
    await handleFailedLogin(user.id)
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  // Reset failed login attempts on successful login
  await resetFailedLoginAttempts(user.id)

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  }

  const accessToken = generateAccessToken(payload)
  const { token: refreshToken } = generateRefreshToken(payload)

  // Store refresh token in database
  await storeRefreshToken(user.id, refreshToken, context)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  }
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    // No token to revoke, just return success
    return
  }

  const revoked = await revokeRefreshToken(refreshToken)
  if (revoked) {
    logger.info('Refresh token revoked on logout', 'AuthService')
  }
}

export async function logoutAllDevices(userId: number): Promise<void> {
  await revokeAllUserTokens(userId)
  logger.info(`User ${userId} logged out from all devices`, 'AuthService')
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  return user
}

export async function refreshTokens(refreshToken: string | undefined, context?: TokenContext) {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401, 'REFRESH_TOKEN_REQUIRED')
  }

  // First verify JWT signature and expiry
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch (err: unknown) {
    logger.warn('Refresh token JWT verification failed', 'AuthService', err instanceof Error ? err : undefined)
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN')
  }

  // Fetch fresh user data to get current tokenVersion
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tokenVersion: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  // Check if tokenVersion matches (user hasn't changed password or been forcefully logged out)
  if (payload.tokenVersion !== user.tokenVersion) {
    logger.warn(`Token version mismatch for user ${user.id}`, 'AuthService')
    throw new AppError('Session expired. Please login again.', 401, 'SESSION_EXPIRED')
  }

  const newPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  }

  const newAccessToken = generateAccessToken(newPayload)
  const { token: newRefreshToken } = generateRefreshToken(newPayload)

  // Use transaction to atomically verify token validity, revoke old token, and create new one
  // This prevents race condition where token could be revoked between check and transaction
  const tokenHash = hashToken(refreshToken)
  const newTokenHash = hashToken(newRefreshToken)
  const expiresAt = getRefreshTokenExpiry()

  await prisma.$transaction(async (tx) => {
    // Verify token exists in database and is not revoked (inside transaction to prevent race condition)
    const existingToken = await tx.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!existingToken) {
      // Token reuse detected - potential theft! Revoke all user tokens
      logger.warn(`Refresh token reuse detected for user ${payload.userId}`, 'AuthService')
      await revokeAllUserTokens(payload.userId)
      throw new AppError('Token has been revoked. Please login again.', 401, 'TOKEN_REVOKED')
    }

    // Revoke old token
    await tx.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    })

    // Create new token
    await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
      },
    })
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  }
}

export async function changePassword(userId: number, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  const isValidPassword = await bcrypt.compare(input.currentPassword, user.passwordHash)

  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD')
  }

  const newPasswordHash = await bcrypt.hash(input.newPassword, AUTH.BCRYPT_SALT_ROUNDS)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  })

  // SECURITY: Invalidate all existing sessions on password change
  await revokeAllUserTokens(userId)

  logger.info(`Password changed for user ${userId}, all sessions invalidated`, 'AuthService')

  return { message: 'Password changed successfully. Please login again.' }
}

/**
 * Get user's tokenVersion for middleware verification
 */
export async function getUserTokenVersion(userId: number): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  })

  return user?.tokenVersion ?? null
}
