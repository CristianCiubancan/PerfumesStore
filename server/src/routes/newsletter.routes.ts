import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { asyncHandler } from '../lib/asyncHandler'
import { newsletterRateLimiter } from '../middleware/rateLimit'
import { csrfProtection } from '../middleware/csrf'
import { logger } from '../lib/logger'
import * as newsletterService from '../services/newsletter.service'

const router = Router()

const subscribeSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    locale: z.enum(['en', 'ro', 'fr', 'de', 'es']).optional(), // Captured from site language
  }),
  headers: z.object({
    'idempotency-key': z.string().uuid('Invalid idempotency key format').optional(),
  }).passthrough(), // Allow other headers
})

// In-memory cache for idempotency keys (in production, use Redis)
const idempotencyCache = new Map<string, { email: string; timestamp: number }>()
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_SIZE = 10000 // Maximum number of idempotency keys to store

// LRU eviction: Remove oldest entries when cache exceeds MAX_CACHE_SIZE
function evictOldestEntries() {
  if (idempotencyCache.size > MAX_CACHE_SIZE) {
    const entriesToRemove = idempotencyCache.size - MAX_CACHE_SIZE
    const sortedEntries = Array.from(idempotencyCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    )

    for (let i = 0; i < entriesToRemove; i++) {
      idempotencyCache.delete(sortedEntries[i][0])
    }

    logger.info(
      `Evicted ${entriesToRemove} oldest idempotency cache entries (LRU)`,
      'Newsletter'
    )
  }
}

// Clean up expired idempotency keys periodically
setInterval(() => {
  const now = Date.now()
  let expiredCount = 0

  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      idempotencyCache.delete(key)
      expiredCount++
    }
  }

  if (expiredCount > 0) {
    logger.info(
      `Cleaned up ${expiredCount} expired idempotency cache entries`,
      'Newsletter'
    )
  }

  // Also check if cache size exceeds limit after cleanup
  evictOldestEntries()
}, 60 * 60 * 1000) // Run every hour

router.post(
  '/subscribe',
  newsletterRateLimiter,
  csrfProtection,
  validate(subscribeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, locale } = req.body
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined

    // If idempotency key provided, check if this request was already processed
    if (idempotencyKey) {
      const cached = idempotencyCache.get(idempotencyKey)
      if (cached) {
        if (cached.email !== email) {
          // Same key used for different email - this is an error (standardized format)
          res.status(400).json({
            error: {
              message: 'Idempotency key already used with different email',
              code: 'IDEMPOTENCY_KEY_MISMATCH',
            },
          })
          return
        }
        // Return success for duplicate request (idempotent behavior)
        logger.info('Newsletter subscription - idempotent request detected', 'Newsletter')
        res.json({
          data: {
            message: 'Successfully subscribed to newsletter',
            email: cached.email,
          },
        })
        return
      }
    }

    const subscriber = await newsletterService.subscribe(email, locale)

    // Store idempotency key if provided
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        email: subscriber.email,
        timestamp: Date.now(),
      })

      // Check if we need to evict old entries
      evictOldestEntries()
    }

    logger.info(`Newsletter subscription received (locale: ${locale || 'default'})`, 'Newsletter')

    res.json({
      data: {
        message: 'Successfully subscribed to newsletter',
        email: subscriber.email,
      },
    })
  })
)

export default router
