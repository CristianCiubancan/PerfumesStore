import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { authRateLimiter } from '../middleware/rateLimit'
import { registerSchema, loginSchema, changePasswordSchema } from '../schemas/auth'
import { asyncHandler } from '../lib/asyncHandler'

const router = Router()

// Public auth routes (no CSRF - these SET the CSRF token)
router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(authController.register))
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(authController.login))

// Refresh token - rate limited and CSRF protected (uses existing token)
router.post('/refresh', authRateLimiter, csrfProtection, asyncHandler(authController.refresh))

// Logout routes - rate limited to prevent abuse, CSRF protected for security
router.post('/logout', authRateLimiter, csrfProtection, asyncHandler(authController.logout))
router.post('/logout-all', authRateLimiter, authenticate, csrfProtection, asyncHandler(authController.logoutAllDevices))
router.get('/profile', authenticate, asyncHandler(authController.getProfile))
router.post('/change-password', authenticate, csrfProtection, validate(changePasswordSchema), asyncHandler(authController.changePassword))

export default router
