import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import { AppError } from './errorHandler'
import { isProduction } from '../config'

const CSRF_COOKIE_NAME = 'csrf-token'
// CSRF header name - use lowercase for consistency
// HTTP headers are case-insensitive, but we standardize on lowercase
const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Set CSRF token cookie (readable by JavaScript for double-submit pattern)
 *
 * SECURITY NOTE: httpOnly is intentionally set to false for the double-submit cookie pattern.
 *
 * Why httpOnly: false?
 * - The CSRF token must be readable by JavaScript so the client can include it in request headers
 * - The double-submit pattern requires the client to read the cookie and send its value in a custom header
 * - This provides CSRF protection because an attacker cannot read cookies from a different origin
 *
 * Security Considerations:
 * - The token is cryptographically random (32 bytes) making it unpredictable
 * - sameSite: 'strict' prevents the cookie from being sent in cross-site requests
 * - secure: true in production ensures the cookie is only sent over HTTPS
 * - The token itself doesn't grant access; it only proves the request originated from our domain
 *
 * Alternative Approaches (Future Enhancement):
 * - Consider implementing Content Security Policy (CSP) with nonce-based protection
 * - CSP nonces would provide additional defense-in-depth alongside CSRF tokens
 * - Nonce-based CSP would help prevent XSS attacks that could read the CSRF token
 */
export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JS for double-submit pattern
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
}

/**
 * Clear CSRF token cookie
 */
export function clearCsrfCookie(res: Response): void {
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'strict',
  })
}

/**
 * CSRF protection middleware using double-submit cookie pattern.
 * Validates that the X-CSRF-Token header matches the csrf-token cookie.
 *
 * Only applies to state-changing methods (POST, PUT, PATCH, DELETE).
 * GET and HEAD requests are exempt as they should be idempotent.
 *
 * Note: This provides defense-in-depth alongside SameSite=strict cookies.
 */
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  // Skip CSRF check for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) {
    return next()
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME]
  const headerToken = req.get(CSRF_HEADER_NAME)

  // Both cookie and header must be present
  if (!cookieToken || !headerToken) {
    return next(new AppError('CSRF token missing', 403, 'CSRF_TOKEN_MISSING'))
  }

  // Tokens must match (use timing-safe comparison to prevent timing attacks)
  if (!timingSafeEqual(cookieToken, headerToken)) {
    return next(new AppError('CSRF token mismatch', 403, 'CSRF_TOKEN_INVALID'))
  }

  next()
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 *
 * Uses constant-time comparison for both length and content to avoid
 * leaking information about token structure through timing side-channels.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  // Pad both buffers to same length to prevent length-based timing leaks
  const maxLen = Math.max(bufA.length, bufB.length, 64)
  const paddedA = Buffer.alloc(maxLen, 0)
  const paddedB = Buffer.alloc(maxLen, 0)
  bufA.copy(paddedA)
  bufB.copy(paddedB)

  // Constant-time comparison, then verify actual lengths match
  const contentEqual = crypto.timingSafeEqual(paddedA, paddedB)
  const lengthEqual = bufA.length === bufB.length

  // Both conditions checked, but timing only leaks from timingSafeEqual
  return contentEqual && lengthEqual
}
