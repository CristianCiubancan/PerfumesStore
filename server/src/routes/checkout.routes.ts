import { Router, raw } from 'express'
import * as checkoutController from '../controllers/checkout.controller'
import { authenticate, optionalAuthenticate } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { validate } from '../middleware/validate'
import { apiRateLimiter, checkoutRateLimiter } from '../middleware/rateLimit'
import {
  createCheckoutSessionSchema,
  getOrderSchema,
  getOrderBySessionSchema,
  listOrdersSchema,
} from '../schemas/checkout'
import { asyncHandler } from '../lib/asyncHandler'

const router = Router()

// Webhook - no auth, no CSRF, raw body required for signature verification
// IMPORTANT: This must be registered BEFORE any body parsing middleware
router.post(
  '/webhook',
  raw({ type: 'application/json' }),
  asyncHandler(checkoutController.handleWebhook)
)

// Create checkout session - optional auth (guests allowed)
router.post(
  '/create-session',
  checkoutRateLimiter,
  optionalAuthenticate,
  csrfProtection,
  validate(createCheckoutSessionSchema),
  asyncHandler(checkoutController.createCheckoutSession)
)

// Get order by session ID (for success page - public but rate limited)
router.get(
  '/session/:sessionId',
  apiRateLimiter,
  validate(getOrderBySessionSchema),
  asyncHandler(checkoutController.getOrderBySession)
)

// User's orders - requires auth
router.get(
  '/orders',
  authenticate,
  validate(listOrdersSchema),
  asyncHandler(checkoutController.getUserOrders)
)

// Single order - requires auth
router.get(
  '/orders/:id',
  authenticate,
  validate(getOrderSchema),
  asyncHandler(checkoutController.getOrder)
)

export default router
