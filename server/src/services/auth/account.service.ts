import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'
import { logger } from '../../lib/logger'
import { getRedis, isRedisAvailable } from '../../lib/redis'

// Account lockout configuration
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15

// Per-email rate limiting configuration
const EMAIL_RATE_LIMIT_WINDOW_SECONDS = 15 * 60 // 15 minutes
const EMAIL_RATE_LIMIT_MAX_ATTEMPTS = 5
const RATE_LIMIT_KEY_PREFIX = 'rate_limit:login:'

// In-memory fallback for when Redis is unavailable
interface RateLimitEntry {
  count: number
  resetAt: number
}

const emailRateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired in-memory rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [email, entry] of emailRateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      emailRateLimitStore.delete(email)
    }
  }
}, 60 * 1000) // Run every minute

/**
 * Check and enforce per-email rate limiting using Redis (with in-memory fallback)
 * Returns true if rate limit exceeded
 */
export async function checkEmailRateLimit(email: string): Promise<boolean> {
  const redis = getRedis()

  if (redis && isRedisAvailable()) {
    return checkEmailRateLimitRedis(email)
  }

  return checkEmailRateLimitMemory(email)
}

/**
 * Redis-based rate limit check
 * Uses Redis INCR with TTL for distributed rate limiting
 */
async function checkEmailRateLimitRedis(email: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return checkEmailRateLimitMemory(email)

  const key = `${RATE_LIMIT_KEY_PREFIX}${email.toLowerCase()}`

  try {
    // Use Lua script for atomic increment + TTL check
    const result = await redis.eval(
      `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])

      local current = redis.call('INCR', key)

      if current == 1 then
        redis.call('EXPIRE', key, window)
      end

      return current
      `,
      1,
      key,
      EMAIL_RATE_LIMIT_MAX_ATTEMPTS,
      EMAIL_RATE_LIMIT_WINDOW_SECONDS
    ) as number

    const exceeded = result > EMAIL_RATE_LIMIT_MAX_ATTEMPTS

    if (exceeded) {
      logger.warn(
        `Rate limit exceeded for ${email} (attempt ${result}/${EMAIL_RATE_LIMIT_MAX_ATTEMPTS})`,
        'RateLimit'
      )
    }

    return exceeded
  } catch (err) {
    logger.error(
      `Redis rate limit error: ${err instanceof Error ? err.message : 'Unknown'}`,
      'RateLimit'
    )
    // Fallback to in-memory on Redis error
    return checkEmailRateLimitMemory(email)
  }
}

/**
 * In-memory rate limit check (fallback when Redis unavailable)
 */
function checkEmailRateLimitMemory(email: string): boolean {
  const now = Date.now()
  const normalizedEmail = email.toLowerCase()
  const entry = emailRateLimitStore.get(normalizedEmail)

  if (!entry || now >= entry.resetAt) {
    // Create new entry or reset expired entry
    emailRateLimitStore.set(normalizedEmail, {
      count: 1,
      resetAt: now + EMAIL_RATE_LIMIT_WINDOW_SECONDS * 1000,
    })
    return false
  }

  // Increment attempt count
  entry.count++
  emailRateLimitStore.set(normalizedEmail, entry)

  // Check if limit exceeded
  const exceeded = entry.count > EMAIL_RATE_LIMIT_MAX_ATTEMPTS

  if (exceeded) {
    logger.warn(
      `Rate limit exceeded for ${email} (attempt ${entry.count}/${EMAIL_RATE_LIMIT_MAX_ATTEMPTS}) [in-memory]`,
      'RateLimit'
    )
  }

  return exceeded
}

/**
 * Reset email rate limit (called on successful login)
 * Uses Redis if available, otherwise in-memory
 */
export async function resetEmailRateLimit(email: string): Promise<void> {
  const redis = getRedis()
  const normalizedEmail = email.toLowerCase()

  // Always clear from in-memory store
  emailRateLimitStore.delete(normalizedEmail)

  // Also clear from Redis if available
  if (redis && isRedisAvailable()) {
    const key = `${RATE_LIMIT_KEY_PREFIX}${normalizedEmail}`
    try {
      await redis.del(key)
    } catch (err) {
      logger.error(
        `Redis rate limit reset error: ${err instanceof Error ? err.message : 'Unknown'}`,
        'RateLimit'
      )
    }
  }
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
