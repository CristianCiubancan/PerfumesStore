import { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { RegisterInput, LoginInput, ChangePasswordInput } from '../schemas/auth'
import { AUTH } from '../config/constants'
import { isProduction } from '../config'
import { generateCsrfToken, setCsrfCookie, clearCsrfCookie } from '../middleware/csrf'
import { createAuditLog } from '../lib/auditLogger'
import { AppError } from '../middleware/errorHandler'

/**
 * Extract client context for audit logging
 */
function getTokenContext(req: Request) {
  return {
    userAgent: req.get('user-agent'),
    ipAddress: req.ip || req.socket.remoteAddress,
  }
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: AUTH.ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
  })
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: AUTH.REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  })
  // Set CSRF token for double-submit cookie pattern
  setCsrfCookie(res, generateCsrfToken())
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
  })
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
  })
  clearCsrfCookie(res)
}

export async function register(req: Request, res: Response): Promise<void> {
  const input: RegisterInput = req.body
  const context = getTokenContext(req)
  const result = await authService.register(input, context)

  setAuthCookies(res, result.accessToken, result.refreshToken)

  res.status(201).json({
    data: {
      user: result.user,
    },
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const input: LoginInput = req.body
  const context = getTokenContext(req)
  const result = await authService.login(input, context)

  setAuthCookies(res, result.accessToken, result.refreshToken)

  // Audit log for successful login
  // Note: We manually set user context since req.user is not populated yet
  const loginReq = {
    ...req,
    user: { userId: result.user.id, email: result.user.email, role: result.user.role },
  } as Request

  createAuditLog(loginReq, {
    action: 'LOGIN',
    entityType: 'USER',
    entityId: result.user.id,
    newValue: { email: result.user.email },
  })

  res.json({
    data: {
      user: result.user,
    },
  })
}

export async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies.refreshToken

  // Revoke the refresh token server-side
  await authService.logout(refreshToken)

  // Audit log for logout (only if user was authenticated)
  createAuditLog(req, {
    action: 'LOGOUT',
    entityType: 'USER',
    entityId: req.user?.userId,
  })

  // Clear cookies
  clearAuthCookies(res)
  res.json({ data: { message: 'Logged out successfully' } })
}

export async function logoutAllDevices(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED')
  }
  const userId = req.user.userId

  // Revoke all tokens for this user
  await authService.logoutAllDevices(userId)

  // Clear cookies for current session
  clearAuthCookies(res)
  res.json({ data: { message: 'Logged out from all devices successfully' } })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies.refreshToken
  const context = getTokenContext(req)
  const result = await authService.refreshTokens(refreshToken, context)

  setAuthCookies(res, result.accessToken, result.refreshToken)

  res.json({
    data: {
      user: result.user,
    },
  })
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED')
  }
  const userId = req.user.userId
  const user = await authService.getProfile(userId)
  res.json({ data: user })
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED')
  }
  const userId = req.user.userId
  const input: ChangePasswordInput = req.body
  const result = await authService.changePassword(userId, input)

  // Audit log for password change
  createAuditLog(req, {
    action: 'PASSWORD_CHANGE',
    entityType: 'USER',
    entityId: userId,
  })

  // Clear cookies since all sessions are invalidated
  clearAuthCookies(res)
  res.json({ data: result })
}
