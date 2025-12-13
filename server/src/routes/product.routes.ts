import { Router } from 'express'
import * as productController from '../controllers/product.controller'
import { authenticate, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { validate } from '../middleware/validate'
import { sensitiveRateLimiter } from '../middleware/rateLimit'
import { shortEtag, mediumEtag, longEtag } from '../middleware/etag'
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

// Public routes with ETag caching

// Filter options change rarely - use long cache
router.get(
  '/filter-options',
  longEtag,
  asyncHandler(productController.getFilterOptions)
)

// Filter counts depend on current filters - use medium cache
router.get(
  '/filter-counts',
  validate(listProductsSchema),
  mediumEtag,
  asyncHandler(productController.getFilterCounts)
)

// Brands list changes rarely - use long cache
router.get(
  '/brands',
  validate(listBrandsSchema),
  longEtag,
  asyncHandler(productController.getBrands)
)

// Stats change with orders - use short cache
router.get(
  '/stats',
  shortEtag,
  asyncHandler(productController.getStats)
)

// Product listings change with inventory - use short cache
router.get(
  '/',
  validate(listProductsSchema),
  shortEtag,
  asyncHandler(productController.listProducts)
)

// Get product by SEO-friendly slug (primary public endpoint)
router.get(
  '/by-slug/:slug',
  validate(getProductBySlugSchema),
  shortEtag,
  asyncHandler(productController.getProductBySlug)
)

// Get product by ID (for admin/internal use)
router.get(
  '/:id',
  validate(getProductSchema),
  shortEtag,
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
