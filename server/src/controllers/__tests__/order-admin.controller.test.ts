import { Request, Response } from 'express'
import * as orderService from '../../services/order.service'
import * as orderAdminController from '../order-admin.controller'
import { AppError } from '../../middleware/errorHandler'

// Mock order service
jest.mock('../../services/order.service', () => ({
  adminListOrders: jest.fn(),
  adminGetOrderById: jest.fn(),
  adminUpdateOrderStatus: jest.fn(),
  getOrderStats: jest.fn(),
}))

// Mock audit logger
jest.mock('../../lib/auditLogger', () => ({
  createAuditLog: jest.fn(),
}))

describe('OrderAdminController', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  const mockOrder = {
    id: 1,
    orderNumber: 'ORD-20250101-0001',
    status: 'PENDING',
    totalRON: { toString: () => '1500.00' },
    customerName: 'John Doe',
    guestEmail: 'john@example.com',
    shippingCity: 'Bucharest',
    shippingCountry: 'RO',
    createdAt: new Date('2025-01-01'),
    items: [
      {
        id: 1,
        productName: 'Test Perfume',
        quantity: 2,
        unitPriceRON: { toString: () => '750.00' },
      },
    ],
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
  // listOrders
  // ============================================================================

  describe('listOrders', () => {
    it('should list orders with default pagination', async () => {
      const mockResult = {
        orders: [mockOrder],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }
      ;(orderService.adminListOrders as jest.Mock).mockResolvedValue(mockResult)

      await orderAdminController.listOrders(req as Request, res as Response)

      expect(orderService.adminListOrders).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        status: undefined,
        search: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })

    it('should list orders with custom pagination', async () => {
      req.query = { page: '2', limit: '10' }
      const mockResult = {
        orders: [mockOrder],
        pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
      }
      ;(orderService.adminListOrders as jest.Mock).mockResolvedValue(mockResult)

      await orderAdminController.listOrders(req as Request, res as Response)

      expect(orderService.adminListOrders).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        status: undefined,
        search: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })

    it('should list orders with status filter', async () => {
      req.query = { status: 'PAID' }
      const mockResult = {
        orders: [{ ...mockOrder, status: 'PAID' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }
      ;(orderService.adminListOrders as jest.Mock).mockResolvedValue(mockResult)

      await orderAdminController.listOrders(req as Request, res as Response)

      expect(orderService.adminListOrders).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        status: 'PAID',
        search: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      })
    })

    it('should list orders with search query', async () => {
      req.query = { search: 'john@example.com' }
      const mockResult = {
        orders: [mockOrder],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }
      ;(orderService.adminListOrders as jest.Mock).mockResolvedValue(mockResult)

      await orderAdminController.listOrders(req as Request, res as Response)

      expect(orderService.adminListOrders).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        status: undefined,
        search: 'john@example.com',
        sortBy: undefined,
        sortOrder: undefined,
      })
    })

    it('should list orders with sorting', async () => {
      req.query = { sortBy: 'createdAt', sortOrder: 'desc' }
      const mockResult = {
        orders: [mockOrder],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }
      ;(orderService.adminListOrders as jest.Mock).mockResolvedValue(mockResult)

      await orderAdminController.listOrders(req as Request, res as Response)

      expect(orderService.adminListOrders).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        status: undefined,
        search: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
    })

    it('should list orders with all filters combined', async () => {
      req.query = {
        page: '1',
        limit: '50',
        status: 'PROCESSING',
        search: 'ORD-2025',
        sortBy: 'totalRON',
        sortOrder: 'asc',
      }
      const mockResult = {
        orders: [{ ...mockOrder, status: 'PROCESSING' }],
        pagination: { page: 1, limit: 50, total: 5, totalPages: 1 },
      }
      ;(orderService.adminListOrders as jest.Mock).mockResolvedValue(mockResult)

      await orderAdminController.listOrders(req as Request, res as Response)

      expect(orderService.adminListOrders).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        status: 'PROCESSING',
        search: 'ORD-2025',
        sortBy: 'totalRON',
        sortOrder: 'asc',
      })
    })

    it('should return empty result when no orders match', async () => {
      req.query = { status: 'CANCELLED' }
      const mockResult = {
        orders: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
      ;(orderService.adminListOrders as jest.Mock).mockResolvedValue(mockResult)

      await orderAdminController.listOrders(req as Request, res as Response)

      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })
  })

  // ============================================================================
  // getOrder
  // ============================================================================

  describe('getOrder', () => {
    it('should get an order by id', async () => {
      req.params = { id: '1' }
      ;(orderService.adminGetOrderById as jest.Mock).mockResolvedValue(mockOrder)

      await orderAdminController.getOrder(req as Request, res as Response)

      expect(orderService.adminGetOrderById).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: mockOrder })
    })

    it('should propagate service error when order not found', async () => {
      req.params = { id: '999' }
      ;(orderService.adminGetOrderById as jest.Mock).mockRejectedValue(
        new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
      )

      await expect(
        orderAdminController.getOrder(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  // ============================================================================
  // updateOrderStatus
  // ============================================================================

  describe('updateOrderStatus', () => {
    it('should update order status to PROCESSING', async () => {
      req.params = { id: '1' }
      req.body = { status: 'PROCESSING' }

      const oldOrder = { ...mockOrder, status: 'PAID' }
      const updatedOrder = { ...mockOrder, status: 'PROCESSING' }

      ;(orderService.adminGetOrderById as jest.Mock).mockResolvedValue(oldOrder)
      ;(orderService.adminUpdateOrderStatus as jest.Mock).mockResolvedValue({
        order: updatedOrder,
        stockRestored: false,
      })

      await orderAdminController.updateOrderStatus(req as Request, res as Response)

      expect(orderService.adminGetOrderById).toHaveBeenCalledWith(1)
      expect(orderService.adminUpdateOrderStatus).toHaveBeenCalledWith(1, 'PROCESSING')
      expect(res.json).toHaveBeenCalledWith({ data: updatedOrder })
    })

    it('should update order status to SHIPPED', async () => {
      req.params = { id: '1' }
      req.body = { status: 'SHIPPED' }

      const oldOrder = { ...mockOrder, status: 'PROCESSING' }
      const updatedOrder = { ...mockOrder, status: 'SHIPPED' }

      ;(orderService.adminGetOrderById as jest.Mock).mockResolvedValue(oldOrder)
      ;(orderService.adminUpdateOrderStatus as jest.Mock).mockResolvedValue({
        order: updatedOrder,
        stockRestored: false,
      })

      await orderAdminController.updateOrderStatus(req as Request, res as Response)

      expect(orderService.adminUpdateOrderStatus).toHaveBeenCalledWith(1, 'SHIPPED')
      expect(res.json).toHaveBeenCalledWith({ data: updatedOrder })
    })

    it('should update order status to DELIVERED', async () => {
      req.params = { id: '1' }
      req.body = { status: 'DELIVERED' }

      const oldOrder = { ...mockOrder, status: 'SHIPPED' }
      const updatedOrder = { ...mockOrder, status: 'DELIVERED' }

      ;(orderService.adminGetOrderById as jest.Mock).mockResolvedValue(oldOrder)
      ;(orderService.adminUpdateOrderStatus as jest.Mock).mockResolvedValue({
        order: updatedOrder,
        stockRestored: false,
      })

      await orderAdminController.updateOrderStatus(req as Request, res as Response)

      expect(res.json).toHaveBeenCalledWith({ data: updatedOrder })
    })

    it('should update order status to CANCELLED and restore stock', async () => {
      req.params = { id: '1' }
      req.body = { status: 'CANCELLED' }

      const oldOrder = { ...mockOrder, status: 'PENDING' }
      const updatedOrder = { ...mockOrder, status: 'CANCELLED' }

      ;(orderService.adminGetOrderById as jest.Mock).mockResolvedValue(oldOrder)
      ;(orderService.adminUpdateOrderStatus as jest.Mock).mockResolvedValue({
        order: updatedOrder,
        stockRestored: true,
      })

      await orderAdminController.updateOrderStatus(req as Request, res as Response)

      expect(orderService.adminUpdateOrderStatus).toHaveBeenCalledWith(1, 'CANCELLED')
      expect(res.json).toHaveBeenCalledWith({ data: updatedOrder })
    })

    it('should update order status to REFUNDED', async () => {
      req.params = { id: '1' }
      req.body = { status: 'REFUNDED' }

      const oldOrder = { ...mockOrder, status: 'PAID' }
      const updatedOrder = { ...mockOrder, status: 'REFUNDED' }

      ;(orderService.adminGetOrderById as jest.Mock).mockResolvedValue(oldOrder)
      ;(orderService.adminUpdateOrderStatus as jest.Mock).mockResolvedValue({
        order: updatedOrder,
        stockRestored: true,
      })

      await orderAdminController.updateOrderStatus(req as Request, res as Response)

      expect(res.json).toHaveBeenCalledWith({ data: updatedOrder })
    })

    it('should propagate service error for invalid status transition', async () => {
      req.params = { id: '1' }
      req.body = { status: 'DELIVERED' }

      const oldOrder = { ...mockOrder, status: 'PENDING' }

      ;(orderService.adminGetOrderById as jest.Mock).mockResolvedValue(oldOrder)
      ;(orderService.adminUpdateOrderStatus as jest.Mock).mockRejectedValue(
        new AppError('Invalid status transition', 400, 'INVALID_STATUS_TRANSITION')
      )

      await expect(
        orderAdminController.updateOrderStatus(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })

    it('should propagate service error when order not found', async () => {
      req.params = { id: '999' }
      req.body = { status: 'PROCESSING' }

      ;(orderService.adminGetOrderById as jest.Mock).mockRejectedValue(
        new AppError('Order not found', 404, 'ORDER_NOT_FOUND')
      )

      await expect(
        orderAdminController.updateOrderStatus(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  // ============================================================================
  // getStats
  // ============================================================================

  describe('getStats', () => {
    it('should get order statistics', async () => {
      const mockStats = {
        totalOrders: 150,
        pendingOrders: 10,
        processingOrders: 25,
        shippedOrders: 15,
        deliveredOrders: 95,
        cancelledOrders: 3,
        refundedOrders: 2,
        totalRevenue: '125000.00',
        averageOrderValue: '833.33',
      }
      ;(orderService.getOrderStats as jest.Mock).mockResolvedValue(mockStats)

      await orderAdminController.getStats(req as Request, res as Response)

      expect(orderService.getOrderStats).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ data: mockStats })
    })

    it('should return zero stats when no orders exist', async () => {
      const mockStats = {
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        refundedOrders: 0,
        totalRevenue: '0.00',
        averageOrderValue: '0.00',
      }
      ;(orderService.getOrderStats as jest.Mock).mockResolvedValue(mockStats)

      await orderAdminController.getStats(req as Request, res as Response)

      expect(res.json).toHaveBeenCalledWith({ data: mockStats })
    })
  })
})
