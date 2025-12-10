import { Request, Response } from 'express'
import * as checkoutService from '../../services/checkout.service'
import * as orderService from '../../services/order.service'
import * as stripeWebhookService from '../../services/stripe-webhook.service'
import * as checkoutController from '../checkout.controller'

// Mock services
jest.mock('../../services/checkout.service', () => ({
  createCheckoutSession: jest.fn(),
}))

jest.mock('../../services/order.service', () => ({
  getOrderBySessionId: jest.fn(),
  getUserOrders: jest.fn(),
  getOrderById: jest.fn(),
}))

jest.mock('../../services/stripe-webhook.service', () => ({
  handleStripeWebhook: jest.fn(),
}))

describe('CheckoutController', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: undefined,
    } as Partial<Request>
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    jest.clearAllMocks()
  })

  describe('createCheckoutSession', () => {
    const mockCheckoutResult = {
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      orderNumber: 'ORD-20251210-000001',
    }

    it('should create checkout session for authenticated user', async () => {
      req.body = {
        items: [{ productId: 1, quantity: 2 }],
        shippingAddress: {
          name: 'John Doe',
          addressLine1: '123 Main St',
          city: 'Bucharest',
          postalCode: '010101',
          country: 'RO',
        },
        locale: 'en',
      }
      req.user = { userId: 1, email: 'user@example.com', role: 'USER', tokenVersion: 0 }
      ;(checkoutService.createCheckoutSession as jest.Mock).mockResolvedValue(
        mockCheckoutResult
      )

      await checkoutController.createCheckoutSession(req as Request, res as Response)

      expect(checkoutService.createCheckoutSession).toHaveBeenCalledWith({
        input: req.body,
        userId: 1,
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockCheckoutResult })
    })

    it('should create checkout session for guest user', async () => {
      req.body = {
        items: [{ productId: 1, quantity: 1 }],
        shippingAddress: {
          name: 'Guest User',
          addressLine1: '456 Oak Ave',
          city: 'Cluj',
          postalCode: '400001',
          country: 'RO',
        },
        guestEmail: 'guest@example.com',
        locale: 'ro',
      }
      req.user = undefined
      ;(checkoutService.createCheckoutSession as jest.Mock).mockResolvedValue(
        mockCheckoutResult
      )

      await checkoutController.createCheckoutSession(req as Request, res as Response)

      expect(checkoutService.createCheckoutSession).toHaveBeenCalledWith({
        input: req.body,
        userId: undefined,
      })
      expect(res.json).toHaveBeenCalledWith({ data: mockCheckoutResult })
    })
  })

  describe('handleWebhook', () => {
    it('should handle Stripe webhook and return received true', async () => {
      const payload = Buffer.from('{"type": "test"}')
      req.body = payload
      req.headers = { 'stripe-signature': 'sig_test_123' }
      ;(stripeWebhookService.handleStripeWebhook as jest.Mock).mockResolvedValue({
        received: true,
      })

      await checkoutController.handleWebhook(req as Request, res as Response)

      expect(stripeWebhookService.handleStripeWebhook).toHaveBeenCalledWith(
        payload,
        'sig_test_123'
      )
      expect(res.json).toHaveBeenCalledWith({ received: true })
    })

    it('should handle missing signature header', async () => {
      req.body = Buffer.from('{}')
      req.headers = {}
      ;(stripeWebhookService.handleStripeWebhook as jest.Mock).mockResolvedValue({
        received: true,
      })

      await checkoutController.handleWebhook(req as Request, res as Response)

      expect(stripeWebhookService.handleStripeWebhook).toHaveBeenCalledWith(
        req.body,
        undefined
      )
    })
  })

  describe('getOrderBySession', () => {
    const mockOrder = {
      id: 1,
      orderNumber: 'ORD-20251210-000001',
      status: 'PAID',
      items: [],
    }

    it('should return order by session id', async () => {
      req.params = { sessionId: 'cs_test_123' }
      ;(orderService.getOrderBySessionId as jest.Mock).mockResolvedValue(mockOrder)

      await checkoutController.getOrderBySession(req as Request, res as Response)

      expect(orderService.getOrderBySessionId).toHaveBeenCalledWith('cs_test_123')
      expect(res.json).toHaveBeenCalledWith({ data: mockOrder })
    })
  })

  describe('getUserOrders', () => {
    const mockOrdersResult = {
      orders: [
        { id: 1, orderNumber: 'ORD-001', items: [] },
        { id: 2, orderNumber: 'ORD-002', items: [] },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    }

    it('should return user orders with default pagination', async () => {
      req.user = { userId: 1, email: 'user@example.com', role: 'USER', tokenVersion: 0 }
      req.query = {}
      ;(orderService.getUserOrders as jest.Mock).mockResolvedValue(mockOrdersResult)

      await checkoutController.getUserOrders(req as Request, res as Response)

      expect(orderService.getUserOrders).toHaveBeenCalledWith(1, 1, 10)
      expect(res.json).toHaveBeenCalledWith({ data: mockOrdersResult })
    })

    it('should return user orders with custom pagination', async () => {
      req.user = { userId: 1, email: 'user@example.com', role: 'USER', tokenVersion: 0 }
      req.query = { page: '2', limit: '20' }
      ;(orderService.getUserOrders as jest.Mock).mockResolvedValue(mockOrdersResult)

      await checkoutController.getUserOrders(req as Request, res as Response)

      expect(orderService.getUserOrders).toHaveBeenCalledWith(1, 2, 20)
    })

    it('should return 401 for unauthenticated user', async () => {
      req.user = undefined
      req.query = {}

      await checkoutController.getUserOrders(req as Request, res as Response)

      expect(orderService.getUserOrders).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
      })
    })

    it('should use default values for invalid pagination params', async () => {
      req.user = { userId: 1, email: 'user@example.com', role: 'USER', tokenVersion: 0 }
      req.query = { page: 'invalid', limit: 'invalid' }
      ;(orderService.getUserOrders as jest.Mock).mockResolvedValue(mockOrdersResult)

      await checkoutController.getUserOrders(req as Request, res as Response)

      // parseInt returns NaN for invalid strings, but || operator provides defaults
      expect(orderService.getUserOrders).toHaveBeenCalledWith(1, 1, 10)
    })
  })

  describe('getOrder', () => {
    const mockOrder = {
      id: 1,
      orderNumber: 'ORD-20251210-000001',
      userId: 1,
      status: 'PAID',
      items: [],
    }

    it('should return order by id for authenticated user', async () => {
      req.user = { userId: 1, email: 'user@example.com', role: 'USER', tokenVersion: 0 }
      req.params = { id: '1' }
      ;(orderService.getOrderById as jest.Mock).mockResolvedValue(mockOrder)

      await checkoutController.getOrder(req as Request, res as Response)

      expect(orderService.getOrderById).toHaveBeenCalledWith(1, 1)
      expect(res.json).toHaveBeenCalledWith({ data: mockOrder })
    })

    it('should return 401 for unauthenticated user', async () => {
      req.user = undefined
      req.params = { id: '1' }

      await checkoutController.getOrder(req as Request, res as Response)

      expect(orderService.getOrderById).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
      })
    })

    it('should parse order id correctly', async () => {
      req.user = { userId: 1, email: 'user@example.com', role: 'USER', tokenVersion: 0 }
      req.params = { id: '42' }
      ;(orderService.getOrderById as jest.Mock).mockResolvedValue(mockOrder)

      await checkoutController.getOrder(req as Request, res as Response)

      expect(orderService.getOrderById).toHaveBeenCalledWith(42, 1)
    })

    it('should pass userId to ensure user owns the order', async () => {
      req.user = { userId: 5, email: 'user@example.com', role: 'USER', tokenVersion: 0 }
      req.params = { id: '1' }
      ;(orderService.getOrderById as jest.Mock).mockResolvedValue(mockOrder)

      await checkoutController.getOrder(req as Request, res as Response)

      expect(orderService.getOrderById).toHaveBeenCalledWith(1, 5)
    })
  })
})
