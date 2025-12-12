import { Router } from 'express'
import * as campaignController from '../controllers/campaign.controller'
import { authenticate, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../lib/asyncHandler'
import { validate } from '../middleware/validate'
import { sensitiveRateLimiter } from '../middleware/rateLimit'
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdSchema,
  scheduleCampaignSchema,
  listCampaignsSchema,
} from '../schemas/campaign'

const router = Router()

// All routes require admin authentication
router.use(authenticate)
router.use(authorize('ADMIN'))

// Rate limiting for campaign operations (same as newsletter)
router.use(sensitiveRateLimiter)

// ============================================================================
// Campaign CRUD Routes
// ============================================================================

/**
 * GET /api/admin/campaigns
 * List all campaigns with pagination and optional status filter
 */
router.get('/', validate(listCampaignsSchema), asyncHandler(campaignController.listCampaigns))

/**
 * GET /api/admin/campaigns/templates
 * Get available campaign templates for the dropdown
 */
router.get('/templates', asyncHandler(campaignController.getCampaignTemplates))

/**
 * GET /api/admin/campaigns/:id
 * Get a single campaign by ID
 */
router.get('/:id', validate(campaignIdSchema), asyncHandler(campaignController.getCampaign))

/**
 * POST /api/admin/campaigns
 * Create a new campaign (starts as DRAFT)
 */
router.post(
  '/',
  csrfProtection,
  validate(createCampaignSchema),
  asyncHandler(campaignController.createCampaign)
)

/**
 * PUT /api/admin/campaigns/:id
 * Update an existing campaign
 */
router.put(
  '/:id',
  csrfProtection,
  validate(updateCampaignSchema),
  asyncHandler(campaignController.updateCampaign)
)

/**
 * DELETE /api/admin/campaigns/:id
 * Delete a campaign
 */
router.delete(
  '/:id',
  csrfProtection,
  validate(campaignIdSchema),
  asyncHandler(campaignController.deleteCampaign)
)

// ============================================================================
// Campaign Action Routes
// ============================================================================

/**
 * POST /api/admin/campaigns/:id/schedule
 * Schedule a campaign for future delivery
 */
router.post(
  '/:id/schedule',
  csrfProtection,
  validate(scheduleCampaignSchema),
  asyncHandler(campaignController.scheduleCampaign)
)

/**
 * POST /api/admin/campaigns/:id/send
 * Send a campaign immediately
 */
router.post(
  '/:id/send',
  csrfProtection,
  validate(campaignIdSchema),
  asyncHandler(campaignController.sendCampaign)
)

/**
 * POST /api/admin/campaigns/:id/cancel
 * Cancel a scheduled campaign (moves back to DRAFT)
 */
router.post(
  '/:id/cancel',
  csrfProtection,
  validate(campaignIdSchema),
  asyncHandler(campaignController.cancelScheduledCampaign)
)

export default router
