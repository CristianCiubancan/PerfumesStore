import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

/**
 * Generates a weak ETag from response content
 * Uses MD5 for speed - this is not for security, just cache validation
 */
function generateETag(content: string): string {
  const hash = crypto.createHash('md5').update(content).digest('hex')
  return `W/"${hash}"`
}

/**
 * Middleware that adds ETag headers to responses and handles conditional requests.
 *
 * When applied to a route:
 * - Generates an ETag from the response body
 * - Checks If-None-Match header and returns 304 if content hasn't changed
 * - Sets Cache-Control header for browser caching hints
 *
 * Best used on GET endpoints that return cacheable data like:
 * - Product listings
 * - Filter options
 * - Static reference data
 */
export function etagMiddleware(maxAge: number = 60) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only apply to GET requests
    if (req.method !== 'GET') {
      next()
      return
    }

    // Store original json method
    const originalJson = res.json.bind(res)

    // Override json method to intercept response
    res.json = function (body: unknown): Response {
      const content = JSON.stringify(body)
      const etag = generateETag(content)

      // Set ETag header
      res.setHeader('ETag', etag)

      // Set Cache-Control for client-side caching hints
      // must-revalidate ensures the browser checks with server before using cached version
      res.setHeader('Cache-Control', `private, max-age=${maxAge}, must-revalidate`)

      // Check If-None-Match header from client
      const clientETag = req.headers['if-none-match']

      if (clientETag && clientETag === etag) {
        // Content hasn't changed - return 304 Not Modified
        res.status(304)
        return res.end()
      }

      // Content is different or first request - send full response
      return originalJson(body)
    }

    next()
  }
}

/**
 * Short-lived ETag for frequently changing data (e.g., product listings with inventory)
 * Default: 30 seconds
 */
export const shortEtag = etagMiddleware(30)

/**
 * Medium-lived ETag for semi-static data (e.g., filter counts)
 * Default: 60 seconds
 */
export const mediumEtag = etagMiddleware(60)

/**
 * Long-lived ETag for rarely changing data (e.g., filter options, static lookups)
 * Default: 5 minutes
 */
export const longEtag = etagMiddleware(300)
