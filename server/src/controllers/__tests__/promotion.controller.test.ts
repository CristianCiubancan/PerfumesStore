import { Request, Response } from 'express'
import * as promotionService from '../../services/promotion.service'
import * as promotionController from '../promotion.controller'

// Mock promotion service
jest.mock('../../services/promotion.service', () => ({
  createPromotion: jest.fn(),
  updatePromotion: jest.fn(),
  deletePromotion: jest.fn(),
  getPromotion: jest.fn(),
  listPromotions: jest.fn(),
  getActivePromotion: jest.fn(),
  getServerTime: jest.fn(),
}))

describe('PromotionController', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { userId: 1, email: 'admin@example.com', role: 'ADMIN', tokenVersion: 0 },
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    }
  })

  describe('createPromotion', () => {
    it('should create a promotion', async () => {
      const mockPromotion = {
        id: 1,
        name: 'Summer Sale',
        discountPercent: 20,
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
      }
      req.body = {
        name: 'Summer Sale',
        discountPercent: 20,
        startDate: '2024-06-01T00:00:00Z',
        endDate: '2024-08-31T00:00:00Z',
      }

      ;(promotionService.createPromotion as jest.Mock).mockResolvedValue(
        mockPromotion
      )

      await promotionController.createPromotion(req as Request, res as Response)

      expect(promotionService.createPromotion).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ data: mockPromotion })
    })
  })

  describe('updatePromotion', () => {
    it('should update a promotion', async () => {
      const oldPromotion = { id: 1, name: 'Old Sale', discountPercent: 20 }
      const newPromotion = { id: 1, name: 'Updated Sale', discountPercent: 25 }
      req.params = { id: '1' }
      req.body = { name: 'Updated Sale', discountPercent: 25 }

      ;(promotionService.updatePromotion as jest.Mock).mockResolvedValue({
        oldValue: oldPromotion,
        newValue: newPromotion,
      })

      await promotionController.updatePromotion(req as Request, res as Response)

      expect(promotionService.updatePromotion).toHaveBeenCalledWith(1, req.body)
      expect(res.json).toHaveBeenCalledWith({ data: newPromotion })
    })
  })

  describe('deletePromotion', () => {
    it('should delete a promotion', async () => {
      const deletedPromotion = { id: 1, name: 'Deleted Sale' }
      req.params = { id: '1' }

      ;(promotionService.deletePromotion as jest.Mock).mockResolvedValue({
        deletedPromotion,
      })

      await promotionController.deletePromotion(req as Request, res as Response)

      expect(promotionService.deletePromotion).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Promotion deleted successfully' } })
    })
  })

  describe('getPromotion', () => {
    it('should get a promotion by id', async () => {
      const mockPromotion = { id: 1, name: 'Test Promotion' }
      req.params = { id: '1' }

      ;(promotionService.getPromotion as jest.Mock).mockResolvedValue(mockPromotion)

      await promotionController.getPromotion(req as Request, res as Response)

      expect(promotionService.getPromotion).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: mockPromotion })
    })
  })

  describe('listPromotions', () => {
    it('should list all promotions with pagination', async () => {
      const mockResult = {
        promotions: [
          { id: 1, name: 'Sale 1' },
          { id: 2, name: 'Sale 2' },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      }

      ;(promotionService.listPromotions as jest.Mock).mockResolvedValue(
        mockResult
      )

      await promotionController.listPromotions(req as Request, res as Response)

      expect(promotionService.listPromotions).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        isActive: undefined,
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })
  })

  describe('getActivePromotion', () => {
    it('should return active promotion with server time', async () => {
      const mockPromotion = { id: 1, name: 'Active Sale', discountPercent: 15 }
      const mockServerTime = new Date('2024-07-15T12:00:00Z')

      ;(promotionService.getActivePromotion as jest.Mock).mockResolvedValue(
        mockPromotion
      )
      ;(promotionService.getServerTime as jest.Mock).mockResolvedValue(
        mockServerTime
      )

      await promotionController.getActivePromotion(req as Request, res as Response)

      expect(promotionService.getActivePromotion).toHaveBeenCalled()
      expect(promotionService.getServerTime).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({
        data: {
          promotion: mockPromotion,
          serverTime: mockServerTime.toISOString(),
        },
      })
    })

    it('should return null promotion when none active', async () => {
      const mockServerTime = new Date('2024-07-15T12:00:00Z')

      ;(promotionService.getActivePromotion as jest.Mock).mockResolvedValue(null)
      ;(promotionService.getServerTime as jest.Mock).mockResolvedValue(
        mockServerTime
      )

      await promotionController.getActivePromotion(req as Request, res as Response)

      expect(res.json).toHaveBeenCalledWith({
        data: {
          promotion: null,
          serverTime: mockServerTime.toISOString(),
        },
      })
    })
  })
})
