import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'
import * as campaignService from '../campaign.service'
import * as emailService from '../email'

// Mock the email service
jest.mock('../email', () => ({
  sendNewsletterCampaignByTemplate: jest.fn(),
}))

// Mock the template registry
jest.mock('../email/templates', () => ({
  getCampaignTemplates: jest.fn(() => [
    {
      id: 'campaign-example-promo',
      name: 'Example Promo',
      description: 'A promotional email template',
      category: 'campaign',
      variables: [],
    },
  ]),
  getTemplate: jest.fn((id: string) => {
    if (id === 'campaign-example-promo') {
      return {
        metadata: {
          id: 'campaign-example-promo',
          name: 'Example Promo',
          description: 'A promotional email template',
          category: 'campaign',
          variables: [],
        },
        render: jest.fn(() => ({ subject: 'Test', html: '<p>Test</p>', text: 'Test' })),
        getSampleData: jest.fn(() => ({})),
      }
    }
    if (id === 'order-confirmation') {
      return {
        metadata: {
          id: 'order-confirmation',
          name: 'Order Confirmation',
          description: 'Transactional email',
          category: 'transactional',
          variables: [],
        },
        render: jest.fn(),
        getSampleData: jest.fn(),
      }
    }
    return undefined
  }),
}))

describe('CampaignService', () => {
  const mockCampaign = {
    id: 1,
    name: 'Test Campaign',
    templateId: 'campaign-example-promo',
    status: 'DRAFT' as const,
    scheduledFor: null,
    sentAt: null,
    totalRecipients: null,
    sentCount: null,
    failedCount: null,
    sendingStartedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockSubscribers = [
    { email: 'user1@example.com', preferredLanguage: 'en' },
    { email: 'user2@example.com', preferredLanguage: 'ro' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  describe('createCampaign', () => {
    it('should create a new campaign with valid template', async () => {
      ;(prisma.newsletterCampaign.create as jest.Mock).mockResolvedValue(mockCampaign)

      const result = await campaignService.createCampaign({
        name: 'Test Campaign',
        templateId: 'campaign-example-promo',
      })

      expect(prisma.newsletterCampaign.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Campaign',
          templateId: 'campaign-example-promo',
          status: 'DRAFT',
        },
      })
      expect(result).toEqual(mockCampaign)
    })

    it('should throw error for non-existent template', async () => {
      await expect(
        campaignService.createCampaign({
          name: 'Test Campaign',
          templateId: 'non-existent-template',
        })
      ).rejects.toThrow(AppError)

      await expect(
        campaignService.createCampaign({
          name: 'Test Campaign',
          templateId: 'non-existent-template',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'TEMPLATE_NOT_FOUND',
      })
    })

    it('should throw error for non-campaign template', async () => {
      await expect(
        campaignService.createCampaign({
          name: 'Test Campaign',
          templateId: 'order-confirmation',
        })
      ).rejects.toThrow(AppError)

      await expect(
        campaignService.createCampaign({
          name: 'Test Campaign',
          templateId: 'order-confirmation',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_TEMPLATE_TYPE',
      })
    })
  })

  describe('updateCampaign', () => {
    it('should update a draft campaign', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign)
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        name: 'Updated Campaign',
      })

      const result = await campaignService.updateCampaign(1, { name: 'Updated Campaign' })

      expect(prisma.newsletterCampaign.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Campaign' },
      })
      expect(result.newValue.name).toBe('Updated Campaign')
    })

    it('should throw error if campaign not found', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(campaignService.updateCampaign(999, { name: 'Test' })).rejects.toThrow(AppError)
      await expect(campaignService.updateCampaign(999, { name: 'Test' })).rejects.toMatchObject({
        statusCode: 404,
        code: 'CAMPAIGN_NOT_FOUND',
      })
    })

    it('should throw error when trying to edit a sending campaign', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SENDING',
      })

      await expect(campaignService.updateCampaign(1, { name: 'Test' })).rejects.toThrow(AppError)
      await expect(campaignService.updateCampaign(1, { name: 'Test' })).rejects.toMatchObject({
        statusCode: 400,
        code: 'CAMPAIGN_NOT_EDITABLE',
      })
    })

    it('should throw error when trying to edit a sent campaign', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SENT',
      })

      await expect(campaignService.updateCampaign(1, { name: 'Test' })).rejects.toThrow(AppError)
      await expect(campaignService.updateCampaign(1, { name: 'Test' })).rejects.toMatchObject({
        statusCode: 400,
        code: 'CAMPAIGN_NOT_EDITABLE',
      })
    })

    it('should allow editing a failed campaign', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'FAILED',
      })
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'FAILED',
        name: 'Retry Campaign',
      })

      const result = await campaignService.updateCampaign(1, { name: 'Retry Campaign' })

      expect(result.newValue.name).toBe('Retry Campaign')
    })
  })

  describe('getCampaign', () => {
    it('should return a campaign by id', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign)

      const result = await campaignService.getCampaign(1)

      expect(result).toEqual(mockCampaign)
    })

    it('should throw error if campaign not found', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(campaignService.getCampaign(999)).rejects.toThrow(AppError)
      await expect(campaignService.getCampaign(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'CAMPAIGN_NOT_FOUND',
      })
    })
  })

  describe('deleteCampaign', () => {
    it('should delete a draft campaign', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign)
      ;(prisma.newsletterCampaign.delete as jest.Mock).mockResolvedValue(mockCampaign)

      const result = await campaignService.deleteCampaign(1)

      expect(prisma.newsletterCampaign.delete).toHaveBeenCalledWith({ where: { id: 1 } })
      expect(result).toEqual(mockCampaign)
    })

    it('should throw error if campaign not found', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(campaignService.deleteCampaign(999)).rejects.toThrow(AppError)
      await expect(campaignService.deleteCampaign(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'CAMPAIGN_NOT_FOUND',
      })
    })

    it('should throw error when trying to delete a sending campaign', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SENDING',
      })

      await expect(campaignService.deleteCampaign(1)).rejects.toThrow(AppError)
      await expect(campaignService.deleteCampaign(1)).rejects.toMatchObject({
        statusCode: 400,
        code: 'CAMPAIGN_SENDING',
      })
    })
  })

  describe('listCampaigns', () => {
    it('should list campaigns with default pagination', async () => {
      ;(prisma.newsletterCampaign.findMany as jest.Mock).mockResolvedValue([mockCampaign])
      ;(prisma.newsletterCampaign.count as jest.Mock).mockResolvedValue(1)

      const result = await campaignService.listCampaigns()

      expect(result.campaigns).toHaveLength(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('should filter by status', async () => {
      ;(prisma.newsletterCampaign.findMany as jest.Mock).mockResolvedValue([mockCampaign])
      ;(prisma.newsletterCampaign.count as jest.Mock).mockResolvedValue(1)

      await campaignService.listCampaigns({ status: 'DRAFT' })

      expect(prisma.newsletterCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'DRAFT' },
        })
      )
    })

    it('should handle pagination correctly', async () => {
      ;(prisma.newsletterCampaign.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.newsletterCampaign.count as jest.Mock).mockResolvedValue(50)

      const result = await campaignService.listCampaigns({ page: 3, limit: 10 })

      expect(prisma.newsletterCampaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      )
      expect(result.pagination.totalPages).toBe(5)
    })
  })

  // ============================================================================
  // Scheduling Operations
  // ============================================================================

  describe('scheduleCampaign', () => {
    it('should schedule a draft campaign for future delivery', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString() // Tomorrow
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign)
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SCHEDULED',
        scheduledFor: new Date(futureDate),
      })

      const result = await campaignService.scheduleCampaign(1, futureDate)

      expect(prisma.newsletterCampaign.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'SCHEDULED',
          scheduledFor: expect.any(Date),
        },
      })
      expect(result.newValue.status).toBe('SCHEDULED')
    })

    it('should throw error for past scheduled time', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString() // Yesterday
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign)

      await expect(campaignService.scheduleCampaign(1, pastDate)).rejects.toThrow(AppError)
      await expect(campaignService.scheduleCampaign(1, pastDate)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_SCHEDULE_TIME',
      })
    })

    it('should throw error when scheduling a sending campaign', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString()
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SENDING',
      })

      await expect(campaignService.scheduleCampaign(1, futureDate)).rejects.toThrow(AppError)
      await expect(campaignService.scheduleCampaign(1, futureDate)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_STATUS',
      })
    })
  })

  describe('cancelScheduledCampaign', () => {
    it('should cancel a scheduled campaign and move to draft', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SCHEDULED',
        scheduledFor: new Date(),
      })
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'DRAFT',
        scheduledFor: null,
      })

      const result = await campaignService.cancelScheduledCampaign(1)

      expect(prisma.newsletterCampaign.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'DRAFT',
          scheduledFor: null,
        },
      })
      expect(result.newValue.status).toBe('DRAFT')
    })

    it('should throw error when canceling a non-scheduled campaign', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign)

      await expect(campaignService.cancelScheduledCampaign(1)).rejects.toThrow(AppError)
      await expect(campaignService.cancelScheduledCampaign(1)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_STATUS',
      })
    })
  })

  // ============================================================================
  // Send Operations
  // ============================================================================

  describe('sendCampaignNow', () => {
    it('should send a draft campaign immediately', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign)
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers)
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SENT',
      })
      ;(emailService.sendNewsletterCampaignByTemplate as jest.Mock).mockResolvedValue({
        total: 2,
        sent: 2,
        failed: 0,
        errors: [],
      })

      const result = await campaignService.sendCampaignNow(1)

      expect(result.sent).toBe(2)
      expect(result.total).toBe(2)
      expect(result.failed).toBe(0)
    })

    it('should throw error when sending a sent campaign', async () => {
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SENT',
      })

      await expect(campaignService.sendCampaignNow(1)).rejects.toThrow(AppError)
      await expect(campaignService.sendCampaignNow(1)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_STATUS',
      })
    })
  })

  describe('executeCampaignSend', () => {
    it('should acquire lock and send emails', async () => {
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers)
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SENT',
      })
      ;(emailService.sendNewsletterCampaignByTemplate as jest.Mock).mockResolvedValue({
        total: 2,
        sent: 2,
        failed: 0,
        errors: [],
      })

      const result = await campaignService.executeCampaignSend(mockCampaign)

      expect(prisma.newsletterCampaign.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          sendingStartedAt: null,
          status: { in: ['DRAFT', 'SCHEDULED', 'FAILED'] },
        },
        data: {
          sendingStartedAt: expect.any(Date),
          status: 'SENDING',
        },
      })
      expect(result.sent).toBe(2)
    })

    it('should throw error if campaign is currently being sent (concurrent send)', async () => {
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue({
        status: 'SENDING',
        sendingStartedAt: new Date(),
      })

      await expect(campaignService.executeCampaignSend(mockCampaign)).rejects.toThrow(AppError)
      await expect(campaignService.executeCampaignSend(mockCampaign)).rejects.toMatchObject({
        statusCode: 409,
        code: 'CAMPAIGN_SEND_IN_PROGRESS',
      })
    })

    it('should throw error if campaign was already sent', async () => {
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue({
        status: 'SENT',
        sendingStartedAt: null,
      })

      await expect(campaignService.executeCampaignSend(mockCampaign)).rejects.toThrow(AppError)
      await expect(campaignService.executeCampaignSend(mockCampaign)).rejects.toMatchObject({
        statusCode: 400,
        code: 'CAMPAIGN_ALREADY_SENT',
      })
    })

    it('should throw error if campaign was deleted during send attempt', async () => {
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(campaignService.executeCampaignSend(mockCampaign)).rejects.toThrow(AppError)
      await expect(campaignService.executeCampaignSend(mockCampaign)).rejects.toMatchObject({
        statusCode: 404,
        code: 'CAMPAIGN_NOT_FOUND',
      })
    })

    it('should throw error if no active subscribers found', async () => {
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'FAILED',
      })

      await expect(campaignService.executeCampaignSend(mockCampaign)).rejects.toThrow(AppError)
      await expect(campaignService.executeCampaignSend(mockCampaign)).rejects.toMatchObject({
        statusCode: 404,
        code: 'NO_SUBSCRIBERS',
      })
    })

    it('should mark campaign as FAILED if all emails fail', async () => {
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers)
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'FAILED',
      })
      ;(emailService.sendNewsletterCampaignByTemplate as jest.Mock).mockResolvedValue({
        total: 2,
        sent: 0,
        failed: 2,
        errors: [
          { email: 'user1@example.com', error: 'Failed' },
          { email: 'user2@example.com', error: 'Failed' },
        ],
      })

      const result = await campaignService.executeCampaignSend(mockCampaign)

      expect(prisma.newsletterCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      )
      expect(result.failed).toBe(2)
    })

    it('should mark campaign as SENT if at least some emails succeed', async () => {
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers)
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'SENT',
      })
      ;(emailService.sendNewsletterCampaignByTemplate as jest.Mock).mockResolvedValue({
        total: 2,
        sent: 1,
        failed: 1,
        errors: [{ email: 'user2@example.com', error: 'Failed' }],
      })

      await campaignService.executeCampaignSend(mockCampaign)

      expect(prisma.newsletterCampaign.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'SENT',
          }),
        })
      )
    })

    it('should reset lock on unexpected error', async () => {
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'FAILED',
      })

      await expect(campaignService.executeCampaignSend(mockCampaign)).rejects.toThrow(
        'Database error'
      )

      expect(prisma.newsletterCampaign.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'FAILED',
          sendingStartedAt: null,
        },
      })
    })
  })

  // ============================================================================
  // Cron Job
  // ============================================================================

  describe('processScheduledCampaigns', () => {
    it('should process campaigns scheduled for now or earlier', async () => {
      const scheduledCampaign = {
        ...mockCampaign,
        status: 'SCHEDULED',
        scheduledFor: new Date(Date.now() - 60000), // 1 minute ago
      }

      ;(prisma.newsletterCampaign.findMany as jest.Mock).mockResolvedValue([scheduledCampaign])
      ;(prisma.newsletterCampaign.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers)
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...scheduledCampaign,
        status: 'SENT',
      })
      ;(emailService.sendNewsletterCampaignByTemplate as jest.Mock).mockResolvedValue({
        total: 2,
        sent: 2,
        failed: 0,
        errors: [],
      })

      await campaignService.processScheduledCampaigns()

      expect(prisma.newsletterCampaign.findMany).toHaveBeenCalledWith({
        where: {
          status: 'SCHEDULED',
          scheduledFor: { lte: expect.any(Date) },
          sendingStartedAt: null,
        },
      })
    })

    it('should not fail if no campaigns are scheduled', async () => {
      ;(prisma.newsletterCampaign.findMany as jest.Mock).mockResolvedValue([])

      await expect(campaignService.processScheduledCampaigns()).resolves.not.toThrow()
    })

    it('should continue processing other campaigns if one fails', async () => {
      const campaign1 = { ...mockCampaign, id: 1, status: 'SCHEDULED', scheduledFor: new Date() }
      const campaign2 = { ...mockCampaign, id: 2, status: 'SCHEDULED', scheduledFor: new Date() }

      ;(prisma.newsletterCampaign.findMany as jest.Mock).mockResolvedValue([campaign1, campaign2])
      ;(prisma.newsletterCampaign.updateMany as jest.Mock)
        .mockResolvedValueOnce({ count: 0 }) // First campaign locked
        .mockResolvedValueOnce({ count: 1 }) // Second campaign proceeds
      // Mock findUnique for when first campaign's lock fails (returns SENDING status)
      ;(prisma.newsletterCampaign.findUnique as jest.Mock).mockResolvedValueOnce({
        status: 'SENDING',
        sendingStartedAt: new Date(),
      })
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers)
      ;(prisma.newsletterCampaign.update as jest.Mock).mockResolvedValue({
        ...campaign2,
        status: 'SENT',
      })
      ;(emailService.sendNewsletterCampaignByTemplate as jest.Mock).mockResolvedValue({
        total: 2,
        sent: 2,
        failed: 0,
        errors: [],
      })

      // Should not throw even though first campaign fails
      await expect(campaignService.processScheduledCampaigns()).resolves.not.toThrow()
    })
  })

  // ============================================================================
  // Template Helpers
  // ============================================================================

  describe('getAvailableCampaignTemplates', () => {
    it('should return campaign templates only', () => {
      const templates = campaignService.getAvailableCampaignTemplates()

      expect(templates).toBeDefined()
      expect(Array.isArray(templates)).toBe(true)
    })
  })
})
