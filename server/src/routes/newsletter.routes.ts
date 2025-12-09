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
  }),
  headers: z.object({
    'idempotency-key': z.string().uuid('Invalid idempotency key format').optional(),
  }).passthrough(), // Allow other headers
})

// In-memory cache for idempotency keys (in production, use Redis)
const idempotencyCache = new Map<string, { email: string; timestamp: number }>()
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Clean up expired idempotency keys periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      idempotencyCache.delete(key)
    }
  }
}, 60 * 60 * 1000) // Run every hour

router.post(
  '/subscribe',
  newsletterRateLimiter,
  csrfProtection,
  validate(subscribeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined

    // If idempotency key provided, check if this request was already processed
    if (idempotencyKey) {
      const cached = idempotencyCache.get(idempotencyKey)
      if (cached) {
        if (cached.email !== email) {
          // Same key used for different email - this is an error
          res.status(400).json({
            error: 'Idempotency key already used with different email',
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

    const subscriber = await newsletterService.subscribe(email)

    // Store idempotency key if provided
    if (idempotencyKey) {
      idempotencyCache.set(idempotencyKey, {
        email: subscriber.email,
        timestamp: Date.now(),
      })
    }

    logger.info('Newsletter subscription received', 'Newsletter')

    res.json({
      data: {
        message: 'Successfully subscribed to newsletter',
        email: subscriber.email,
      },
    })
  })
)

export default router
