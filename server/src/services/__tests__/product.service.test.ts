import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'
import { cache } from '../../lib/cache'

// Mock the cache
jest.mock('../../lib/cache', () => ({
  cache: {
    getOrSet: jest.fn((key, fetcher) => fetcher()),
    invalidate: jest.fn(),
    invalidateByPrefix: jest.fn(),
    clear: jest.fn(),
  },
  CACHE_TTL: {
    FILTER_OPTIONS: 300000,
    BRANDS: 60000,
    STATS: 30000,
  },
  CACHE_KEYS: {
    FILTER_OPTIONS: 'filter_options',
    BRANDS: 'brands',
    STATS: 'stats',
  },
}))

// Import after mocks
import * as productService from '../product.service'

describe('ProductService', () => {
  const mockProduct = {
    id: 1,
    slug: 'test-perfume-test-brand-100ml',
    name: 'Test Perfume',
    brand: 'Test Brand',
    concentration: 'Eau_de_Parfum',
    gender: 'Unisex',
    fragranceFamilyId: 1,
    topNotes: ['Bergamot'],
    heartNotes: ['Rose'],
    baseNotes: ['Musk'],
    volumeMl: 100,
    priceRON: new Prisma.Decimal(500),
    launchYear: 2020,
    perfumer: 'Test Perfumer',
    longevityId: 1,
    sillageId: 1,
    rating: new Prisma.Decimal(4.5),
    stock: 10,
    imageUrl: '/uploads/test.jpg',
    description: 'Test description',
    createdAt: new Date(),
    updatedAt: new Date(),
    fragranceFamily: { id: 1, name: 'Woody' },
    longevity: { id: 1, name: 'Long', sortOrder: 1 },
    sillage: { id: 1, name: 'Moderate', sortOrder: 1 },
    seasons: [{ id: 1, name: 'Spring' }],
    occasions: [{ id: 1, name: 'Casual' }],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const input = {
        name: 'New Perfume',
        brand: 'New Brand',
        concentration: 'Eau_de_Parfum' as const,
        gender: 'Unisex' as const,
        fragranceFamilyId: 1,
        topNotes: ['Bergamot'],
        heartNotes: ['Rose'],
        baseNotes: ['Musk'],
        volumeMl: 100,
        priceRON: 500,
        launchYear: 2020,
        longevityId: 1,
        sillageId: 1,
        seasonIds: [1],
        occasionIds: [1],
        rating: 4.5,
        stock: 10,
      }

      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            create: jest.fn().mockResolvedValue(mockProduct),
          },
        }
        return fn(tx)
      })

      const result = await productService.createProduct(input)

      expect(result.id).toBe(1)
      expect(cache.invalidate).toHaveBeenCalledWith('brands')
      expect(cache.invalidate).toHaveBeenCalledWith('stats')
      expect(cache.invalidate).toHaveBeenCalledWith('filter_options')
    })

    it('should create a product with imageUrl', async () => {
      const input = {
        name: 'New Perfume',
        brand: 'New Brand',
        concentration: 'Eau_de_Parfum' as const,
        gender: 'Unisex' as const,
        fragranceFamilyId: 1,
        topNotes: ['Bergamot'],
        heartNotes: ['Rose'],
        baseNotes: ['Musk'],
        volumeMl: 100,
        priceRON: 500,
        launchYear: 2020,
        longevityId: 1,
        sillageId: 1,
        seasonIds: [1],
        occasionIds: [1],
        rating: 4.5,
        stock: 10,
        imageUrl: '/uploads/products/image.webp',
      }

      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            create: jest.fn().mockResolvedValue({ ...mockProduct, imageUrl: input.imageUrl }),
          },
        }
        return fn(tx)
      })

      const result = await productService.createProduct(input)

      expect(result.id).toBe(1)
    })
  })

  describe('updateProduct', () => {
    it('should update a product successfully and return old/new values', async () => {
      const input = {
        name: 'Updated Name',
        priceRON: 600,
      }

      // findProductOrThrow uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, ...input }),
          },
        }
        return fn(tx)
      })

      const result = await productService.updateProduct(1, input)

      expect(result.oldValue.name).toBe('Test Perfume')
      expect(result.newValue.name).toBe('Updated Name')
    })

    it('should update product with rating', async () => {
      const input = {
        rating: 4.8,
      }

      // findProductOrThrow uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            update: jest.fn().mockResolvedValue({ ...mockProduct, rating: new Prisma.Decimal(4.8) }),
          },
        }
        return fn(tx)
      })

      const result = await productService.updateProduct(1, input)

      expect(result).toBeDefined()
    })

    it('should update product with seasonIds', async () => {
      const input = {
        seasonIds: [1, 2],
      }

      // findProductOrThrow uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            update: jest.fn().mockResolvedValue(mockProduct),
          },
        }
        return fn(tx)
      })

      const result = await productService.updateProduct(1, input)

      expect(result).toBeDefined()
    })

    it('should update product with occasionIds', async () => {
      const input = {
        occasionIds: [1, 2],
      }

      // findProductOrThrow uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            update: jest.fn().mockResolvedValue(mockProduct),
          },
        }
        return fn(tx)
      })

      const result = await productService.updateProduct(1, input)

      expect(result).toBeDefined()
    })

    it('should throw error if product not found', async () => {
      // findProductOrThrow uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(productService.updateProduct(999, { name: 'Test' })).rejects.toThrow(
        AppError
      )
      await expect(productService.updateProduct(999, { name: 'Test' })).rejects.toMatchObject(
        {
          statusCode: 404,
          code: 'PRODUCT_NOT_FOUND',
        }
      )
    })
  })

  describe('deleteProduct', () => {
    it('should soft delete a product successfully', async () => {
      // findProductOrThrow uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct)
      // Soft delete uses update instead of delete
      ;(prisma.product.update as jest.Mock).mockResolvedValue({ ...mockProduct, deletedAt: new Date() })

      const result = await productService.deleteProduct(1)

      expect(result.message).toBe('Product deleted successfully')
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      })
      expect(cache.invalidate).toHaveBeenCalledWith('brands')
      expect(cache.invalidate).toHaveBeenCalledWith('stats')
      expect(cache.invalidate).toHaveBeenCalledWith('filter_options')
    })

    it('should throw error if product not found', async () => {
      // findProductOrThrow uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(productService.deleteProduct(999)).rejects.toThrow(AppError)
    })
  })

  describe('getProduct', () => {
    it('should return a product by id (excludes soft-deleted)', async () => {
      // getProduct uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct)

      const result = await productService.getProduct(1)

      expect(result.id).toBe(1)
      expect(result.name).toBe('Test Perfume')
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        include: expect.any(Object),
      })
    })

    it('should throw error if product not found', async () => {
      // getProduct uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(productService.getProduct(999)).rejects.toThrow(AppError)
    })
  })

  describe('listProducts', () => {
    it('should list products with default pagination', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(1)

      const result = await productService.listProducts()

      expect(result.products).toHaveLength(1)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by brand', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(1)

      await productService.listProducts({ brand: 'Test' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brand: { contains: 'Test', mode: 'insensitive' },
          }),
        })
      )
    })

    it('should filter by gender', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(1)

      await productService.listProducts({ gender: 'Men' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gender: 'Men',
          }),
        })
      )
    })

    it('should throw error for invalid gender', async () => {
      await expect(
        productService.listProducts({ gender: 'INVALID' })
      ).rejects.toThrow(AppError)
    })

    it('should filter by concentration', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(1)

      await productService.listProducts({ concentration: 'Parfum' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            concentration: 'Parfum',
          }),
        })
      )
    })

    it('should throw error for invalid concentration', async () => {
      await expect(
        productService.listProducts({ concentration: 'INVALID' })
      ).rejects.toThrow(AppError)
    })

    it('should filter by price range', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ minPrice: 100, maxPrice: 500 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceRON: expect.anything(),
          }),
        })
      )
    })

    it('should filter by minPrice only', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ minPrice: 100 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceRON: expect.anything(),
          }),
        })
      )
    })

    it('should filter by maxPrice only', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ maxPrice: 500 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priceRON: expect.anything(),
          }),
        })
      )
    })

    it('should search across name, brand, and description', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ search: 'test' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: expect.anything() },
              { brand: expect.anything() },
              { description: expect.anything() },
            ]),
          }),
        })
      )
    })

    it('should filter by fragranceFamilyId', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ fragranceFamilyId: 1 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fragranceFamilyId: 1,
          }),
        })
      )
    })

    it('should filter by longevityId', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ longevityId: 2 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            longevityId: 2,
          }),
        })
      )
    })

    it('should filter by sillageId', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ sillageId: 3 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sillageId: 3,
          }),
        })
      )
    })

    it('should filter by seasonIds with any match mode', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ seasonIds: [1, 2], seasonMatchMode: 'any' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            seasons: { some: { id: { in: [1, 2] } } },
          }),
        })
      )
    })

    it('should filter by seasonIds with all match mode', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ seasonIds: [1, 2], seasonMatchMode: 'all' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { seasons: { some: { id: 1 } } },
              { seasons: { some: { id: 2 } } },
            ]),
          }),
        })
      )
    })

    it('should filter by occasionIds with any match mode', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ occasionIds: [1, 2], occasionMatchMode: 'any' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            occasions: { some: { id: { in: [1, 2] } } },
          }),
        })
      )
    })

    it('should filter by occasionIds with all match mode', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ occasionIds: [1, 2], occasionMatchMode: 'all' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { occasions: { some: { id: 1 } } },
              { occasions: { some: { id: 2 } } },
            ]),
          }),
        })
      )
    })

    it('should filter by rating range', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ minRating: 3.5, maxRating: 5.0 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rating: expect.anything(),
          }),
        })
      )
    })

    it('should filter by minRating only', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ minRating: 4.0 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rating: expect.anything(),
          }),
        })
      )
    })

    it('should filter by maxRating only', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ maxRating: 4.5 })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rating: expect.anything(),
          }),
        })
      )
    })

    it('should filter by stock status out_of_stock', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ stockStatus: 'out_of_stock' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: { equals: 0 },
          }),
        })
      )
    })

    it('should filter by stock status in_stock', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ stockStatus: 'in_stock' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: expect.anything(),
          }),
        })
      )
    })

    it('should filter by stock status low_stock', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ stockStatus: 'low_stock' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: expect.anything(),
          }),
        })
      )
    })

    it('should not apply stock filter for all status', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ stockStatus: 'all' })

      const call = (prisma.product.findMany as jest.Mock).mock.calls[0][0]
      expect(call.where.stock).toBeUndefined()
    })

    it('should sort by name', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ sortBy: 'name', sortOrder: 'asc' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      )
    })

    it('should sort by price', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ sortBy: 'price', sortOrder: 'asc' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priceRON: 'asc' },
        })
      )
    })

    it('should sort by rating', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ sortBy: 'rating', sortOrder: 'desc' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'desc' },
        })
      )
    })

    it('should sort by stock', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ sortBy: 'stock', sortOrder: 'asc' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { stock: 'asc' },
        })
      )
    })

    it('should sort by newest (createdAt)', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      await productService.listProducts({ sortBy: 'newest', sortOrder: 'desc' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })
  })

  describe('bulkDeleteProducts', () => {
    it('should soft delete multiple products', async () => {
      // Soft delete uses updateMany instead of deleteMany
      ;(prisma.product.updateMany as jest.Mock).mockResolvedValue({ count: 3 })

      const result = await productService.bulkDeleteProducts([1, 2, 3])

      expect(result.deletedCount).toBe(3)
      expect(prisma.product.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] }, deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      })
      expect(cache.invalidate).toHaveBeenCalled()
    })

    it('should throw error for empty array', async () => {
      await expect(productService.bulkDeleteProducts([])).rejects.toThrow(AppError)
    })
  })

  describe('getFilterOptions', () => {
    it('should return filter options from lookup tables', async () => {
      const mockOptions = {
        fragranceFamilies: [{ id: 1, name: 'Woody' }],
        longevities: [{ id: 1, name: 'Long', sortOrder: 1 }],
        sillages: [{ id: 1, name: 'Moderate', sortOrder: 1 }],
        seasons: [{ id: 1, name: 'Spring' }],
        occasions: [{ id: 1, name: 'Casual' }],
      }

      ;(prisma.fragranceFamily.findMany as jest.Mock).mockResolvedValue(
        mockOptions.fragranceFamilies
      )
      ;(prisma.longevity.findMany as jest.Mock).mockResolvedValue(
        mockOptions.longevities
      )
      ;(prisma.sillage.findMany as jest.Mock).mockResolvedValue(mockOptions.sillages)
      ;(prisma.season.findMany as jest.Mock).mockResolvedValue(mockOptions.seasons)
      ;(prisma.occasion.findMany as jest.Mock).mockResolvedValue(mockOptions.occasions)

      const result = await productService.getFilterOptions()

      expect(result.fragranceFamilies).toHaveLength(1)
      expect(result.longevities).toHaveLength(1)
    })
  })

  describe('getBrands', () => {
    it('should return unique brands with pagination', async () => {
      ;(prisma.product.groupBy as jest.Mock)
        .mockResolvedValueOnce([{ brand: 'Brand A' }, { brand: 'Brand B' }])
        .mockResolvedValueOnce([{ brand: 'Brand A' }, { brand: 'Brand B' }])

      const result = await productService.getBrands()

      expect(result.brands).toEqual(['Brand A', 'Brand B'])
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      })
    })
  })

  describe('getStats', () => {
    it('should return product and brand counts', async () => {
      ;(prisma.product.count as jest.Mock).mockResolvedValue(100)
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([
        { brand: 'A' },
        { brand: 'B' },
        { brand: 'C' },
      ])

      const result = await productService.getStats()

      expect(result.productCount).toBe(100)
      expect(result.brandCount).toBe(3)
    })
  })

  describe('decrementStock', () => {
    it('should decrement stock successfully', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            // Uses findFirst with deletedAt: null
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              stock: 10,
              name: 'Test',
            }),
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 8 }),
          },
        }
        return fn(tx)
      })

      const result = await productService.decrementStock(1, 2)

      expect(result.stock).toBe(8)
    })

    it('should throw error for non-positive quantity', async () => {
      await expect(productService.decrementStock(1, 0)).rejects.toThrow(AppError)
      await expect(productService.decrementStock(1, -1)).rejects.toThrow(AppError)
    })

    it('should throw error if product not found', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            // Uses findFirst with deletedAt: null
            findFirst: jest.fn().mockResolvedValue(null),
          },
        }
        return fn(tx)
      })

      await expect(productService.decrementStock(999, 1)).rejects.toThrow(AppError)
      await expect(productService.decrementStock(999, 1)).rejects.toMatchObject({
        code: 'PRODUCT_NOT_FOUND',
      })
    })

    it('should throw error for insufficient stock', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            // Uses findFirst with deletedAt: null
            findFirst: jest.fn().mockResolvedValue({
              id: 1,
              stock: 5,
              name: 'Test',
            }),
          },
        }
        return fn(tx)
      })

      await expect(productService.decrementStock(1, 10)).rejects.toThrow(AppError)
    })
  })

  describe('decrementStockBatch', () => {
    it('should throw error for empty items array', async () => {
      await expect(productService.decrementStockBatch([])).rejects.toThrow(AppError)
    })

    it('should throw error for non-positive quantity in batch', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            findUnique: jest.fn(),
            update: jest.fn(),
          },
        }
        return fn(tx)
      })

      await expect(
        productService.decrementStockBatch([{ productId: 1, quantity: 0 }])
      ).rejects.toThrow(AppError)
    })

    it('should throw error if product not found in batch', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            findMany: jest.fn().mockResolvedValue([]), // No products found
            update: jest.fn(),
          },
        }
        return fn(tx)
      })

      await expect(
        productService.decrementStockBatch([{ productId: 999, quantity: 1 }])
      ).rejects.toThrow(AppError)
    })

    it('should throw error for insufficient stock in batch', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            findMany: jest.fn().mockResolvedValue([{
              id: 1,
              stock: 5,
              name: 'Test',
            }]),
            update: jest.fn(),
          },
        }
        return fn(tx)
      })

      await expect(
        productService.decrementStockBatch([{ productId: 1, quantity: 10 }])
      ).rejects.toThrow(AppError)
    })

    it('should decrement stock for multiple products', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            findMany: jest.fn().mockResolvedValue([{
              id: 1,
              stock: 10,
              name: 'Test',
            }]),
            update: jest.fn().mockResolvedValue({ ...mockProduct, stock: 9 }),
          },
        }
        return fn(tx)
      })

      const result = await productService.decrementStockBatch([
        { productId: 1, quantity: 1 },
      ])

      expect(result).toHaveLength(1)
    })
  })
})
