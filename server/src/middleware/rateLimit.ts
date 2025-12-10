import rateLimit from 'express-rate-limit'

// Strict rate limiter for authentication endpoints (login/register)
// Prevents brute force attacks
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per window
  message: {
    error: {
      message: 'Too many authentication attempts, please try again after 15 minutes',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

// General API rate limiter for public endpoints
// Permissive enough for e-commerce browsing (product listing, filtering, search)
// 200 requests per minute should cover heavy browsing, filtering, and adding to cart
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 200, // 200 requests per minute
  message: {
    error: {
      message: 'Too many requests, please slow down',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

// Rate limiter for health check endpoint
// Prevents DoS abuse while allowing monitoring systems reasonable access
export const healthRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60, // 1 per second average
  message: {
    error: {
      message: 'Too many health checks',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

// Stricter rate limiter for sensitive operations (uploads, bulk actions)
// Even authenticated admins should be limited on these
export const sensitiveRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 20, // 20 requests per minute
  message: {
    error: {
      message: 'Too many requests for this operation, please wait',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

// Newsletter subscription rate limiter
// More permissive than auth (20 per 15 minutes per IP)
export const newsletterRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 attempts per window
  message: {
    error: {
      message: 'Too many subscription attempts, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

// Checkout rate limiter
// Prevents abuse of checkout session creation
export const checkoutRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 checkout attempts per minute
  message: {
    error: {
      message: 'Too many checkout attempts, please try again in a minute',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})
