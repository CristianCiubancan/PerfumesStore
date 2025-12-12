import Redis from 'ioredis'
import { logger } from './logger'

// Redis connection configuration from environment
const REDIS_URL = process.env.REDIS_URL
const REDIS_HOST = process.env.REDIS_HOST || 'localhost'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)
const REDIS_PASSWORD = process.env.REDIS_PASSWORD
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10)

let redis: Redis | null = null
let isConnected = false

/**
 * Get Redis client instance
 * Returns null if Redis is not configured or connection fails
 */
export function getRedis(): Redis | null {
  return isConnected ? redis : null
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return isConnected
}

/**
 * Initialize Redis connection
 * Safe to call multiple times - will only connect once
 */
export async function initRedis(): Promise<boolean> {
  if (redis) {
    return isConnected
  }

  // Skip if no Redis URL or host is configured
  if (!REDIS_URL && REDIS_HOST === 'localhost' && !process.env.REDIS_HOST) {
    logger.info('Redis not configured, using in-memory fallback', 'Redis')
    return false
  }

  try {
    redis = REDIS_URL
      ? new Redis(REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) return null // Stop retrying after 3 attempts
            return Math.min(times * 100, 3000)
          },
          lazyConnect: true,
        })
      : new Redis({
          host: REDIS_HOST,
          port: REDIS_PORT,
          password: REDIS_PASSWORD || undefined,
          db: REDIS_DB,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) return null
            return Math.min(times * 100, 3000)
          },
          lazyConnect: true,
        })

    redis.on('error', (err) => {
      logger.error(`Redis connection error: ${err.message}`, 'Redis')
      isConnected = false
    })

    redis.on('connect', () => {
      logger.info('Redis connected', 'Redis')
      isConnected = true
    })

    redis.on('close', () => {
      logger.info('Redis connection closed', 'Redis')
      isConnected = false
    })

    // Try to connect
    await redis.connect()
    isConnected = true
    logger.info('Redis initialized successfully', 'Redis')
    return true
  } catch (err) {
    logger.warn(
      `Failed to connect to Redis: ${err instanceof Error ? err.message : 'Unknown error'}. Using in-memory fallback.`,
      'Redis'
    )
    redis = null
    isConnected = false
    return false
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
    isConnected = false
    logger.info('Redis connection closed', 'Redis')
  }
}
