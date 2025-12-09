/**
 * Client-side Constants
 *
 * Centralized configuration values for the frontend application.
 */

// Open Graph Image Dimensions (standard OG image size)
export const OG_IMAGE = {
  WIDTH: 1200,
  HEIGHT: 630,
} as const

// UI/UX Timing
export const TIMING = {
  DEBOUNCE_MS: 400,
  DEBOUNCE_SHORT_MS: 300,
  STALE_TIME_MS: 60 * 1000, // 1 minute
  // Animation/feedback delays
  ADD_TO_CART_DELAY_MS: 300,
  ADD_TO_CART_FEEDBACK_MS: 2000,
  NEWSLETTER_SUBMIT_MS: 1000,
  NEWSLETTER_RESET_MS: 3000,
  BADGE_ANIMATION_MS: 300,
  COUNTDOWN_INTERVAL_MS: 1000,
  PULSE_ANIMATION_DURATION_S: 2,
} as const

// Time unit calculations (for countdown timers)
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 1000 * 60,
  HOUR: 1000 * 60 * 60,
  DAY: 1000 * 60 * 60 * 24,
} as const

// Cache Durations
export const CACHE = {
  EXCHANGE_RATE_DURATION_MS: 60 * 60 * 1000, // 1 hour
} as const

// React Query Configuration
export const QUERY = {
  STALE_TIME_MS: 60 * 1000, // 1 minute
  RETRY_COUNT: 1,
} as const

// Sitemap Configuration
export const SITEMAP = {
  REVALIDATE_SECONDS: 3600, // 1 hour
  PRODUCT_LIMIT: 1000,
  PRIORITY: {
    HOME: 1.0,
    STORE: 0.9,
    PRODUCT: 0.8,
    DEFAULT: 0.5,
  },
  CHANGE_FREQUENCY: {
    HOME: 'daily',
    STORE: 'daily',
    PRODUCT: 'weekly',
    DEFAULT: 'monthly',
  },
} as const

// Rating Configuration
export const RATING = {
  MIN: 0,
  MAX: 5,
  STEP: 0.5,
} as const

// SEO Configuration
export const SEO = {
  DESCRIPTION_MAX_LENGTH: 100,
} as const

// Pagination
// NOTE: DEFAULT_LIMIT is shared with server (/server/src/config/constants.ts)
// and documented in /shared/shared-constants.ts - must be kept in sync
export const PAGINATION = {
  DEFAULT_LIMIT: 20, // Synchronized via /shared/shared-constants.ts
  PRODUCTS_PER_PAGE: 12,
  ADMIN_DEFAULT_LIMIT: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50] as const,
} as const

// Stock Management
// NOTE: LOW_STOCK_THRESHOLD is shared with server (/server/src/config/constants.ts)
// and documented in /shared/shared-constants.ts - must be kept in sync
export const STOCK = {
  LOW_STOCK_THRESHOLD: 10, // Synchronized via /shared/shared-constants.ts
} as const

// File Upload
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
} as const
