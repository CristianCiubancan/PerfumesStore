import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

/**
 * Middleware that assigns a unique request ID to each incoming request.
 * The ID is available on req.requestId and in the X-Request-ID response header.
 *
 * If the client sends an X-Request-ID header, it will be used (for distributed tracing).
 * Otherwise, a new UUID is generated.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Use client-provided request ID or generate a new one
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID()

  // Attach to request object for use in handlers/logging
  req.requestId = requestId

  // Add to response headers for client-side debugging
  res.setHeader('X-Request-ID', requestId)

  next()
}
