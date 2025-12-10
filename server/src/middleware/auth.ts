import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, TokenPayload } from '../lib/jwt'
import { AppError } from './errorHandler'
import { getUserTokenVersion } from '../services/auth.service'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies.accessToken

  if (!token) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
  }

  try {
    const payload = verifyAccessToken(token)

    // Verify tokenVersion matches current user's version (for immediate revocation)
    const currentVersion = await getUserTokenVersion(payload.userId)
    if (currentVersion === null || payload.tokenVersion !== currentVersion) {
      return next(new AppError('Session expired. Please login again.', 401, 'SESSION_EXPIRED'))
    }

    req.user = payload
    next()
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return next(err)
    }
    return next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'))
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'))
    }

    next()
  }
}

// Optional authentication - doesn't fail if no token, just sets req.user if valid
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = req.cookies.accessToken

  if (!token) {
    // No token - continue as guest
    return next()
  }

  try {
    const payload = verifyAccessToken(token)

    // Verify tokenVersion matches current user's version
    const currentVersion = await getUserTokenVersion(payload.userId)
    if (currentVersion !== null && payload.tokenVersion === currentVersion) {
      req.user = payload
    }
  } catch {
    // Invalid token - continue as guest (don't fail)
  }

  next()
}
