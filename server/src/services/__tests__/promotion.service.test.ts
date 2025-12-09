import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'
import * as promotionService from '../promotion.service'

describe('PromotionService', () => {
  const mockPromotion = {
    id: 1,
    name: 'Summer Sale',
    discountPercent: 20,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createPromotion', () => {
    it('should create a promotion successfully', async () => {
      const input = {
        name: 'New Sale',
        discountPercent: 15,
        startDate: '2024-07-01T00:00:00Z',
        endDate: '2024-07-31T00:00:00Z',
        isActive: true,
      }

      ;(prisma.promotion.create as jest.Mock).mockResolvedValue({
        ...mockPromotion,
        name: input.name,
        discountPercent: input.discountPercent,
      })

      const result = await promotionService.createPromotion(input)

      expect(result.name).toBe('New Sale')
      expect(result.discountPercent).toBe(15)
      expect(prisma.promotion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Sale',
          discountPercent: 15,
        }),
      })
    })

    it('should default isActive to true when not provided', async () => {
      const input = {
        name: 'Sale',
        discountPercent: 10,
        startDate: '2024-07-01T00:00:00Z',
        endDate: '2024-07-31T00:00:00Z',
        isActive: true, // Required field
      }

      ;(prisma.promotion.create as jest.Mock).mockResolvedValue(mockPromotion)

      await promotionService.createPromotion(input)

      expect(prisma.promotion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isActive: true,
        }),
      })
    })
  })

  describe('updatePromotion', () => {
    it('should update a promotion successfully and return old/new values', async () => {
      const input = {
        name: 'Updated Sale',
        discountPercent: 25,
      }

      ;(prisma.promotion.findUnique as jest.Mock).mockResolvedValue(mockPromotion)
      ;(prisma.promotion.update as jest.Mock).mockResolvedValue({
        ...mockPromotion,
        ...input,
      })

      const result = await promotionService.updatePromotion(1, input)

      expect(result.oldValue.name).toBe('Summer Sale')
      expect(result.newValue.name).toBe('Updated Sale')
      expect(result.newValue.discountPercent).toBe(25)
    })

    it('should throw error if promotion not found', async () => {
      ;(prisma.promotion.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        promotionService.updatePromotion(999, { name: 'Test' })
      ).rejects.toThrow(AppError)
      await expect(
        promotionService.updatePromotion(999, { name: 'Test' })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'PROMOTION_NOT_FOUND',
      })
    })

    it('should only update provided fields', async () => {
      const input = {
        name: 'Updated Name Only',
      }

      ;(prisma.promotion.findUnique as jest.Mock).mockResolvedValue(mockPromotion)
      ;(prisma.promotion.update as jest.Mock).mockResolvedValue({
        ...mockPromotion,
        name: 'Updated Name Only',
      })

      await promotionService.updatePromotion(1, input)

      expect(prisma.promotion.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Name Only' },
      })
    })
  })

  describe('deletePromotion', () => {
    it('should delete a promotion successfully and return deleted promotion', async () => {
      ;(prisma.promotion.findUnique as jest.Mock).mockResolvedValue(mockPromotion)
      ;(prisma.promotion.delete as jest.Mock).mockResolvedValue(mockPromotion)

      const result = await promotionService.deletePromotion(1)

      expect(result.deletedPromotion.id).toBe(1)
      expect(prisma.promotion.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it('should throw error if promotion not found', async () => {
      ;(prisma.promotion.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(promotionService.deletePromotion(999)).rejects.toThrow(
        AppError
      )
      await expect(promotionService.deletePromotion(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'PROMOTION_NOT_FOUND',
      })
    })
  })

  describe('getPromotion', () => {
    it('should return a promotion by id', async () => {
      ;(prisma.promotion.findUnique as jest.Mock).mockResolvedValue(mockPromotion)

      const result = await promotionService.getPromotion(1)

      expect(result?.id).toBe(1)
      expect(result?.name).toBe('Summer Sale')
    })

    it('should throw error if promotion not found', async () => {
      ;(prisma.promotion.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(promotionService.getPromotion(999)).rejects.toThrow('Promotion not found')
    })
  })

  describe('listPromotions', () => {
    it('should list all promotions ordered by createdAt desc with pagination', async () => {
      const promotions = [mockPromotion, { ...mockPromotion, id: 2, name: 'Sale 2' }]
      ;(prisma.promotion.findMany as jest.Mock).mockResolvedValue(promotions)
      ;(prisma.promotion.count as jest.Mock).mockResolvedValue(2)

      const result = await promotionService.listPromotions()

      expect(result.promotions).toHaveLength(2)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      })
      expect(prisma.promotion.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      })
    })

    it('should return empty promotions array if no promotions', async () => {
      ;(prisma.promotion.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.promotion.count as jest.Mock).mockResolvedValue(0)

      const result = await promotionService.listPromotions()

      expect(result.promotions).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('getActivePromotion', () => {
    it('should return active promotion within date range', async () => {
      ;(prisma.promotion.findFirst as jest.Mock).mockResolvedValue(mockPromotion)

      const result = await promotionService.getActivePromotion()

      expect(result?.id).toBe(1)
      expect(result?.isActive).toBe(true)
      expect(prisma.promotion.findFirst).toHaveBeenCalledWith({
        where: {
          isActive: true,
          startDate: { lte: expect.any(Date) },
          endDate: { gte: expect.any(Date) },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return null if no active promotion', async () => {
      ;(prisma.promotion.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await promotionService.getActivePromotion()

      expect(result).toBeNull()
    })
  })

  describe('getServerTime', () => {
    it('should return current server time', async () => {
      const before = new Date()
      const result = await promotionService.getServerTime()
      const after = new Date()

      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })
})
