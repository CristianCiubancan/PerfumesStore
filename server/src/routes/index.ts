import { Router } from 'express'
import authRoutes from './auth.routes'
import productRoutes from './product.routes'
import uploadRoutes from './upload.routes'
import promotionRoutes from './promotion.routes'
import exchangeRateRoutes from './exchange-rate.routes'
import auditRoutes from './audit.routes'
import newsletterRoutes from './newsletter.routes'
import newsletterAdminRoutes from './newsletter-admin.routes'
import checkoutRoutes from './checkout.routes'
import orderAdminRoutes from './order-admin.routes'
import { apiRateLimiter, healthRateLimiter } from '../middleware/rateLimit'
import { asyncHandler } from '../lib/asyncHandler'
import { prisma } from '../lib/prisma'

const router = Router()

// Health check with database connectivity verification
// NOTE: Health check intentionally returns unwrapped JSON (not { data: ... })
// This is standard for monitoring tools (Kubernetes, Docker, etc.) which expect
// a simple, consistent format without nested data structures.
router.get('/health', healthRateLimiter, asyncHandler(async (req, res) => {
  await prisma.$queryRaw`SELECT 1`
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  })
}))

// Auth routes have their own stricter rate limiting
router.use('/auth', authRoutes)

// Apply general rate limiting to public API endpoints
// These are the main shopping endpoints (products, promotions, exchange rates)
router.use('/products', apiRateLimiter, productRoutes)
router.use('/promotions', apiRateLimiter, promotionRoutes)
router.use('/exchange-rates', apiRateLimiter, exchangeRateRoutes)

// Upload routes - sensitive operations have their own rate limiting in route file
router.use('/upload', uploadRoutes)

// Admin audit logs
router.use('/admin/audit-logs', auditRoutes)

// Admin newsletter management
router.use('/admin/newsletter', newsletterAdminRoutes)

// Newsletter subscription (rate limited)
router.use('/newsletter', newsletterRoutes)

// Checkout and orders (has own rate limiting)
router.use('/checkout', checkoutRoutes)

// Admin orders management
router.use('/admin/orders', orderAdminRoutes)

export default router
