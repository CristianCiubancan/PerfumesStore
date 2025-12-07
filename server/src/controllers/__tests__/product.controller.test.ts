import { Request, Response } from 'express'
import * as productService from '../../services/product.service'
import * as productController from '../product.controller'

// Mock product service
jest.mock('../../services/product.service', () => ({
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
  getProduct: jest.fn(),
  listProducts: jest.fn(),
  bulkDeleteProducts: jest.fn(),
  getFilterOptions: jest.fn(),
  getBrands: jest.fn(),
  getStats: jest.fn(),
}))

describe('ProductController', () => {
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

  describe('createProduct', () => {
    it('should create a product', async () => {
      const mockProduct = { id: 1, name: 'Test Product' }
      req.body = { name: 'Test Product', brand: 'Test Brand' }

      ;(productService.createProduct as jest.Mock).mockResolvedValue(mockProduct)

      await productController.createProduct(req as Request, res as Response)

      expect(productService.createProduct).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ data: mockProduct })
    })
  })

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const oldProduct = { id: 1, name: 'Old Product' }
      const newProduct = { id: 1, name: 'Updated Product' }
      req.params = { id: '1' }
      req.body = { name: 'Updated Product' }

      ;(productService.updateProduct as jest.Mock).mockResolvedValue({
        oldValue: oldProduct,
        newValue: newProduct,
      })

      await productController.updateProduct(req as Request, res as Response)

      expect(productService.updateProduct).toHaveBeenCalledWith(1, req.body)
      expect(res.json).toHaveBeenCalledWith({ data: newProduct })
    })
  })

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const deletedProduct = { id: 1, name: 'Deleted Product' }
      req.params = { id: '1' }

      ;(productService.deleteProduct as jest.Mock).mockResolvedValue({
        message: 'Product deleted successfully',
        deletedProduct,
      })

      await productController.deleteProduct(req as Request, res as Response)

      expect(productService.deleteProduct).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: { message: 'Product deleted successfully' } })
    })
  })

  describe('getProduct', () => {
    it('should get a product by id', async () => {
      const mockProduct = { id: 1, name: 'Test Product' }
      req.params = { id: '1' }

      ;(productService.getProduct as jest.Mock).mockResolvedValue(mockProduct)

      await productController.getProduct(req as Request, res as Response)

      expect(productService.getProduct).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: mockProduct })
    })
  })

  describe('listProducts', () => {
    it('should list products with default parameters', async () => {
      const mockResult = {
        products: [{ id: 1, name: 'Product 1' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }
      req.query = {}

      ;(productService.listProducts as jest.Mock).mockResolvedValue(mockResult)

      await productController.listProducts(req as Request, res as Response)

      expect(productService.listProducts).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })

    it('should list products with filters', async () => {
      const mockResult = {
        products: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
      req.query = {
        page: '1',
        limit: '10',
        brand: 'TestBrand',
        minPrice: '100',
        maxPrice: '500',
        search: 'perfume',
        sortBy: 'price',
        sortOrder: 'asc',
      }

      ;(productService.listProducts as jest.Mock).mockResolvedValue(mockResult)

      await productController.listProducts(req as Request, res as Response)

      expect(productService.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          brand: 'TestBrand',
          minPrice: 100,
          maxPrice: 500,
          search: 'perfume',
          sortBy: 'price',
          sortOrder: 'asc',
        })
      )
    })

    it('should handle season and occasion filters', async () => {
      const mockResult = {
        products: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
      req.query = {
        seasonIds: '1,2,3',
        seasonMatchMode: 'any',
        occasionIds: '1,2',
        occasionMatchMode: 'all',
      }

      ;(productService.listProducts as jest.Mock).mockResolvedValue(mockResult)

      await productController.listProducts(req as Request, res as Response)

      expect(productService.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          seasonIds: [1, 2, 3],
          seasonMatchMode: 'any',
          occasionIds: [1, 2],
          occasionMatchMode: 'all',
        })
      )
    })
  })

  describe('bulkDeleteProducts', () => {
    it('should bulk delete products', async () => {
      const mockResult = { message: 'Deleted 3 products', deletedCount: 3 }
      req.body = { ids: [1, 2, 3] }

      ;(productService.bulkDeleteProducts as jest.Mock).mockResolvedValue(mockResult)

      await productController.bulkDeleteProducts(req as Request, res as Response)

      expect(productService.bulkDeleteProducts).toHaveBeenCalledWith([1, 2, 3])
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })
  })

  describe('getFilterOptions', () => {
    it('should return filter options with cache header', async () => {
      const mockOptions = {
        fragranceFamilies: [],
        longevities: [],
        sillages: [],
        seasons: [],
        occasions: [],
      }

      ;(productService.getFilterOptions as jest.Mock).mockResolvedValue(mockOptions)

      await productController.getFilterOptions(req as Request, res as Response)

      expect(productService.getFilterOptions).toHaveBeenCalled()
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300')
      expect(res.json).toHaveBeenCalledWith({ data: mockOptions })
    })
  })

  describe('getBrands', () => {
    it('should return brands with cache header', async () => {
      const mockBrands = ['Brand A', 'Brand B']

      ;(productService.getBrands as jest.Mock).mockResolvedValue(mockBrands)

      await productController.getBrands(req as Request, res as Response)

      expect(productService.getBrands).toHaveBeenCalled()
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300')
      expect(res.json).toHaveBeenCalledWith({ data: mockBrands })
    })
  })

  describe('getStats', () => {
    it('should return stats with cache header', async () => {
      const mockStats = { productCount: 100, brandCount: 20 }

      ;(productService.getStats as jest.Mock).mockResolvedValue(mockStats)

      await productController.getStats(req as Request, res as Response)

      expect(productService.getStats).toHaveBeenCalled()
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=60')
      expect(res.json).toHaveBeenCalledWith({ data: mockStats })
    })
  })
})
