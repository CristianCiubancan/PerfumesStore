import { Router } from 'express'
import * as promotionController from '../controllers/promotion.controller'
import { authenticate, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { validate } from '../middleware/validate'
import {
  createPromotionSchema,
  updatePromotionSchema,
  getPromotionSchema,
  listPromotionsSchema,
} from '../schemas/promotion'
import { asyncHandler } from '../lib/asyncHandler'

const router = Router()

// Public route - get active promotion (for homepage and cart)
router.get(
  '/active',
  asyncHandler(promotionController.getActivePromotion)
)

// Admin routes
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(listPromotionsSchema),
  asyncHandler(promotionController.listPromotions)
)

router.get(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(getPromotionSchema),
  asyncHandler(promotionController.getPromotion)
)

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  validate(createPromotionSchema),
  asyncHandler(promotionController.createPromotion)
)

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  validate(updatePromotionSchema),
  asyncHandler(promotionController.updatePromotion)
)

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  validate(getPromotionSchema),
  asyncHandler(promotionController.deletePromotion)
)

export default router
