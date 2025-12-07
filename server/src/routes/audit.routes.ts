import { Router } from 'express'
import * as auditController from '../controllers/audit.controller'
import { authenticate, authorize } from '../middleware/auth'
import { asyncHandler } from '../lib/asyncHandler'
import { sensitiveRateLimiter } from '../middleware/rateLimit'
import { validate } from '../middleware/validate'
import { listAuditLogsSchema } from '../schemas/audit'

const router = Router()

// Admin only - list audit logs (stricter rate limit to prevent log enumeration)
router.get(
  '/',
  sensitiveRateLimiter,
  authenticate,
  authorize('ADMIN'),
  validate(listAuditLogsSchema),
  asyncHandler(auditController.listAuditLogs)
)

export default router
