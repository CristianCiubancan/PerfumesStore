import { Request, Response } from 'express'
import * as campaignService from '../services/campaign.service'
import { createAuditLog } from '../lib/auditLogger'
import { parseIdParam } from '../lib/parseParams'
import { isEmailEnabled } from '../services/email'
import { AppError } from '../middleware/errorHandler'
import type { CampaignStatus } from '@prisma/client'

/**
 * GET /api/admin/campaigns
 * List campaigns with optional pagination and status filter
 */
export async function listCampaigns(req: Request, res: Response): Promise<void> {
  const page = req.query?.page ? parseInt(req.query.page as string, 10) : 1
  const limit = req.query?.limit ? parseInt(req.query.limit as string, 10) : 20
  const status = req.query?.status as CampaignStatus | undefined

  const result = await campaignService.listCampaigns({
    page,
    limit,
    status,
  })

  res.json({ data: result })
}

/**
 * GET /api/admin/campaigns/:id
 * Get a single campaign by ID
 */
export async function getCampaign(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)
  const campaign = await campaignService.getCampaign(id)
  res.json({ data: campaign })
}

/**
 * POST /api/admin/campaigns
 * Create a new campaign
 */
export async function createCampaign(req: Request, res: Response): Promise<void> {
  const campaign = await campaignService.createCampaign(req.body)

  createAuditLog(req, {
    action: 'CREATE',
    entityType: 'NEWSLETTER_CAMPAIGN',
    entityId: campaign.id,
    newValue: campaign,
  })

  res.status(201).json({ data: campaign })
}

/**
 * PUT /api/admin/campaigns/:id
 * Update an existing campaign
 */
export async function updateCampaign(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)
  const { oldValue, newValue } = await campaignService.updateCampaign(id, req.body)

  createAuditLog(req, {
    action: 'UPDATE',
    entityType: 'NEWSLETTER_CAMPAIGN',
    entityId: id,
    oldValue,
    newValue,
  })

  res.json({ data: newValue })
}

/**
 * DELETE /api/admin/campaigns/:id
 * Delete a campaign
 */
export async function deleteCampaign(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)
  const deleted = await campaignService.deleteCampaign(id)

  createAuditLog(req, {
    action: 'DELETE',
    entityType: 'NEWSLETTER_CAMPAIGN',
    entityId: id,
    oldValue: deleted,
  })

  res.json({ data: { message: 'Campaign deleted successfully' } })
}

/**
 * POST /api/admin/campaigns/:id/schedule
 * Schedule a campaign for future delivery
 */
export async function scheduleCampaign(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)
  const { scheduledFor } = req.body

  const { oldValue, newValue } = await campaignService.scheduleCampaign(id, scheduledFor)

  createAuditLog(req, {
    action: 'UPDATE',
    entityType: 'NEWSLETTER_CAMPAIGN',
    entityId: id,
    oldValue,
    newValue,
  })

  res.json({ data: newValue })
}

/**
 * POST /api/admin/campaigns/:id/send
 * Send a campaign immediately
 */
export async function sendCampaign(req: Request, res: Response): Promise<void> {
  if (!isEmailEnabled()) {
    throw new AppError('Email service not configured', 503, 'EMAIL_SERVICE_UNAVAILABLE')
  }

  const id = parseIdParam(req.params.id)
  const campaign = await campaignService.getCampaign(id)
  const result = await campaignService.sendCampaignNow(id)

  createAuditLog(req, {
    action: 'CREATE',
    entityType: 'NEWSLETTER_CAMPAIGN',
    entityId: id,
    oldValue: campaign,
    newValue: { status: 'SENT', result },
  })

  res.json({
    data: {
      message: 'Campaign sent successfully',
      result,
    },
  })
}

/**
 * POST /api/admin/campaigns/:id/cancel
 * Cancel a scheduled campaign (moves back to DRAFT)
 */
export async function cancelScheduledCampaign(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req.params.id)
  const { oldValue, newValue } = await campaignService.cancelScheduledCampaign(id)

  createAuditLog(req, {
    action: 'UPDATE',
    entityType: 'NEWSLETTER_CAMPAIGN',
    entityId: id,
    oldValue,
    newValue,
  })

  res.json({ data: newValue })
}

/**
 * GET /api/admin/campaigns/templates
 * Get available campaign templates
 */
export async function getCampaignTemplates(_req: Request, res: Response): Promise<void> {
  const templates = campaignService.getAvailableCampaignTemplates()
  res.json({ data: templates })
}
