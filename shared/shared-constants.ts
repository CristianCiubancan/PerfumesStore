/**
 * Shared Constants
 *
 * Constants that are used by both client and server and must remain synchronized.
 *
 * IMPORTANT: These values are duplicated in:
 * - /server/src/config/constants.ts
 * - /client/lib/constants.ts
 *
 * Any changes here must be reflected in both locations.
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
