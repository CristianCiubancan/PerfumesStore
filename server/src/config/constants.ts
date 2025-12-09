/**
 * Application Constants
 *
 * Centralized configuration values that were previously magic numbers/strings.
 * These can be overridden by environment variables where appropriate.
 */

// Authentication & JWT
export const AUTH = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ACCESS_TOKEN_COOKIE_MAX_AGE_MS: 15 * 60 * 1000, // 15 minutes in milliseconds
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  TOKEN_CLEANUP_CRON_SCHEDULE: '*/10 * * * *', // Every 10 minutes
  BCRYPT_SALT_ROUNDS: 12,
} as const

// File Uploads
export const UPLOADS = {
  IMAGE_CLEANUP_CRON_SCHEDULE: '0 3 * * *', // Daily at 3:00 AM
} as const

// Image Processing
export const IMAGE = {
  MAX_DIMENSION: 800,
  WEBP_QUALITY: 80,
  RESIZE_FIT: 'inside',
} as const

// Pagination
// NOTE: DEFAULT_LIMIT is shared with client (/client/lib/constants.ts)
// and documented in /shared/shared-constants.ts - must be kept in sync
export const PAGINATION = {
  DEFAULT_LIMIT: 20, // Synchronized via /shared/shared-constants.ts
  MAX_LIMIT: 100,
  SITEMAP_LIMIT: 1000,
} as const

// Stock Management
// NOTE: LOW_STOCK_THRESHOLD is shared with client (/client/lib/constants.ts)
// and documented in /shared/shared-constants.ts - must be kept in sync
export const STOCK = {
  LOW_STOCK_THRESHOLD: 10, // Synchronized via /shared/shared-constants.ts
} as const

// Exchange Rates
export const EXCHANGE_RATE = {
  BNR_XML_URL: 'https://www.bnr.ro/nbrfxrates.xml',
  CRON_SCHEDULE: '0 * * * *', // Every hour at minute 0
  SETTINGS_SINGLETON_ID: 1,
} as const

// Cache Durations
export const CACHE = {
  EXCHANGE_RATE_REVALIDATE_SECONDS: 3600, // 1 hour
} as const

// Validation Rules
// NOTE: PASSWORD_MIN_LENGTH and NAME_MIN_LENGTH are defined in /shared/validation-constants.ts
// and used by both client and server auth schemas for consistency.
// These constants here are kept for reference and non-auth validation.
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 12, // Synchronized via /shared/validation-constants.ts
  NAME_MIN_LENGTH: 2, // Synchronized via /shared/validation-constants.ts
  PRODUCT_MIN_LAUNCH_YEAR: 1800,
  DISCOUNT_MIN_PERCENT: 1,
  DISCOUNT_MAX_PERCENT: 99,
  FEE_MIN_PERCENT: 0,
  FEE_MAX_PERCENT: 50,
  RATING_MIN: 0,
  RATING_MAX: 5,
} as const
