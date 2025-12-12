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
import emailAdminRoutes from './email-admin.routes'
import campaignAdminRoutes from './campaign-admin.routes'
import { apiRateLimiter, healthRateLimiter } from '../middleware/rateLimit'
import { asyncHandler } from '../lib/asyncHandler'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { isEmailEnabled } from '../services/email'
import { EXCHANGE_RATE } from '../config/constants'

const router = Router()

interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: { status: 'healthy' | 'unhealthy'; latencyMs?: number; error?: string }
    stripe: { status: 'healthy' | 'unhealthy' | 'unconfigured'; error?: string }
    email: { status: 'healthy' | 'unconfigured' }
    exchangeRates: {
      status: 'healthy' | 'stale' | 'missing'
      lastFetchedAt?: string
      staleSinceMinutes?: number
    }
  }
}

// Health check with comprehensive service verification
// NOTE: Health check intentionally returns unwrapped JSON (not { data: ... })
// This is standard for monitoring tools (Kubernetes, Docker, etc.) which expect
// a simple, consistent format without nested data structures.
router.get('/health', healthRateLimiter, asyncHandler(async (req, res) => {
  const health: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'unhealthy' },
      stripe: { status: 'unconfigured' },
      email: { status: 'unconfigured' },
      exchangeRates: { status: 'missing' },
    },
  }

  // 1. Check database connectivity with latency measurement
  const dbStart = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    health.services.database = {
      status: 'healthy',
      latencyMs: Date.now() - dbStart,
    }
  } catch (err) {
    health.services.database = {
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
    health.status = 'unhealthy'
  }

  // 2. Check Stripe connectivity (lightweight account call)
  try {
    await stripe.balance.retrieve()
    health.services.stripe = { status: 'healthy' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    // If it's an auth error, Stripe is reachable but key may be wrong
    // If it's a network error, Stripe is unreachable
    health.services.stripe = {
      status: 'unhealthy',
      error: message,
    }
    // Stripe issues degrade but don't make the app unhealthy
    if (health.status === 'ok') health.status = 'degraded'
  }

  // 3. Check email service configuration
  health.services.email = {
    status: isEmailEnabled() ? 'healthy' : 'unconfigured',
  }

  // 4. Check exchange rates freshness
  try {
    const latestRate = await prisma.exchangeRate.findFirst({
      orderBy: { fetchedAt: 'desc' },
      select: { fetchedAt: true },
    })

    if (latestRate) {
      const ageMinutes = (Date.now() - latestRate.fetchedAt.getTime()) / 1000 / 60
      // Stale threshold: 25 hours (BNR updates daily, allow buffer)
      const staleThresholdMinutes = EXCHANGE_RATE.STALE_THRESHOLD_HOURS * 60

      if (ageMinutes > staleThresholdMinutes) {
        health.services.exchangeRates = {
          status: 'stale',
          lastFetchedAt: latestRate.fetchedAt.toISOString(),
          staleSinceMinutes: Math.round(ageMinutes - staleThresholdMinutes),
        }
        if (health.status === 'ok') health.status = 'degraded'
      } else {
        health.services.exchangeRates = {
          status: 'healthy',
          lastFetchedAt: latestRate.fetchedAt.toISOString(),
        }
      }
    } else {
      health.services.exchangeRates = { status: 'missing' }
      if (health.status === 'ok') health.status = 'degraded'
    }
  } catch {
    // If we can't check rates, don't fail health check
    health.services.exchangeRates = { status: 'missing' }
  }

  // Return appropriate status code
  const statusCode = health.status === 'unhealthy' ? 503 : 200
  res.status(statusCode).json(health)
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

// Admin email templates management
router.use('/admin/email', emailAdminRoutes)

// Admin campaign management
router.use('/admin/campaigns', campaignAdminRoutes)

export default router
