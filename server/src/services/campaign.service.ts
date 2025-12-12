import { Prisma, CampaignStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/errorHandler'
import {
  sendNewsletterCampaignByTemplate,
  type CampaignResult,
} from './email'
import { getCampaignTemplates, getTemplate } from './email/templates'
import { logger } from '../lib/logger'

// ============================================================================
// Types
// ============================================================================

export interface CreateCampaignInput {
  name: string
  templateId: string
}

export interface UpdateCampaignInput {
  name?: string
  templateId?: string
}

export interface ListCampaignsParams {
  page?: number
  limit?: number
  status?: CampaignStatus
}

// ============================================================================
// Template Validation
// ============================================================================

/**
 * Validate that a template exists and is a campaign template
 */
function validateTemplateId(templateId: string): void {
  const template = getTemplate(templateId)
  if (!template) {
    throw new AppError(`Template '${templateId}' not found`, 400, 'TEMPLATE_NOT_FOUND')
  }
  if (template.metadata.category !== 'campaign') {
    throw new AppError(
      `Template '${templateId}' is not a campaign template`,
      400,
      'INVALID_TEMPLATE_TYPE'
    )
  }
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Create a new campaign (starts as DRAFT)
 */
export async function createCampaign(input: CreateCampaignInput) {
  // Validate template exists
  validateTemplateId(input.templateId)

  return prisma.newsletterCampaign.create({
    data: {
      name: input.name,
      templateId: input.templateId,
      status: 'DRAFT',
    },
  })
}

/**
 * Update a campaign (only DRAFT or FAILED campaigns can be edited)
 */
export async function updateCampaign(id: number, input: UpdateCampaignInput) {
  const existing = await prisma.newsletterCampaign.findUnique({ where: { id } })

  if (!existing) {
    throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
  }

  // Prevent editing campaigns that are being sent or completed
  if (['SENDING', 'SENT'].includes(existing.status)) {
    throw new AppError(
      'Cannot edit campaign that is being sent or already sent',
      400,
      'CAMPAIGN_NOT_EDITABLE'
    )
  }

  // Validate template if being changed
  if (input.templateId) {
    validateTemplateId(input.templateId)
  }

  const data: Prisma.NewsletterCampaignUpdateInput = {}

  if (input.name !== undefined) data.name = input.name
  if (input.templateId !== undefined) data.templateId = input.templateId

  const updated = await prisma.newsletterCampaign.update({
    where: { id },
    data,
  })

  return { oldValue: existing, newValue: updated }
}

/**
 * Get a single campaign by ID
 */
export async function getCampaign(id: number) {
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } })

  if (!campaign) {
    throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
  }

  return campaign
}

/**
 * Delete a campaign (cannot delete campaigns that are SENDING)
 */
export async function deleteCampaign(id: number) {
  const existing = await prisma.newsletterCampaign.findUnique({ where: { id } })

  if (!existing) {
    throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
  }

  if (existing.status === 'SENDING') {
    throw new AppError('Cannot delete campaign that is currently sending', 400, 'CAMPAIGN_SENDING')
  }

  await prisma.newsletterCampaign.delete({ where: { id } })

  return existing
}

/**
 * List campaigns with pagination and optional status filter
 */
