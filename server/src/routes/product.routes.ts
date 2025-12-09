import { Router } from 'express'
import * as productController from '../controllers/product.controller'
import { authenticate, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { validate } from '../middleware/validate'
import { sensitiveRateLimiter } from '../middleware/rateLimit'
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  getProductBySlugSchema,
  listProductsSchema,
  bulkDeleteSchema,
  listBrandsSchema,
} from '../schemas/product'
import { asyncHandler } from '../lib/asyncHandler'

const router = Router()

// Public routes
router.get(
  '/filter-options',
  asyncHandler(productController.getFilterOptions)
)

router.get(
  '/brands',
  validate(listBrandsSchema),
  asyncHandler(productController.getBrands)
)

router.get(
  '/stats',
  asyncHandler(productController.getStats)
)

router.get(
  '/',
  validate(listProductsSchema),
  asyncHandler(productController.listProducts)
)

// Get product by SEO-friendly slug (primary public endpoint)
router.get(
  '/by-slug/:slug',
  validate(getProductBySlugSchema),
  asyncHandler(productController.getProductBySlug)
)

// Get product by ID (for admin/internal use)
router.get(
  '/:id',
  validate(getProductSchema),
  asyncHandler(productController.getProduct)
)

// Admin-only routes (all require CSRF protection)
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  validate(createProductSchema),
  asyncHandler(productController.createProduct)
)

// Bulk delete products - rate limited due to destructive nature
router.post(
  '/bulk-delete',
  sensitiveRateLimiter,
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  validate(bulkDeleteSchema),
  asyncHandler(productController.bulkDeleteProducts)
)

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  validate(updateProductSchema),
  asyncHandler(productController.updateProduct)
)

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  csrfProtection,
  validate(getProductSchema),
  asyncHandler(productController.deleteProduct)
)

export default router
