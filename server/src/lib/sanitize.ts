/**
 * Sanitization utilities for preventing XSS attacks
 * Provides defense-in-depth for user-generated content
 */

// HTML entity mapping for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char)
}

/**
 * Strips HTML tags from a string
 */
export function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Sanitizes a string by stripping HTML tags
 * Use this for user-provided text that should never contain HTML
 * Note: We don't escape HTML entities because React/frontend frameworks
 * automatically escape text content when rendering
 */
export function sanitizeString(str: string | null | undefined): string {
  if (str === null || str === undefined) return ''

  return stripHtmlTags(String(str))
}

/**
 * Sanitizes text fields in a product object
 * Also removes internal fields like deletedAt from API responses
 */
export function sanitizeProductFields<T extends Record<string, unknown>>(
  product: T
): T {
  const fieldsToSanitize = ['name', 'brand', 'description'] as const
  const fieldsToRemove = ['deletedAt'] as const
  const sanitized = { ...product }

  for (const field of fieldsToSanitize) {
    if (field in sanitized && typeof sanitized[field] === 'string') {
      (sanitized as Record<string, unknown>)[field] = sanitizeString(
        sanitized[field] as string
      )
    }
  }

  // Remove internal fields from API response
  for (const field of fieldsToRemove) {
    delete (sanitized as Record<string, unknown>)[field]
  }

  return sanitized
}

/**
 * Sanitizes an array of products
 */
export function sanitizeProducts<T extends Record<string, unknown>>(
  products: T[]
): T[] {
  return products.map(sanitizeProductFields)
}
