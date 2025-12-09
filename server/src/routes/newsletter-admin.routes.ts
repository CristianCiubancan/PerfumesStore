import { Router } from 'express'
import * as newsletterController from '../controllers/newsletter.controller'
import { authenticate, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../lib/asyncHandler'
import { validate } from '../middleware/validate'
import { listSubscribersSchema, subscriberIdSchema } from '../schemas/newsletter'
import { sensitiveRateLimiter } from '../middleware/rateLimit'

const router = Router()

// All routes require admin authentication and are rate limited
router.use(authenticate)
router.use(authorize('ADMIN'))
router.use(sensitiveRateLimiter)

// List all newsletter subscribers
router.get(
  '/',
  validate(listSubscribersSchema),
  asyncHandler(newsletterController.listSubscribers)
)

// Unsubscribe a subscriber (soft delete - sets isActive to false)
router.post(
  '/:id/unsubscribe',
  csrfProtection,
  validate(subscriberIdSchema),
  asyncHandler(newsletterController.unsubscribe)
)

// Delete a subscriber permanently
router.delete(
  '/:id',
  csrfProtection,
  validate(subscriberIdSchema),
  asyncHandler(newsletterController.deleteSubscriber)
)

export default router
