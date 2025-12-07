import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { asyncHandler } from '../lib/asyncHandler'
import { newsletterRateLimiter } from '../middleware/rateLimit'
import { logger } from '../lib/logger'
import * as newsletterService from '../services/newsletter.service'

const router = Router()

const subscribeSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
})

router.post(
  '/subscribe',
  newsletterRateLimiter,
  validate(subscribeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    const subscriber = await newsletterService.subscribe(email)

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
