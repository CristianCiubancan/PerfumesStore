/**
 * Application Constants
 *
 * Centralized configuration values that were previously magic numbers/strings.
 * These can be overridden by environment variables where appropriate.
 */

import { SHARED_CONSTANTS } from '../../../shared/shared-constants'
import { VALIDATION_CONSTANTS } from '../../../shared/validation-constants'

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

// Pagination - extends shared constants with server-specific values
export const PAGINATION = {
  ...SHARED_CONSTANTS.PAGINATION,
  MAX_LIMIT: 100,
  SITEMAP_LIMIT: 1000,
} as const

// Stock Management - re-exports shared constants
export const STOCK = SHARED_CONSTANTS.STOCK

// Exchange Rates
export const EXCHANGE_RATE = {
  BNR_XML_URL: 'https://www.bnr.ro/nbrfxrates.xml',
  CRON_SCHEDULE: '0 * * * *', // Every hour at minute 0
  SETTINGS_SINGLETON_ID: 1,
} as const

// Cache Durations
export const CACHE = {
  EXCHANGE_RATE_REVALIDATE_SECONDS: 3600, // 1 hour
  FILTER_COUNTS_MAX_AGE_SECONDS: 60, // 1 minute - counts change with filter selections
} as const

// Validation Rules - extends shared validation constants with server-specific values
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH,
  NAME_MIN_LENGTH: VALIDATION_CONSTANTS.NAME_MIN_LENGTH,
  PRODUCT_MIN_LAUNCH_YEAR: 1800,
  DISCOUNT_MIN_PERCENT: 1,
  DISCOUNT_MAX_PERCENT: 99,
  FEE_MIN_PERCENT: 0,
  FEE_MAX_PERCENT: 50,
  RATING_MIN: 0,
  RATING_MAX: 5,
} as const

// Order Management
export const ORDER = {
  // Time in minutes before a PENDING order is considered stale
  // Stripe Checkout sessions expire after 30 min, we add buffer for webhook delivery
  STALE_PENDING_TIMEOUT_MINUTES: 45,
  // Run cleanup every 15 minutes
  STALE_ORDER_CLEANUP_CRON_SCHEDULE: '*/15 * * * *',
} as const

// Email Campaigns
export const CAMPAIGN = {
  // Check for scheduled campaigns every minute
  CRON_SCHEDULE: '* * * * *',
} as const

// Email Sending
export const EMAIL = {
  // Number of emails to send in parallel per batch
  // Adjust based on your email provider's rate limits (Resend: 10/sec on free tier)
  BATCH_SIZE: 10,
  // Delay between batches in milliseconds (helps avoid rate limiting)
  BATCH_DELAY_MS: 1000,
} as const
