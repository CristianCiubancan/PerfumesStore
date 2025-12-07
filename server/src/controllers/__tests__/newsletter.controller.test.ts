import { Request, Response } from 'express'
import * as newsletterService from '../../services/newsletter.service'
import * as newsletterController from '../newsletter.controller'

// Mock newsletter service
jest.mock('../../services/newsletter.service', () => ({
  listSubscribers: jest.fn(),
  getSubscriber: jest.fn(),
  unsubscribe: jest.fn(),
  deleteSubscriber: jest.fn(),
}))

describe('NewsletterController', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      user: { userId: 1, email: 'admin@example.com', role: 'ADMIN', tokenVersion: 0 },
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  describe('listSubscribers', () => {
    it('should list subscribers with default pagination', async () => {
      const mockResult = {
        subscribers: [{ id: 1, email: 'test@example.com', isActive: true }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }
      req.query = {}

      ;(newsletterService.listSubscribers as jest.Mock).mockResolvedValue(mockResult)

      await newsletterController.listSubscribers(req as Request, res as Response)

      expect(newsletterService.listSubscribers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        isActive: undefined,
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })

    it('should filter by isActive status', async () => {
      const mockResult = {
        subscribers: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
      req.query = { isActive: 'true' }

      ;(newsletterService.listSubscribers as jest.Mock).mockResolvedValue(mockResult)

      await newsletterController.listSubscribers(req as Request, res as Response)

      expect(newsletterService.listSubscribers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        isActive: true,
      })
    })

    it('should handle isActive false', async () => {
      const mockResult = {
        subscribers: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
      req.query = { isActive: 'false' }

      ;(newsletterService.listSubscribers as jest.Mock).mockResolvedValue(mockResult)

      await newsletterController.listSubscribers(req as Request, res as Response)

      expect(newsletterService.listSubscribers).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        isActive: false,
      })
    })

    it('should handle pagination params', async () => {
      const mockResult = {
        subscribers: [],
        pagination: { page: 2, limit: 10, total: 15, totalPages: 2 },
      }
      req.query = { page: '2', limit: '10' }

      ;(newsletterService.listSubscribers as jest.Mock).mockResolvedValue(mockResult)

      await newsletterController.listSubscribers(req as Request, res as Response)

      expect(newsletterService.listSubscribers).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        isActive: undefined,
      })
    })
  })

  describe('unsubscribe', () => {
    it('should unsubscribe a subscriber', async () => {
      const oldSubscriber = { id: 1, email: 'test@example.com', isActive: true }
      const newSubscriber = { id: 1, email: 'test@example.com', isActive: false }
      req.params = { id: '1' }

      ;(newsletterService.unsubscribe as jest.Mock).mockResolvedValue({
        oldValue: oldSubscriber,
        newValue: newSubscriber,
      })

      await newsletterController.unsubscribe(req as Request, res as Response)

      expect(newsletterService.unsubscribe).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: newSubscriber })
    })
  })

  describe('deleteSubscriber', () => {
    it('should delete a subscriber', async () => {
      const deletedSubscriber = { id: 1, email: 'test@example.com' }
      req.params = { id: '1' }

      ;(newsletterService.deleteSubscriber as jest.Mock).mockResolvedValue({
        deletedSubscriber,
      })

      await newsletterController.deleteSubscriber(req as Request, res as Response)

      expect(newsletterService.deleteSubscriber).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Subscriber deleted successfully' } })
    })
  })
})
