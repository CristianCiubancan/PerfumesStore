/**
 * Shared Constants
 *
 * Constants that are used by both client and server.
 * These are the single source of truth - imported by:
 * - /server/src/config/constants.ts
 * - /client/lib/constants.ts
 */

export const SHARED_CONSTANTS = {
  // Pagination
  PAGINATION: {
    DEFAULT_LIMIT: 20,
  },

  // Stock Management
  STOCK: {
    LOW_STOCK_THRESHOLD: 10,
  },
} as const
