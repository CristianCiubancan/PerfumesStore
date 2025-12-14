import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { csrfProtection, generateCsrfToken, setCsrfCookie } from '../middleware/csrf'
import { authRateLimiter, refreshRateLimiter } from '../middleware/rateLimit'
import { registerSchema, loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/auth'
import { asyncHandler } from '../lib/asyncHandler'

const router = Router()

// CSRF token endpoint - allows clients to obtain a CSRF token before login/register
router.get('/csrf', (req, res) => {
  const token = generateCsrfToken()
  setCsrfCookie(res, token)
  res.json({ data: { message: 'CSRF token set' } })
})

// Auth routes with CSRF protection
// Client must first call GET /auth/csrf to obtain a CSRF token
router.post('/register', authRateLimiter, csrfProtection, validate(registerSchema), asyncHandler(authController.register))
router.post('/login', authRateLimiter, csrfProtection, validate(loginSchema), asyncHandler(authController.login))

// Refresh token - uses separate rate limiter (more permissive since refresh happens automatically)
router.post('/refresh', refreshRateLimiter, csrfProtection, asyncHandler(authController.refresh))

// Logout routes - rate limited to prevent abuse, CSRF protected for security
router.post('/logout', authRateLimiter, csrfProtection, asyncHandler(authController.logout))
router.post('/logout-all', authRateLimiter, authenticate, csrfProtection, asyncHandler(authController.logoutAllDevices))
router.get('/profile', authenticate, asyncHandler(authController.getProfile))
router.post('/change-password', authenticate, csrfProtection, validate(changePasswordSchema), asyncHandler(authController.changePassword))

// Password reset routes - no authentication required, rate limited for security
router.post('/forgot-password', authRateLimiter, csrfProtection, validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword))
router.post('/reset-password', authRateLimiter, csrfProtection, validate(resetPasswordSchema), asyncHandler(authController.resetPassword))

export default router
