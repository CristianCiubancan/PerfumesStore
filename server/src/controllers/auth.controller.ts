import { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { RegisterInput, LoginInput, ChangePasswordInput, ForgotPasswordInput, ResetPasswordInput } from '../schemas/auth'
import { AUTH } from '../config/constants'
import { config, isProduction } from '../config'
import { generateCsrfToken, setCsrfCookie, clearCsrfCookie } from '../middleware/csrf'
import { createAuditLog } from '../lib/auditLogger'
import { AppError } from '../middleware/errorHandler'
import { sendPasswordResetEmail, normalizeLocale } from '../services/email/email.service'

/**
 * Extract client context for audit logging
 */
function getTokenContext(req: Request) {
  return {
    userAgent: req.get('user-agent'),
    ipAddress: req.ip || req.socket.remoteAddress,
  }
}

/**
 * Set authentication cookies with secure defaults
 *
 * SECURITY WARNING - Development vs Production Cookie Settings:
 *
 * In DEVELOPMENT (secure: false):
 * - Cookies can be sent over HTTP (not just HTTPS)
 * - This allows local development without SSL certificates
 * - NEVER use these settings in production!
 *
 * In PRODUCTION (secure: true):
 * - Cookies are only sent over HTTPS connections
 * - Prevents man-in-the-middle attacks on insecure networks
 * - Required for PCI compliance and security best practices
 *
 * Additional Security Measures:
 * - httpOnly: true prevents JavaScript access to tokens
 * - sameSite: 'lax' provides CSRF protection while allowing cross-origin API calls
 * - Tokens are cryptographically signed and expire automatically
 */
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    // Use 'lax' to support cross-origin API requests when frontend/backend are on different origins
    sameSite: 'lax',
    maxAge: AUTH.ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
    // Set domain for cross-subdomain cookies (e.g., ".example.com")
    ...(config.COOKIE_DOMAIN && { domain: config.COOKIE_DOMAIN }),
  })
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: AUTH.REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
    ...(config.COOKIE_DOMAIN && { domain: config.COOKIE_DOMAIN }),
  })
  // Set CSRF token for double-submit cookie pattern
  setCsrfCookie(res, generateCsrfToken())
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    ...(config.COOKIE_DOMAIN && { domain: config.COOKIE_DOMAIN }),
  })
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    ...(config.COOKIE_DOMAIN && { domain: config.COOKIE_DOMAIN }),
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

  try {
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
  } catch (error) {
    // Audit log for failed login attempt
    // Note: The LOGIN_FAILED action inherently indicates failure
    createAuditLog(req, {
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      newValue: { email: input.email, reason: 'authentication_failed' },
    })

    // Re-throw the error to be handled by error middleware
    throw error
  }
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

/**
 * Request password reset
 * SEC: Always returns success to prevent email enumeration
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const input: ForgotPasswordInput = req.body

  // Extract locale from Accept-Language header or default to 'ro'
  const locale = normalizeLocale(req.headers['accept-language']?.split(',')[0]?.split('-')[0])

  // Create token (returns null if user doesn't exist, but we don't reveal this)
  const token = await authService.createPasswordResetToken(input.email)

  if (token) {
    // Send email asynchronously - don't wait for it to avoid timing attacks
    sendPasswordResetEmail(input.email, token, locale).catch((err) => {
      // Log error but don't expose to user
      console.error('Failed to send password reset email:', err)
    })

    // Audit log for password reset request
    createAuditLog(req, {
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'USER',
      newValue: { email: input.email },
    })
  }

  // Always return success to prevent email enumeration
  res.json({
    data: {
      message: 'If an account exists with this email, you will receive a password reset link.',
    },
  })
}

/**
 * Reset password with token
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const input: ResetPasswordInput = req.body

  await authService.resetPassword(input.token, input.newPassword)

  // Audit log for password reset
  createAuditLog(req, {
    action: 'PASSWORD_RESET_COMPLETED',
    entityType: 'USER',
  })

  res.json({
    data: {
      message: 'Password has been reset successfully. Please login with your new password.',
    },
  })
}
