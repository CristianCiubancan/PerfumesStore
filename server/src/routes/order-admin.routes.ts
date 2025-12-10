import { Router } from 'express'
import * as orderAdminController from '../controllers/order-admin.controller'
import { authenticate, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { validate } from '../middleware/validate'
import { apiRateLimiter } from '../middleware/rateLimit'
import {
  listOrdersSchema,
  getOrderSchema,
  updateOrderStatusSchema,
} from '../schemas/order-admin'
import { asyncHandler } from '../lib/asyncHandler'

const router = Router()

// All routes require admin authentication
router.use(authenticate)
router.use(authorize('ADMIN'))
router.use(apiRateLimiter)

// List orders with filters
router.get(
  '/',
  validate(listOrdersSchema),
  asyncHandler(orderAdminController.listOrders)
)

// Get order stats
router.get('/stats', asyncHandler(orderAdminController.getStats))

// Get single order
router.get(
  '/:id',
  validate(getOrderSchema),
  asyncHandler(orderAdminController.getOrder)
)

// Update order status
router.patch(
  '/:id/status',
  csrfProtection,
  validate(updateOrderStatusSchema),
  asyncHandler(orderAdminController.updateOrderStatus)
)

export default router
