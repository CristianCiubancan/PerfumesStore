import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'
import { RegisterInput, LoginInput } from '../../schemas/auth'
import { logger } from '../../lib/logger'
import { TokenPayload } from '../../lib/jwt'

// Import from modular services
import {
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateTokenPair,
  TokenContext,
} from './token.service'
import { hashPassword, verifyPassword, DUMMY_HASH } from './password.service'
import {
  isAccountLocked,
  resetFailedLoginAttempts,
  handleFailedLogin,
  getLockoutStatus,
  checkEmailRateLimit,
  resetEmailRateLimit,
} from './account.service'

// Re-export everything from modular services for backward compatibility
export * from './token.service'
export * from './password.service'
export * from './account.service'
export * from './password-reset.service'

/**
 * Register a new user
 */
export async function register(input: RegisterInput, context?: TokenContext) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (existingUser) {
    throw new AppError('Email already registered', 400, 'EMAIL_EXISTS')
  }

  const passwordHash = await hashPassword(input.password)

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

  const { accessToken, refreshToken } = generateTokenPair(payload)

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

/**
 * Login user
 * SEC-009: Includes per-email rate limiting in addition to per-IP rate limiting
 */
export async function login(input: LoginInput, context?: TokenContext) {
  // SEC-009: Check per-email rate limiting (in addition to per-IP rate limiting at middleware level)
  if (checkEmailRateLimit(input.email)) {
    throw new AppError(
      'Too many login attempts. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED'
    )
  }

  const user = await prisma.user.findUnique({
    where: { email: input.email },
  })

  // SEC-005: Always perform bcrypt comparison to prevent timing attacks
  // Use dummy hash if user doesn't exist to maintain constant timing
  const passwordHash = user?.passwordHash || DUMMY_HASH
  const isValidPassword = await verifyPassword(input.password, passwordHash)

  if (!user || !isValidPassword) {
    // If user exists, increment failed login attempts
    if (user) {
      await handleFailedLogin(user.id)
    }
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  // SEC-004: Check if account is locked and return generic error message
  if (isAccountLocked(user)) {
    const lockoutStatus = getLockoutStatus(user)
    // Log the actual reason server-side
    if (lockoutStatus) {
      logger.warn(
        `${lockoutStatus.logMessage} (user ${user.id})`,
        'AuthService'
      )
    }
    // Return generic error to prevent user enumeration
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  // Reset failed login attempts and email rate limit on successful login
  await resetFailedLoginAttempts(user.id)
  resetEmailRateLimit(input.email)

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  }

  const { accessToken, refreshToken } = generateTokenPair(payload)

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

/**
 * Logout user by revoking refresh token
 */
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

/**
 * Logout user from all devices
 */
export async function logoutAllDevices(userId: number): Promise<void> {
  await revokeAllUserTokens(userId)
  logger.info(`User ${userId} logged out from all devices`, 'AuthService')
}
