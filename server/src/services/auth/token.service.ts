import { prisma } from '../../lib/prisma'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  TokenPayload,
} from '../../lib/jwt'
import { AppError } from '../../middleware/errorHandler'
import { logger } from '../../lib/logger'

export interface TokenContext {
  userAgent?: string
  ipAddress?: string
}

/**
 * Store a refresh token in the database for revocation support
 */
export async function storeRefreshToken(
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
export async function revokeRefreshToken(token: string): Promise<boolean> {
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
export async function revokeAllUserTokens(userId: number): Promise<void> {
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

  logger.info(`All tokens revoked for user ${userId}`, 'TokenService')
}

/**
 * Verify a refresh token exists in DB and is not revoked.
 * Returns the token record if valid, null otherwise.
 */
export async function findValidRefreshToken(token: string) {
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
    logger.info(`Cleaned up ${result.count} expired/revoked tokens`, 'TokenService')
  }

  return result.count
}

/**
 * Generate new access and refresh tokens for a user
 */
export function generateTokenPair(payload: TokenPayload) {
  const accessToken = generateAccessToken(payload)
  const { token: refreshToken } = generateRefreshToken(payload)

  return {
    accessToken,
    refreshToken,
  }
}

/**
 * Refresh access and refresh tokens
 */
export async function refreshTokens(refreshToken: string | undefined, context?: TokenContext) {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401, 'REFRESH_TOKEN_REQUIRED')
  }

  // First verify JWT signature and expiry
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch (err: unknown) {
    logger.warn('Refresh token JWT verification failed', 'TokenService', err instanceof Error ? err : undefined)
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
    logger.warn(`Token version mismatch for user ${user.id}`, 'TokenService')
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
      logger.warn(`Refresh token reuse detected for user ${payload.userId}`, 'TokenService')
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
