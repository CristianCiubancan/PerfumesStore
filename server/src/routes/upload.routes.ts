import { Router } from 'express'
import { uploadImage, deleteImage } from '../controllers/upload.controller'
import { authenticate, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { sensitiveRateLimiter } from '../middleware/rateLimit'
import { asyncHandler } from '../lib/asyncHandler'

const router = Router()

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  sensitiveRateLimiter,
  asyncHandler(uploadImage)
)

router.delete(
  '/:filename',
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  asyncHandler(deleteImage)
)

export default router
