/**
 * Utility functions for parsing request parameters.
 * Centralizes parseInt/parseFloat logic to reduce duplication across controllers.
 */

/**
 * Parse a string parameter to an integer.
 * Returns undefined if the value is falsy or not a valid number.
 */
export function parseIntParam(value: unknown): number | undefined {
  if (!value) return undefined
  const parsed = parseInt(String(value), 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

/**
 * Parse a string parameter to a float.
 * Returns undefined if the value is falsy or not a valid number.
 */
export function parseFloatParam(value: unknown): number | undefined {
  if (!value) return undefined
  const parsed = parseFloat(String(value))
  return Number.isNaN(parsed) ? undefined : parsed
}

/**
 * Parse a route parameter ID to an integer.
 * Always returns a number (defaults to NaN if invalid, which Prisma will reject).
 */
export function parseIdParam(value: string): number {
  return parseInt(value, 10)
}

/**
 * Parse a comma-separated string of IDs into an array of numbers.
 * Returns undefined if the value is falsy.
 */
export function parseIdArrayParam(value: unknown): number[] | undefined {
  if (!value) return undefined
  return String(value)
    .split(',')
    .filter(Boolean)
    .map((id) => parseInt(id, 10))
    .filter((id) => !Number.isNaN(id))
}

/**
 * Parse a date string parameter to a Date object.
 * Returns undefined if the value is falsy or not a valid date.
 */
export function parseDateParam(value: unknown): Date | undefined {
  if (!value) return undefined
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? undefined : date
}

/**
 * Parse a string parameter to a boolean.
 * Returns undefined if the value is falsy.
 * Accepts 'true', '1' as true and 'false', '0' as false.
 */
export function parseBooleanParam(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const str = String(value).toLowerCase()
  if (str === 'true' || str === '1') return true
  if (str === 'false' || str === '0') return false
  return undefined
}