export async function listCampaigns(params: ListCampaignsParams = {}) {
  const { page = 1, limit = 20, status } = params
  const skip = (page - 1) * limit

  const where: Prisma.NewsletterCampaignWhereInput = {}
  if (status) where.status = status

  const [campaigns, total] = await Promise.all([
    prisma.newsletterCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.newsletterCampaign.count({ where }),
  ])

  return {
    campaigns,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * Get available campaign templates
 */
export function getAvailableCampaignTemplates() {
  return getCampaignTemplates()
}

// ============================================================================
// Scheduling Operations
// ============================================================================

/**
 * Schedule a campaign for future delivery
 */
export async function scheduleCampaign(id: number, scheduledFor: string) {
  const campaign = await getCampaign(id)

  if (!['DRAFT', 'FAILED'].includes(campaign.status)) {
    throw new AppError('Can only schedule draft or failed campaigns', 400, 'INVALID_STATUS')
  }

  // Validate template still exists
  validateTemplateId(campaign.templateId)

  const scheduledDate = new Date(scheduledFor)
  if (scheduledDate <= new Date()) {
    throw new AppError('Scheduled time must be in the future', 400, 'INVALID_SCHEDULE_TIME')
  }

  const updated = await prisma.newsletterCampaign.update({
    where: { id },
    data: {
      status: 'SCHEDULED',
      scheduledFor: scheduledDate,
    },
  })

  return { oldValue: campaign, newValue: updated }
}

/**
 * Cancel a scheduled campaign (moves back to DRAFT)
 */
export async function cancelScheduledCampaign(id: number) {
  const campaign = await getCampaign(id)

  if (campaign.status !== 'SCHEDULED') {
    throw new AppError('Can only cancel scheduled campaigns', 400, 'INVALID_STATUS')
  }

  const updated = await prisma.newsletterCampaign.update({
    where: { id },
    data: {
      status: 'DRAFT',
      scheduledFor: null,
    },
  })

  return { oldValue: campaign, newValue: updated }
}

// ============================================================================
// Send Operations
// ============================================================================

/**
 * Send a campaign immediately (manual trigger)
 */
export async function sendCampaignNow(id: number): Promise<CampaignResult> {
  const campaign = await getCampaign(id)

  if (!['DRAFT', 'FAILED'].includes(campaign.status)) {
    throw new AppError('Can only send draft or failed campaigns', 400, 'INVALID_STATUS')
  }

  return executeCampaignSend(campaign)
}

/**
 * Core send logic - used by both immediate and scheduled sends
 * Uses optimistic locking to prevent duplicate sends
 */
export async function executeCampaignSend(
  campaign: Awaited<ReturnType<typeof getCampaign>>
): Promise<CampaignResult> {
  // Validate template exists before sending
  validateTemplateId(campaign.templateId)

  // Acquire lock to prevent duplicate sends using atomic update
  const locked = await prisma.newsletterCampaign.updateMany({
    where: {
      id: campaign.id,
      sendingStartedAt: null,
      status: { in: ['DRAFT', 'SCHEDULED', 'FAILED'] },
    },
    data: {
      sendingStartedAt: new Date(),
      status: 'SENDING',
    },
  })

  if (locked.count === 0) {
    // Check current state to provide a more helpful error message
    const current = await prisma.newsletterCampaign.findUnique({
      where: { id: campaign.id },
      select: { status: true, sendingStartedAt: true },
    })

    if (!current) {
      throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
    }

    if (current.status === 'SENT') {
      throw new AppError('Campaign has already been sent', 400, 'CAMPAIGN_ALREADY_SENT')
    }

    if (current.status === 'SENDING' || current.sendingStartedAt) {
      throw new AppError(
        'Campaign is currently being sent by another process',
        409,
        'CAMPAIGN_SEND_IN_PROGRESS'
      )
    }

    // Fallback for unexpected states
    throw new AppError(
      `Cannot send campaign in ${current.status} status`,
      400,
      'INVALID_CAMPAIGN_STATE'
    )
  }

  try {
    // Get all active subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true, preferredLanguage: true },
    })

    if (subscribers.length === 0) {
      await prisma.newsletterCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'FAILED',
          totalRecipients: 0,
          sentCount: 0,
          failedCount: 0,
          sendingStartedAt: null,
        },
      })
      throw new AppError('No active subscribers found', 404, 'NO_SUBSCRIBERS')
    }

    // Send emails using template
    const result = await sendNewsletterCampaignByTemplate(subscribers, campaign.templateId)

    // Determine final status based on results
    const finalStatus: CampaignStatus = result.failed > 0 && result.sent === 0 ? 'FAILED' : 'SENT'

    // Update campaign with results
    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        status: finalStatus,
        sentAt: new Date(),
        totalRecipients: result.total,
        sentCount: result.sent,
        failedCount: result.failed,
      },
    })

    logger.info(
      `Campaign ${campaign.id} "${campaign.name}" completed: ${result.sent}/${result.total} sent`,
      'CampaignService'
    )

    return result
  } catch (error) {
    // Reset lock on failure (unless it's a NO_SUBSCRIBERS error which already updated)
    if (error instanceof AppError && error.code === 'NO_SUBSCRIBERS') {
      throw error
    }

    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'FAILED',
        sendingStartedAt: null,
      },
    })
    throw error
  }
}

// ============================================================================
// Cron Job Handler
// ============================================================================

/**
 * Process scheduled campaigns (called by cron job every minute)
 */
export async function processScheduledCampaigns(): Promise<void> {
  const now = new Date()

  // Find campaigns ready to send
  const campaigns = await prisma.newsletterCampaign.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { lte: now },
      sendingStartedAt: null,
    },
  })

  if (campaigns.length === 0) {
    return
  }

  logger.info(`Found ${campaigns.length} scheduled campaign(s) to process`, 'CampaignService')

  for (const campaign of campaigns) {
    try {
      await executeCampaignSend(campaign)
    } catch (error) {
      logger.error(
        `Failed to send scheduled campaign ${campaign.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CampaignService'
      )
    }
  }
}
