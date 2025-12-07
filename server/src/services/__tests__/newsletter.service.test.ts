import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'
import * as newsletterService from '../newsletter.service'

describe('NewsletterService', () => {
  const mockSubscriber = {
    id: 1,
    email: 'test@example.com',
    isActive: true,
    subscribedAt: new Date(),
    unsubscribedAt: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('subscribe', () => {
    it('should create a new subscriber via upsert', async () => {
      ;(prisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue(
        mockSubscriber
      )

      const result = await newsletterService.subscribe('new@example.com')

      expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
        create: {
          email: 'new@example.com',
          isActive: true,
        },
        update: {
          isActive: true,
          unsubscribedAt: null,
        },
      })
      expect(result.email).toBe('test@example.com')
    })

    it('should handle existing active subscriber via upsert', async () => {
      ;(prisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue(
        mockSubscriber
      )

      const result = await newsletterService.subscribe('test@example.com')

      expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        create: {
          email: 'test@example.com',
          isActive: true,
        },
        update: {
          isActive: true,
          unsubscribedAt: null,
        },
      })
      expect(result).toEqual(mockSubscriber)
    })

    it('should reactivate previously unsubscribed user via upsert', async () => {
      const reactivatedSubscriber = {
        ...mockSubscriber,
        isActive: true,
        unsubscribedAt: null,
      }

      ;(prisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue(
        reactivatedSubscriber
      )

      const result = await newsletterService.subscribe('test@example.com')

      expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        create: {
          email: 'test@example.com',
          isActive: true,
        },
        update: {
          isActive: true,
          unsubscribedAt: null,
        },
      })
      expect(result.isActive).toBe(true)
    })
  })

  describe('unsubscribe', () => {
    it('should unsubscribe an active subscriber and return old/new values', async () => {
      ;(prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(
        mockSubscriber
      )
      ;(prisma.newsletterSubscriber.update as jest.Mock).mockResolvedValue({
        ...mockSubscriber,
        isActive: false,
        unsubscribedAt: new Date(),
      })

      const result = await newsletterService.unsubscribe(1)

      expect(prisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          isActive: false,
          unsubscribedAt: expect.any(Date),
        }),
      })
      expect(result.oldValue.isActive).toBe(true)
      expect(result.newValue.isActive).toBe(false)
    })

    it('should throw error if subscriber not found', async () => {
      ;(prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(newsletterService.unsubscribe(999)).rejects.toThrow(AppError)
      await expect(newsletterService.unsubscribe(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'SUBSCRIBER_NOT_FOUND',
      })
    })

    it('should throw error if already unsubscribed', async () => {
      const inactiveSubscriber = {
        ...mockSubscriber,
        isActive: false,
      }

      ;(prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(
        inactiveSubscriber
      )

      await expect(newsletterService.unsubscribe(1)).rejects.toThrow(AppError)
      await expect(newsletterService.unsubscribe(1)).rejects.toMatchObject({
        statusCode: 400,
        code: 'ALREADY_UNSUBSCRIBED',
      })
    })
  })

  describe('getSubscriber', () => {
    it('should return a subscriber by id', async () => {
      ;(prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(
        mockSubscriber
      )

      const result = await newsletterService.getSubscriber(1)

      expect(result).toEqual(mockSubscriber)
    })

    it('should return null if subscriber not found', async () => {
      ;(prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await newsletterService.getSubscriber(999)

      expect(result).toBeNull()
    })
  })

  describe('listSubscribers', () => {
    it('should list subscribers with default pagination', async () => {
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue([
        mockSubscriber,
      ])
      ;(prisma.newsletterSubscriber.count as jest.Mock).mockResolvedValue(1)

      const result = await newsletterService.listSubscribers()

      expect(result.subscribers).toHaveLength(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('should filter by isActive status', async () => {
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue([
        mockSubscriber,
      ])
      ;(prisma.newsletterSubscriber.count as jest.Mock).mockResolvedValue(1)

      await newsletterService.listSubscribers({ isActive: true })

      expect(prisma.newsletterSubscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      )
    })

    it('should handle pagination', async () => {
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.newsletterSubscriber.count as jest.Mock).mockResolvedValue(50)

      const result = await newsletterService.listSubscribers({ page: 2, limit: 10 })

      expect(prisma.newsletterSubscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
      expect(result.pagination.totalPages).toBe(5)
    })
  })

  describe('deleteSubscriber', () => {
    it('should delete a subscriber and return deleted subscriber', async () => {
      ;(prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(
        mockSubscriber
      )
      ;(prisma.newsletterSubscriber.delete as jest.Mock).mockResolvedValue(
        mockSubscriber
      )

      const result = await newsletterService.deleteSubscriber(1)

      expect(prisma.newsletterSubscriber.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
      expect(result.deletedSubscriber).toEqual(mockSubscriber)
    })

    it('should throw error if subscriber not found', async () => {
      ;(prisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(newsletterService.deleteSubscriber(999)).rejects.toThrow(
        AppError
      )
      await expect(newsletterService.deleteSubscriber(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'SUBSCRIBER_NOT_FOUND',
      })
    })
  })
})
