import { prisma } from '../../../lib/prisma'
import { AppError } from '../../../middleware/errorHandler'
import { findProductOrThrow, findProductIncludingDeleted, productInclude } from '../common'

describe('Product Common Functions', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Perfume',
    brand: 'Test Brand',
    slug: 'test-perfume',
    fragranceFamily: { id: 1, name: 'Woody' },
    longevity: { id: 1, name: 'Long' },
    sillage: { id: 1, name: 'Moderate' },
    seasons: [],
    occasions: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('productInclude', () => {
    it('should include all product relations', () => {
      expect(productInclude).toEqual({
        fragranceFamily: true,
        longevity: true,
        sillage: true,
        seasons: true,
        occasions: true,
      })
    })
  })

  describe('findProductOrThrow', () => {
    it('should return product when found', async () => {
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct)

      const result = await findProductOrThrow(1)

      expect(result).toEqual(mockProduct)
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        include: productInclude,
      })
    })

    it('should throw 404 when product not found', async () => {
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(findProductOrThrow(999)).rejects.toThrow(AppError)
      await expect(findProductOrThrow(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
      })
    })
  })

  describe('findProductIncludingDeleted', () => {
    it('should return product including deleted ones', async () => {
      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct)

      const result = await findProductIncludingDeleted(1)

      expect(result).toEqual(mockProduct)
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: productInclude,
      })
    })

    it('should return null when product not found', async () => {
      ;(prisma.product.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await findProductIncludingDeleted(999)

      expect(result).toBeNull()
    })
  })
})
