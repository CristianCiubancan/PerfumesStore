/**
 * Shared Validation Constants
 *
 * Single source of truth for validation constants used by both client and server.
 * Imported by:
 * - /server/src/config/constants.ts
 * - /client/lib/schemas/auth.ts
 * - /server/src/schemas/auth.ts
 */

export const VALIDATION_CONSTANTS = {
  // Password validation
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_RULES: {
    UPPERCASE: /[A-Z]/,
    LOWERCASE: /[a-z]/,
    NUMBER: /[0-9]/,
    SPECIAL_CHAR: /[^A-Za-z0-9]/,
  },
  PASSWORD_ERROR_MESSAGES: {
    MIN_LENGTH: 'Password must be at least 12 characters',
    UPPERCASE: 'Password must contain at least one uppercase letter',
    LOWERCASE: 'Password must contain at least one lowercase letter',
    NUMBER: 'Password must contain at least one number',
    SPECIAL_CHAR: 'Password must contain at least one special character',
  },

  // Name validation
  NAME_MIN_LENGTH: 2,
  NAME_ERROR_MESSAGE: 'Name must be at least 2 characters',
} as const
