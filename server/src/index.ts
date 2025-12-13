import express, { raw } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import path from 'path'
import { config } from './config'
import routes from './routes'
import swaggerRoutes from './swagger'
import metricsRoutes from './routes/metrics'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { requestIdMiddleware } from './middleware/requestId'
import { metricsMiddleware } from './lib/metrics'
import { logger } from './lib/logger'
import { prisma } from './lib/prisma'
import { handleWebhook } from './controllers/checkout.controller'
import { asyncHandler } from './lib/asyncHandler'
import {
  registerCronJobs,
  initExchangeRates,
  initTokenCleanup,
  initImageCleanup,
  initOrderCleanup,
} from './cron'

const app = express()

// Enable gzip/deflate compression for all responses
// Compresses responses larger than 1KB with level 6 compression
app.use(compression())

// Request ID for tracing/correlation
app.use(requestIdMiddleware)

// Prometheus metrics collection (must be early to capture all requests)
if (config.METRICS_ENABLED) {
  app.use(metricsMiddleware)
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", config.CLIENT_URL],
      connectSrc: ["'self'", config.CLIENT_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
}))

// Stripe webhook needs raw body BEFORE json parsing
// Register before express.json() to preserve raw body for signature verification
app.post('/api/checkout/webhook', raw({ type: 'application/json' }), asyncHandler(handleWebhook))

app.use(express.json({ limit: '50kb' }))
app.use(cookieParser())
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Serve uploaded files statically with security headers
app.use('/uploads', (req, res, next) => {
  // Prevent MIME type sniffing to protect against content-type attacks
  res.setHeader('X-Content-Type-Options', 'nosniff')
  next()
}, express.static(path.join(process.cwd(), 'uploads')))

// API documentation (Swagger UI) - available in all environments
app.use('/api/docs', swaggerRoutes)

// Prometheus metrics endpoint
if (config.METRICS_ENABLED) {
  app.use('/metrics', metricsRoutes)
  logger.info(`Metrics endpoint available at /metrics`, 'Server')
}

app.use('/api', routes)
app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`, 'Server')
  registerCronJobs()
  initExchangeRates()
  initTokenCleanup()
  initImageCleanup()
  initOrderCleanup()
})

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully`, 'Server')

  server.close(async () => {
    await prisma.$disconnect()
    logger.info('Server closed', 'Server')
    process.exit(0)
  })

  // Force exit after 30 seconds (allows time for long-running requests to complete)
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout', 'Server')
    process.exit(1)
  }, 30000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Global error handlers for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception - process will exit', 'Process', error)
  // Give time for the log to be written, then exit
  setTimeout(() => process.exit(1), 1000)
})

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled promise rejection', 'Process', {
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason,
    promise: String(promise),
  })
})
