import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client'
import { Request, Response, NextFunction } from 'express'

// Create a custom registry for our metrics
export const metricsRegistry = new Registry()

// Set default labels
metricsRegistry.setDefaultLabels({
  app: 'perfumes-store-api',
})

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({ register: metricsRegistry })

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
})

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
})

export const httpRequestsInFlight = new Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method'],
  registers: [metricsRegistry],
})

// Business metrics
export const ordersTotal = new Counter({
  name: 'orders_total',
  help: 'Total number of orders placed',
  labelNames: ['status', 'payment_method'],
  registers: [metricsRegistry],
})

export const orderValueTotal = new Counter({
  name: 'order_value_total',
  help: 'Total value of orders in cents',
  labelNames: ['currency'],
  registers: [metricsRegistry],
})

export const cartOperations = new Counter({
  name: 'cart_operations_total',
  help: 'Total number of cart operations',
  labelNames: ['operation'], // 'add', 'remove', 'update', 'clear'
  registers: [metricsRegistry],
})

export const authAttempts = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'result'], // type: 'login', 'register', 'refresh'; result: 'success', 'failure'
  registers: [metricsRegistry],
})

export const emailsSent = new Counter({
  name: 'emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type', 'status'], // type: 'order_confirmation', 'newsletter', etc.; status: 'success', 'failure'
  registers: [metricsRegistry],
})

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [metricsRegistry],
})

export const dbConnectionPool = new Gauge({
  name: 'db_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state'], // 'active', 'idle', 'waiting'
  registers: [metricsRegistry],
})

// Cache metrics (for Redis)
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [metricsRegistry],
})

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [metricsRegistry],
})

// External API metrics
export const externalApiDuration = new Histogram({
  name: 'external_api_duration_seconds',
  help: 'Duration of external API calls in seconds',
  labelNames: ['service', 'endpoint', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
})

/**
 * Normalize route path for metrics labels.
 * Replaces dynamic segments with placeholders to prevent cardinality explosion.
 */
function normalizeRoute(path: string): string {
  return path
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[a-f0-9-]{36}/gi, '/:uuid')
    .replace(/\/[a-f0-9]{24}/gi, '/:objectId')
}

/**
 * Express middleware for collecting HTTP request metrics.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now()
  const method = req.method

  httpRequestsInFlight.inc({ method })

  // Capture when response finishes
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000
    const route = normalizeRoute(req.route?.path || req.path || 'unknown')
    const statusCode = res.statusCode.toString()

    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration)
    httpRequestsTotal.inc({ method, route, status_code: statusCode })
    httpRequestsInFlight.dec({ method })
  })

  next()
}

/**
 * Get metrics in Prometheus format.
 */
export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics()
}

/**
 * Get metrics content type.
 */
export function getMetricsContentType(): string {
  return metricsRegistry.contentType
}

/**
 * Record an order event.
 */
export function recordOrder(status: string, paymentMethod: string, valueInCents: number, currency = 'USD'): void {
  ordersTotal.inc({ status, payment_method: paymentMethod })
  orderValueTotal.inc({ currency }, valueInCents)
}

/**
 * Record an authentication attempt.
 */
export function recordAuthAttempt(type: 'login' | 'register' | 'refresh', success: boolean): void {
  authAttempts.inc({ type, result: success ? 'success' : 'failure' })
}

/**
 * Record an email sent.
 */
export function recordEmailSent(type: string, success: boolean): void {
  emailsSent.inc({ type, status: success ? 'success' : 'failure' })
}

/**
 * Record a database query.
 */
export function recordDbQuery(operation: string, model: string, durationMs: number): void {
  dbQueryDuration.observe({ operation, model }, durationMs / 1000)
}

/**
 * Record external API call.
 */
export function recordExternalApi(service: string, endpoint: string, status: string, durationMs: number): void {
  externalApiDuration.observe({ service, endpoint, status }, durationMs / 1000)
}
