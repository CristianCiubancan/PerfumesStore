import { Request, Response } from 'express'
import * as campaignService from '../../services/campaign.service'
import * as campaignController from '../campaign.controller'
import { AppError } from '../../middleware/errorHandler'

// Mock campaign service
jest.mock('../../services/campaign.service', () => ({
  listCampaigns: jest.fn(),
  getCampaign: jest.fn(),
  createCampaign: jest.fn(),
  updateCampaign: jest.fn(),
  deleteCampaign: jest.fn(),
  scheduleCampaign: jest.fn(),
  sendCampaignNow: jest.fn(),
  cancelScheduledCampaign: jest.fn(),
  getAvailableCampaignTemplates: jest.fn(),
}))

// Mock email service
jest.mock('../../services/email', () => ({
  isEmailEnabled: jest.fn(() => true),
}))

// Mock audit logger
jest.mock('../../lib/auditLogger', () => ({
  createAuditLog: jest.fn(),
}))

describe('CampaignController', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  const mockCampaign = {
    id: 1,
    name: 'Test Campaign',
    templateId: 'campaign-example-promo',
    status: 'DRAFT',
    scheduledFor: null,
    sentAt: null,
    totalRecipients: null,
    sentCount: null,
    failedCount: null,
    sendingStartedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    req = {
      body: {},
      params: {},
      query: {},
      user: { userId: 1, email: 'admin@example.com', role: 'ADMIN', tokenVersion: 0 },
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  // ============================================================================
  // listCampaigns
  // ============================================================================

  describe('listCampaigns', () => {
    it('should list campaigns with default pagination', async () => {
      const mockResult = {
        campaigns: [mockCampaign],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }
      ;(campaignService.listCampaigns as jest.Mock).mockResolvedValue(mockResult)

      await campaignController.listCampaigns(req as Request, res as Response)

      expect(campaignService.listCampaigns).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: undefined,
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })

    it('should list campaigns with custom pagination', async () => {
      req.query = { page: '2', limit: '10' }
      const mockResult = {
        campaigns: [mockCampaign],
        pagination: { page: 2, limit: 10, total: 15, totalPages: 2 },
      }
      ;(campaignService.listCampaigns as jest.Mock).mockResolvedValue(mockResult)

      await campaignController.listCampaigns(req as Request, res as Response)

      expect(campaignService.listCampaigns).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        status: undefined,
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })

    it('should list campaigns with status filter', async () => {
      req.query = { status: 'DRAFT' }
      const mockResult = {
        campaigns: [mockCampaign],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }
      ;(campaignService.listCampaigns as jest.Mock).mockResolvedValue(mockResult)

      await campaignController.listCampaigns(req as Request, res as Response)

      expect(campaignService.listCampaigns).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: 'DRAFT',
      })
    })
  })

  // ============================================================================
  // getCampaign
  // ============================================================================

  describe('getCampaign', () => {
    it('should get a campaign by id', async () => {
      req.params = { id: '1' }
      ;(campaignService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign)

      await campaignController.getCampaign(req as Request, res as Response)

      expect(campaignService.getCampaign).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: mockCampaign })
    })

    it('should propagate service error when campaign not found', async () => {
      req.params = { id: '999' }
      ;(campaignService.getCampaign as jest.Mock).mockRejectedValue(
        new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
      )

      await expect(
        campaignController.getCampaign(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  // ============================================================================
  // createCampaign
  // ============================================================================

  describe('createCampaign', () => {
    it('should create a campaign', async () => {
      req.body = { name: 'New Campaign', templateId: 'campaign-example-promo' }
      ;(campaignService.createCampaign as jest.Mock).mockResolvedValue(mockCampaign)

      await campaignController.createCampaign(req as Request, res as Response)

      expect(campaignService.createCampaign).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ data: mockCampaign })
    })
  })

  // ============================================================================
  // updateCampaign
  // ============================================================================

  describe('updateCampaign', () => {
    it('should update a campaign', async () => {
      const oldCampaign = { ...mockCampaign, name: 'Old Name' }
      const newCampaign = { ...mockCampaign, name: 'Updated Name' }
      req.params = { id: '1' }
      req.body = { name: 'Updated Name' }

      ;(campaignService.updateCampaign as jest.Mock).mockResolvedValue({
        oldValue: oldCampaign,
        newValue: newCampaign,
      })

      await campaignController.updateCampaign(req as Request, res as Response)

      expect(campaignService.updateCampaign).toHaveBeenCalledWith(1, req.body)
      expect(res.json).toHaveBeenCalledWith({ data: newCampaign })
    })

    it('should propagate service error when campaign not found', async () => {
      req.params = { id: '999' }
      req.body = { name: 'Test' }
      ;(campaignService.updateCampaign as jest.Mock).mockRejectedValue(
        new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
      )

      await expect(
        campaignController.updateCampaign(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  // ============================================================================
  // deleteCampaign
  // ============================================================================

  describe('deleteCampaign', () => {
    it('should delete a campaign', async () => {
      req.params = { id: '1' }
      ;(campaignService.deleteCampaign as jest.Mock).mockResolvedValue(mockCampaign)

      await campaignController.deleteCampaign(req as Request, res as Response)

      expect(campaignService.deleteCampaign).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({
        data: { message: 'Campaign deleted successfully' },
      })
    })

    it('should propagate service error when campaign not found', async () => {
      req.params = { id: '999' }
      ;(campaignService.deleteCampaign as jest.Mock).mockRejectedValue(
        new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
      )

      await expect(
        campaignController.deleteCampaign(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  // ============================================================================
  // scheduleCampaign
  // ============================================================================

  describe('scheduleCampaign', () => {
    it('should schedule a campaign', async () => {
      const scheduledFor = new Date('2025-02-01T10:00:00Z')
      const scheduledCampaign = {
        ...mockCampaign,
        status: 'SCHEDULED',
        scheduledFor,
      }
      req.params = { id: '1' }
      req.body = { scheduledFor: scheduledFor.toISOString() }

      ;(campaignService.scheduleCampaign as jest.Mock).mockResolvedValue({
        oldValue: mockCampaign,
        newValue: scheduledCampaign,
      })

      await campaignController.scheduleCampaign(req as Request, res as Response)

      expect(campaignService.scheduleCampaign).toHaveBeenCalledWith(
        1,
        scheduledFor.toISOString()
      )
      expect(res.json).toHaveBeenCalledWith({ data: scheduledCampaign })
    })

    it('should propagate service error for non-existent campaign', async () => {
      req.params = { id: '999' }
      req.body = { scheduledFor: '2025-02-01T10:00:00Z' }
      ;(campaignService.scheduleCampaign as jest.Mock).mockRejectedValue(
        new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
      )

      await expect(
        campaignController.scheduleCampaign(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  // ============================================================================
  // sendCampaign
  // ============================================================================

  describe('sendCampaign', () => {
    const { isEmailEnabled } = require('../../services/email')

    it('should send a campaign immediately', async () => {
      req.params = { id: '1' }
      const sendResult = { sent: 100, failed: 5 }

      ;(isEmailEnabled as jest.Mock).mockReturnValue(true)
      ;(campaignService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign)
      ;(campaignService.sendCampaignNow as jest.Mock).mockResolvedValue(sendResult)

      await campaignController.sendCampaign(req as Request, res as Response)

      expect(campaignService.getCampaign).toHaveBeenCalledWith(1)
      expect(campaignService.sendCampaignNow).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          message: 'Campaign sent successfully',
          result: sendResult,
        },
      })
    })

    it('should throw error when email service is disabled', async () => {
      req.params = { id: '1' }
      ;(isEmailEnabled as jest.Mock).mockReturnValue(false)

      await expect(
        campaignController.sendCampaign(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })

    it('should propagate service error for non-existent campaign', async () => {
      req.params = { id: '999' }
      ;(isEmailEnabled as jest.Mock).mockReturnValue(true)
      ;(campaignService.getCampaign as jest.Mock).mockRejectedValue(
        new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
      )

      await expect(
        campaignController.sendCampaign(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  // ============================================================================
  // cancelScheduledCampaign
  // ============================================================================

  describe('cancelScheduledCampaign', () => {
    it('should cancel a scheduled campaign', async () => {
      const scheduledCampaign = {
        ...mockCampaign,
        status: 'SCHEDULED',
        scheduledFor: new Date('2025-02-01'),
      }
      const cancelledCampaign = {
        ...mockCampaign,
        status: 'DRAFT',
        scheduledFor: null,
      }
      req.params = { id: '1' }

      ;(campaignService.cancelScheduledCampaign as jest.Mock).mockResolvedValue({
        oldValue: scheduledCampaign,
        newValue: cancelledCampaign,
      })

      await campaignController.cancelScheduledCampaign(req as Request, res as Response)

      expect(campaignService.cancelScheduledCampaign).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: cancelledCampaign })
    })

    it('should propagate service error for non-existent campaign', async () => {
      req.params = { id: '999' }
      ;(campaignService.cancelScheduledCampaign as jest.Mock).mockRejectedValue(
        new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND')
      )

      await expect(
        campaignController.cancelScheduledCampaign(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  // ============================================================================
  // getCampaignTemplates
  // ============================================================================

  describe('getCampaignTemplates', () => {
    it('should get available campaign templates', async () => {
      const mockTemplates = [
        {
          id: 'campaign-example-promo',
          name: 'Example Promo',
          description: 'Promotional email',
          category: 'campaign',
        },
        {
          id: 'campaign-seasonal-sale',
          name: 'Seasonal Sale',
          description: 'Seasonal sale announcement',
          category: 'campaign',
        },
      ]
      ;(campaignService.getAvailableCampaignTemplates as jest.Mock).mockReturnValue(
        mockTemplates
      )

      await campaignController.getCampaignTemplates(req as Request, res as Response)

      expect(campaignService.getAvailableCampaignTemplates).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ data: mockTemplates })
    })

    it('should return empty array when no templates available', async () => {
      ;(campaignService.getAvailableCampaignTemplates as jest.Mock).mockReturnValue([])

      await campaignController.getCampaignTemplates(req as Request, res as Response)

      expect(res.json).toHaveBeenCalledWith({ data: [] })
    })
  })
})
