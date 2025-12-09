import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'
import { logger } from '../../lib/logger'

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15

// Per-email rate limiting configuration
// NOTE: For production, consider using rate-limiter-flexible package with Redis backend
// This in-memory implementation will be reset on server restart
const EMAIL_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const EMAIL_RATE_LIMIT_MAX_ATTEMPTS = 5

interface RateLimitEntry {
  count: number
  resetAt: number
}

const emailRateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [email, entry] of emailRateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      emailRateLimitStore.delete(email)
    }
  }
}, 60 * 1000) // Run every minute

/**
 * Check and enforce per-email rate limiting
 * Returns true if rate limit exceeded
 */
export function checkEmailRateLimit(email: string): boolean {
  const now = Date.now()
  const entry = emailRateLimitStore.get(email)

  if (!entry || now >= entry.resetAt) {
    // Create new entry or reset expired entry
    emailRateLimitStore.set(email, {
      count: 1,
      resetAt: now + EMAIL_RATE_LIMIT_WINDOW_MS,
    })
    return false
  }

  // Increment attempt count
  entry.count++
  emailRateLimitStore.set(email, entry)

  // Check if limit exceeded
  return entry.count > EMAIL_RATE_LIMIT_MAX_ATTEMPTS
}

/**
 * Reset email rate limit (called on successful login)
 */
export function resetEmailRateLimit(email: string): void {
  emailRateLimitStore.delete(email)
}

/**
 * Check if user account is locked
 */
export function isAccountLocked(user: { lockedUntil: Date | null }): boolean {
  if (!user.lockedUntil) return false
  return new Date() < user.lockedUntil
}

/**
 * Reset failed login attempts after successful login
 */
export async function resetFailedLoginAttempts(userId: number): Promise<void> {
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
export async function handleFailedLogin(userId: number): Promise<void> {
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
      'AccountService'
    )
  }
}

/**
 * Get user profile by ID
 */
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

/**
 * Get lockout status and remaining time
 * SEC-004: This function is only used for server-side logging
 * The actual error message returned to the client should be generic
 */
export function getLockoutStatus(user: { lockedUntil: Date | null }) {
  if (!isAccountLocked(user)) {
    return null
  }

  const lockExpiry = user.lockedUntil!
  const minutesRemaining = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000)

  return {
    isLocked: true,
    minutesRemaining,
    // This message is for server-side logging only
    logMessage: `Login attempt for locked account. Lock expires in ${minutesRemaining} minute(s)`,
  }
}
