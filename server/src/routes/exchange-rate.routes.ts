import { Router } from 'express'
import * as exchangeRateController from '../controllers/exchange-rate.controller'
import { asyncHandler } from '../lib/asyncHandler'
import { authenticate, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { validate } from '../middleware/validate'
import { longEtag } from '../middleware/etag'
import { updateSettingsSchema } from '../schemas/exchange-rate'

const router = Router()

// Public route - get current exchange rates (includes fee)
// Rates change daily at most - use long cache
router.get('/', longEtag, asyncHandler(exchangeRateController.getExchangeRates))

// Admin routes - manage settings
router.get(
  '/settings',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(exchangeRateController.getSettings)
)

router.put(
  '/settings',
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  validate(updateSettingsSchema),
  asyncHandler(exchangeRateController.updateSettings)
)

export default router
