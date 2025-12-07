import { Router } from 'express'
import authRoutes from './auth.routes'
import productRoutes from './product.routes'
import uploadRoutes from './upload.routes'
import promotionRoutes from './promotion.routes'
import exchangeRateRoutes from './exchange-rate.routes'
import auditRoutes from './audit.routes'
import newsletterRoutes from './newsletter.routes'
import newsletterAdminRoutes from './newsletter-admin.routes'
import { apiRateLimiter, healthRateLimiter } from '../middleware/rateLimit'
import { asyncHandler } from '../lib/asyncHandler'
import { prisma } from '../lib/prisma'

const router = Router()

// Health check with database connectivity verification
router.get('/health', healthRateLimiter, asyncHandler(async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch {
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    })
  }
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

export default router
