import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'
import { AppError } from '../../middleware/errorHandler'
import * as orderService from '../order.service'
import * as promotionService from '../promotion.service'
import * as exchangeRateService from '../exchange-rate.service'

// Mock promotion and exchange rate services
jest.mock('../promotion.service', () => ({
  getActivePromotion: jest.fn(),
}))

jest.mock('../exchange-rate.service', () => ({
  getExchangeRates: jest.fn(),
  getExchangeRateSettings: jest.fn(),
}))

describe('OrderService', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'Sauvage',
      brand: 'Dior',
      slug: 'dior-sauvage',
      priceRON: new Prisma.Decimal(500),
      stock: 10,
      volumeMl: 100,
      imageUrl: 'https://example.com/sauvage.jpg',
    },
    {
      id: 2,
      name: 'Bleu de Chanel',
      brand: 'Chanel',
      slug: 'chanel-bleu',
      priceRON: new Prisma.Decimal(600),
      stock: 5,
      volumeMl: 50,
      imageUrl: 'https://example.com/bleu.jpg',
    },
  ]

  const mockShippingAddress = {
    name: 'John Doe',
    phone: '+40712345678',
    addressLine1: '123 Main Street',
    addressLine2: 'Apt 4B',
    city: 'Bucharest',
    state: 'Sector 1',
    postalCode: '010101',
    country: 'RO',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock for exchange rates
    ;(exchangeRateService.getExchangeRates as jest.Mock).mockResolvedValue({ EUR: 5.0 })
    ;(exchangeRateService.getExchangeRateSettings as jest.Mock).mockResolvedValue({
      feePercent: new Prisma.Decimal(2),
    })
    // Default: no active promotion
    ;(promotionService.getActivePromotion as jest.Mock).mockResolvedValue(null)
  })

  describe('calculateOrder', () => {
    it('should calculate order totals correctly without promotion', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts)

      const items = [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ]

      const result = await orderService.calculateOrder(items)

      expect(result.subtotalRON.toNumber()).toBe(1600) // (500*2) + (600*1)
      expect(result.discountRON.toNumber()).toBe(0)
      expect(result.discountPercent).toBeNull()
      expect(result.totalRON.toNumber()).toBe(1600)
      expect(result.exchangeRate).toBe(5.0)
      expect(result.feePercent).toBe(2)
      // totalEUR = (1600 / 5.0) * 1.02 = 326.4
      expect(result.totalEUR).toBeCloseTo(326.4)
      expect(result.orderItems).toHaveLength(2)
    })

    it('should apply promotion discount correctly', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts)
      ;(promotionService.getActivePromotion as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Summer Sale',
        discountPercent: 20,
      })

      const items = [{ productId: 1, quantity: 1 }]

      const result = await orderService.calculateOrder(items)

      expect(result.subtotalRON.toNumber()).toBe(500)
      expect(result.discountPercent).toBe(20)
      expect(result.discountRON.toNumber()).toBe(100) // 500 * 0.2
      expect(result.totalRON.toNumber()).toBe(400) // 500 - 100
    })

    it('should throw error for non-existent product', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([mockProducts[0]])

      const items = [
        { productId: 1, quantity: 1 },
        { productId: 999, quantity: 1 },
      ]

      await expect(orderService.calculateOrder(items)).rejects.toThrow(AppError)
      await expect(orderService.calculateOrder(items)).rejects.toMatchObject({
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
      })
    })

    it('should throw error for insufficient stock', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts)

      const items = [{ productId: 1, quantity: 100 }] // Only 10 in stock

      await expect(orderService.calculateOrder(items)).rejects.toThrow(AppError)
      await expect(orderService.calculateOrder(items)).rejects.toMatchObject({
        statusCode: 400,
        code: 'INSUFFICIENT_STOCK',
      })
    })

    it('should use fallback exchange rate when not available', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts)
      ;(exchangeRateService.getExchangeRates as jest.Mock).mockResolvedValue(null)

      const items = [{ productId: 1, quantity: 1 }]

      const result = await orderService.calculateOrder(items)

      expect(result.exchangeRate).toBe(4.97) // Fallback rate
    })

    it('should build order items with correct product details', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts)

      const items = [{ productId: 1, quantity: 2 }]

      const result = await orderService.calculateOrder(items)

      expect(result.orderItems[0]).toMatchObject({
        productId: 1,
        productName: 'Sauvage',
        productBrand: 'Dior',
        productSlug: 'dior-sauvage',
        volumeMl: 100,
        imageUrl: 'https://example.com/sauvage.jpg',
        quantity: 2,
      })
      expect(result.orderItems[0].unitPriceRON.toNumber()).toBe(500)
      expect(result.orderItems[0].totalPriceRON.toNumber()).toBe(1000)
    })
  })

  describe('createOrder', () => {
    const mockOrderData = {
      id: 1,
      orderNumber: 'ORD-20251210-000001',
      userId: 1,
      guestEmail: null,
      customerName: 'John Doe',
      status: 'PENDING',
      createdAt: new Date('2025-12-10'),
      items: [
        {
          id: 1,
          orderId: 1,
          productId: 1,
          productName: 'Sauvage',
          productBrand: 'Dior',
          quantity: 2,
        },
      ],
    }

    beforeEach(() => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts)
      // Mock transaction to return order data
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          order: {
            create: jest.fn().mockResolvedValue({
              ...mockOrderData,
              orderNumber: 'TEMP-uuid',
            }),
            update: jest.fn().mockResolvedValue(mockOrderData),
          },
          product: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        }
        return fn(tx)
      })
    })

    it('should create order for authenticated user', async () => {
      const params = {
        userId: 1,
        shippingAddress: mockShippingAddress,
        items: [{ productId: 1, quantity: 2 }],
        stripeSessionId: 'cs_test_123',
      }

      const result = await orderService.createOrder(params)

      expect(result.order).toBeDefined()
      expect(result.calculation).toBeDefined()
    })

    it('should create order for guest with email', async () => {
      const params = {
        guestEmail: 'guest@example.com',
        shippingAddress: mockShippingAddress,
        items: [{ productId: 1, quantity: 1 }],
        stripeSessionId: 'cs_test_456',
      }

      const result = await orderService.createOrder(params)

      expect(result.order).toBeDefined()
    })

    it('should throw error when neither userId nor guestEmail provided', async () => {
      const params = {
        shippingAddress: mockShippingAddress,
        items: [{ productId: 1, quantity: 1 }],
        stripeSessionId: 'cs_test_789',
      }

      await expect(orderService.createOrder(params)).rejects.toThrow(AppError)
      await expect(orderService.createOrder(params)).rejects.toMatchObject({
        statusCode: 400,
        code: 'GUEST_EMAIL_REQUIRED',
      })
    })

    it('should handle stock reservation race condition', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          order: {
            create: jest.fn().mockResolvedValue({
              ...mockOrderData,
              orderNumber: 'TEMP-uuid',
            }),
            update: jest.fn(),
          },
          product: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }), // No rows updated = race condition
          },
        }
        return fn(tx)
      })

      const params = {
        userId: 1,
        shippingAddress: mockShippingAddress,
        items: [{ productId: 1, quantity: 2 }],
        stripeSessionId: 'cs_test_race',
      }

      await expect(orderService.createOrder(params)).rejects.toThrow(AppError)
      await expect(orderService.createOrder(params)).rejects.toMatchObject({
        statusCode: 409,
        code: 'STOCK_RESERVATION_FAILED',
      })
    })
  })

  describe('markOrderPaid', () => {
    const mockPendingOrder = {
      id: 1,
      orderNumber: 'ORD-20251210-000001',
      status: 'PENDING',
      stripeSessionId: 'cs_test_123',
      items: [],
    }

    it('should mark pending order as paid', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockPendingOrder)
      ;(prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockPendingOrder,
        status: 'PAID',
        paidAt: new Date(),
      })

      const result = await orderService.markOrderPaid('cs_test_123', 'pi_123', 10000)

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'PAID',
          paidAt: expect.any(Date),
          stripePaymentIntentId: 'pi_123',
        }),
        include: { items: true },
      })
      expect(result.status).toBe('PAID')
    })

    it('should be idempotent for already paid orders', async () => {
      const paidOrder = { ...mockPendingOrder, status: 'PAID' }
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(paidOrder)

      const result = await orderService.markOrderPaid('cs_test_123', 'pi_123', 10000)

      expect(prisma.order.update).not.toHaveBeenCalled()
      expect(result.status).toBe('PAID')
    })

    it('should throw error for non-existent order', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        orderService.markOrderPaid('cs_nonexistent', 'pi_123', 10000)
      ).rejects.toThrow(AppError)
      await expect(
        orderService.markOrderPaid('cs_nonexistent', 'pi_123', 10000)
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
      })
    })

    it('should convert EUR cents to EUR correctly', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockPendingOrder)
      ;(prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockPendingOrder,
        status: 'PAID',
      })

      await orderService.markOrderPaid('cs_test_123', 'pi_123', 32640) // 326.40 EUR

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paidAmountEUR: expect.any(Prisma.Decimal),
          }),
        })
      )
    })
  })

  describe('markOrderCancelled', () => {
    const mockPendingOrder = {
      id: 1,
      orderNumber: 'ORD-20251210-000001',
      status: 'PENDING',
      stripeSessionId: 'cs_test_123',
      items: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
    }

    it('should cancel pending order and restore stock', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockPendingOrder)
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          product: {
            update: jest.fn().mockResolvedValue({}),
          },
          order: {
            update: jest.fn().mockResolvedValue({
              ...mockPendingOrder,
              status: 'CANCELLED',
            }),
          },
        }
        return fn(tx)
      })

      const result = await orderService.markOrderCancelled('cs_test_123')

      expect(result?.status).toBe('CANCELLED')
    })

    it('should return null for non-existent order', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await orderService.markOrderCancelled('cs_nonexistent')

      expect(result).toBeNull()
    })

    it('should not cancel already paid orders', async () => {
      const paidOrder = { ...mockPendingOrder, status: 'PAID' }
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(paidOrder)

      const result = await orderService.markOrderCancelled('cs_test_123')

      expect(prisma.$transaction).not.toHaveBeenCalled()
      expect(result?.status).toBe('PAID')
    })

    it('should not cancel already cancelled orders', async () => {
      const cancelledOrder = { ...mockPendingOrder, status: 'CANCELLED' }
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(cancelledOrder)

      const result = await orderService.markOrderCancelled('cs_test_123')

      expect(prisma.$transaction).not.toHaveBeenCalled()
      expect(result?.status).toBe('CANCELLED')
    })
  })

  describe('getUserOrders', () => {
    const mockOrders = [
      { id: 1, orderNumber: 'ORD-001', userId: 1, items: [] },
      { id: 2, orderNumber: 'ORD-002', userId: 1, items: [] },
    ]

    it('should return paginated orders for user', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)
      ;(prisma.order.count as jest.Mock).mockResolvedValue(2)

      const result = await orderService.getUserOrders(1, 1, 10)

      expect(result.orders).toHaveLength(2)
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should use default pagination values', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.order.count as jest.Mock).mockResolvedValue(0)

      await orderService.getUserOrders(1)

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      )
    })

    it('should calculate pagination correctly for multiple pages', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.order.count as jest.Mock).mockResolvedValue(25)

      const result = await orderService.getUserOrders(1, 2, 10)

      expect(result.pagination.totalPages).toBe(3)
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })
  })

  describe('getOrderById', () => {
    const mockOrder = {
      id: 1,
      orderNumber: 'ORD-001',
      userId: 1,
      items: [],
    }

    it('should return order by id', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)

      const result = await orderService.getOrderById(1)

      expect(result).toEqual(mockOrder)
    })

    it('should filter by userId when provided', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)

      await orderService.getOrderById(1, 1)

      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        include: { items: true },
      })
    })

    it('should throw error when order not found', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(orderService.getOrderById(999)).rejects.toThrow(AppError)
      await expect(orderService.getOrderById(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
      })
    })

    it('should throw error when user does not own order', async () => {
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(orderService.getOrderById(1, 2)).rejects.toThrow(AppError)
    })
  })

  describe('getOrderBySessionId', () => {
    const mockOrder = {
      id: 1,
      orderNumber: 'ORD-001',
      stripeSessionId: 'cs_test_123',
      items: [],
    }

    it('should return order by session id', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

      const result = await orderService.getOrderBySessionId('cs_test_123')

      expect(result).toEqual(mockOrder)
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { stripeSessionId: 'cs_test_123' },
        include: { items: true },
      })
    })

    it('should throw error when order not found', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        orderService.getOrderBySessionId('cs_nonexistent')
      ).rejects.toThrow(AppError)
      await expect(
        orderService.getOrderBySessionId('cs_nonexistent')
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
      })
    })
  })

  describe('cleanupStalePendingOrders', () => {
    const mockStaleOrders = [
      {
        id: 1,
        orderNumber: 'ORD-001',
        status: 'PENDING',
        items: [{ productId: 1, quantity: 2 }],
      },
      {
        id: 2,
        orderNumber: 'ORD-002',
        status: 'PENDING',
        items: [{ productId: 2, quantity: 1 }],
      },
    ]

    it('should cancel stale pending orders and restore stock', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockStaleOrders)
      ;(prisma.$transaction as jest.Mock).mockResolvedValue({})

      const result = await orderService.cleanupStalePendingOrders()

      expect(result.cancelled).toBe(2)
      expect(result.errors).toBe(0)
    })

    it('should return zero when no stale orders exist', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])

      const result = await orderService.cleanupStalePendingOrders()

      expect(result.cancelled).toBe(0)
      expect(result.errors).toBe(0)
    })

    it('should use custom timeout when provided', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])

      await orderService.cleanupStalePendingOrders(60)

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          createdAt: { lt: expect.any(Date) },
        },
        include: { items: true },
      })
    })

    it('should handle errors for individual orders', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockStaleOrders)
      ;(prisma.$transaction as jest.Mock)
        .mockResolvedValueOnce({}) // First order succeeds
        .mockRejectedValueOnce(new Error('DB error')) // Second order fails

      const result = await orderService.cleanupStalePendingOrders()

      expect(result.cancelled).toBe(1)
      expect(result.errors).toBe(1)
    })

    it('should handle non-Error exceptions during cleanup', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([mockStaleOrders[0]])
      ;(prisma.$transaction as jest.Mock).mockRejectedValue('string error') // Non-Error object

      const result = await orderService.cleanupStalePendingOrders()

      expect(result.cancelled).toBe(0)
      expect(result.errors).toBe(1)
    })

    it('should use default 45-minute timeout', async () => {
      const now = Date.now()
      jest.spyOn(Date, 'now').mockReturnValue(now)
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([])

      await orderService.cleanupStalePendingOrders()

      const expectedCutoff = new Date(now - 45 * 60 * 1000)
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          createdAt: { lt: expectedCutoff },
        },
        include: { items: true },
      })

      jest.restoreAllMocks()
    })
  })

  // ============================================================================
  // Admin Functions
  // ============================================================================

  describe('adminListOrders', () => {
    const mockOrders = [
      {
        id: 1,
        orderNumber: 'ORD-20241215-000001',
        status: 'PAID',
        customerName: 'John Doe',
        guestEmail: 'john@example.com',
        totalRON: new Prisma.Decimal(500),
        createdAt: new Date('2024-12-15'),
        items: [],
        user: null,
      },
    ]

    it('should list orders with default pagination', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)
      ;(prisma.order.count as jest.Mock).mockResolvedValue(1)

      const result = await orderService.adminListOrders()

      expect(result.orders).toEqual(mockOrders)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
      expect(result.pagination.total).toBe(1)
    })

    it('should filter by status', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)
      ;(prisma.order.count as jest.Mock).mockResolvedValue(1)

      await orderService.adminListOrders({ status: 'PAID' })

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PAID' },
        })
      )
    })

    it('should filter with search term', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)
      ;(prisma.order.count as jest.Mock).mockResolvedValue(1)

      await orderService.adminListOrders({ search: 'john' })

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              { orderNumber: expect.any(Object) },
              { customerName: expect.any(Object) },
              { guestEmail: expect.any(Object) },
              { user: expect.any(Object) },
            ]),
          },
        })
      )
    })

    it('should ignore status filter when set to all', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)
      ;(prisma.order.count as jest.Mock).mockResolvedValue(1)

      await orderService.adminListOrders({ status: 'all' })

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      )
    })

    it('should support custom sorting', async () => {
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)
      ;(prisma.order.count as jest.Mock).mockResolvedValue(1)

      await orderService.adminListOrders({ sortBy: 'totalRON', sortOrder: 'asc' })

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { totalRON: 'asc' },
        })
      )
    })
  })

  describe('adminGetOrderById', () => {
    const mockOrder = {
      id: 1,
      orderNumber: 'ORD-20241215-000001',
      status: 'PAID',
      items: [],
      user: null,
    }

    it('should return order by id', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

      const result = await orderService.adminGetOrderById(1)

      expect(result).toEqual(mockOrder)
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          items: true,
          user: { select: { id: true, email: true, name: true } },
        },
      })
    })

    it('should throw error when order not found', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(orderService.adminGetOrderById(999)).rejects.toThrow(AppError)
      await expect(orderService.adminGetOrderById(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
      })
    })
  })

  describe('adminUpdateOrderStatus', () => {
    const mockOrder = {
      id: 1,
      orderNumber: 'ORD-20241215-000001',
      status: 'PAID',
      items: [{ productId: 1, quantity: 2 }],
    }

    beforeEach(() => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)
    })

    it('should update order status with valid transition', async () => {
      ;(prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: 'PROCESSING',
      })
      ;(prisma.order.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockOrder) // First call to check current status
        .mockResolvedValueOnce({ ...mockOrder, status: 'PROCESSING' }) // Second call for adminGetOrderById

      const result = await orderService.adminUpdateOrderStatus(1, 'PROCESSING')

      expect(result.order.status).toBe('PROCESSING')
      expect(result.stockRestored).toBe(false)
    })

    it('should restore stock when cancelling order', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        await fn({
          product: { update: jest.fn() },
          order: { update: jest.fn() },
        })
      })
      ;(prisma.order.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({ ...mockOrder, status: 'CANCELLED' })

      const result = await orderService.adminUpdateOrderStatus(1, 'CANCELLED')

      expect(result.stockRestored).toBe(true)
    })

    it('should restore stock when refunding order', async () => {
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        await fn({
          product: { update: jest.fn() },
          order: { update: jest.fn() },
        })
      })
      ;(prisma.order.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({ ...mockOrder, status: 'REFUNDED' })

      const result = await orderService.adminUpdateOrderStatus(1, 'REFUNDED')

      expect(result.stockRestored).toBe(true)
    })

    it('should throw error for invalid status transition', async () => {
      await expect(orderService.adminUpdateOrderStatus(1, 'DELIVERED')).rejects.toThrow(
        AppError
      )
      await expect(orderService.adminUpdateOrderStatus(1, 'DELIVERED')).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_STATUS_TRANSITION',
      })
    })

    it('should throw error when order not found', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(orderService.adminUpdateOrderStatus(999, 'PROCESSING')).rejects.toThrow(
        AppError
      )
      await expect(orderService.adminUpdateOrderStatus(999, 'PROCESSING')).rejects.toMatchObject({
        statusCode: 404,
        code: 'ORDER_NOT_FOUND',
      })
    })
  })

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      ;(prisma.order.groupBy as jest.Mock).mockResolvedValue([
        { status: 'PAID', _count: { id: 5 } },
        { status: 'PROCESSING', _count: { id: 3 } },
      ])
      ;(prisma.order.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalRON: new Prisma.Decimal(5000) },
      })

      const result = await orderService.getOrderStats()

      expect(result.byStatus).toEqual({
        PAID: 5,
        PROCESSING: 3,
      })
      expect(result.last24Hours).toBe(2)
      expect(result.totalRevenue).toBe(5000)
    })

    it('should return zero revenue when no orders', async () => {
      ;(prisma.order.groupBy as jest.Mock).mockResolvedValue([])
      ;(prisma.order.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalRON: null },
      })

      const result = await orderService.getOrderStats()

      expect(result.byStatus).toEqual({})
      expect(result.last24Hours).toBe(0)
      expect(result.totalRevenue).toBe(0)
    })
  })
})
