/**
 * Checkout Flow Integration Tests
 *
 * Tests the complete checkout flow including:
 * - Order retrieval by session ID
 * - User order listing
 * - Single order retrieval
 *
 * Note: Session creation tests are limited due to rate limiting (5/min)
 */
import request from 'supertest'
import app from './app'
import { prisma } from '../lib/prisma'

// Mock bcrypt for login
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}))

// Helper to get CSRF token
async function getCsrfToken() {
  const response = await request(app).get('/api/auth/csrf')
  const setCookieHeader = response.headers['set-cookie']
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  const csrfCookie = cookies.find((cookie: string) => cookie?.startsWith('csrf-token='))
  if (!csrfCookie) return null
  const token = csrfCookie.split(';')[0].split('=')[1]
  return { token, cookie: csrfCookie }
}

// Extract cookies from response
function extractCookies(response: request.Response): Record<string, string> {
  const cookies: Record<string, string> = {}
  const setCookieHeader = response.headers['set-cookie']
  if (!setCookieHeader) return cookies

  const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  cookieArray.forEach((cookie: string) => {
    const [nameValue] = cookie.split(';')
    const [name, value] = nameValue.split('=')
    cookies[name] = value
  })
  return cookies
}

// Helper to create auth cookies
async function loginUser() {
  const csrf = await getCsrfToken()

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    role: 'USER',
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
  ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
    id: 1,
    token: 'hashed-refresh-token',
    userId: 1,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .set('Cookie', csrf!.cookie)
    .set('x-csrf-token', csrf!.token)
    .send({
      email: 'test@example.com',
      password: 'ValidPassword123!',
    })

  return {
    cookies: extractCookies(loginResponse),
    csrf,
    user: mockUser,
  }
}

describe('Checkout Flow Integration Tests', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Perfume',
    brand: 'Test Brand',
    priceRON: '250.00',
    stock: 10,
    isActive: true,
    deletedAt: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Get Order by Session ID', () => {
    const mockOrder = {
      id: 1,
      orderNumber: 'ORD-2024-001',
      status: 'PAID',
      stripeSessionId: 'cs_test_session_123',
      totalRON: '500.00',
      createdAt: new Date(),
      items: [
        {
          id: 1,
          product: mockProduct,
          quantity: 2,
          priceRON: '250.00',
        },
      ],
      customerName: 'John Doe',
      shippingAddressLine1: '123 Test Street',
      shippingCity: 'Test City',
      shippingPostalCode: '12345',
      shippingCountry: 'RO',
    }

    it('should return order by session ID', async () => {
      // getOrderBySessionId uses findUnique
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder)

      const response = await request(app).get(
        '/api/checkout/session/cs_test_session_123'
      )

      expect(response.status).toBe(200)
      expect(response.body.data.orderNumber).toBe('ORD-2024-001')
      expect(response.body.data.status).toBe('PAID')
    })

    it('should return 404 for non-existent session', async () => {
      ;(prisma.order.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app).get(
        '/api/checkout/session/cs_nonexistent'
      )

      expect(response.status).toBe(404)
    })
  })

  describe('User Orders', () => {
    const mockOrders = [
      {
        id: 1,
        orderNumber: 'ORD-2024-001',
        status: 'PAID',
        totalRON: '500.00',
        createdAt: new Date(),
        items: [],
      },
      {
        id: 2,
        orderNumber: 'ORD-2024-002',
        status: 'SHIPPED',
        totalRON: '750.00',
        createdAt: new Date(),
        items: [],
      },
    ]

    it('should return orders for authenticated user', async () => {
      const { cookies, user } = await loginUser()

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders)
      ;(prisma.order.count as jest.Mock).mockResolvedValue(2)

      const response = await request(app)
        .get('/api/checkout/orders')
        .set('Cookie', `accessToken=${cookies.accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.orders).toHaveLength(2)
      expect(response.body.data.pagination).toBeDefined()
    })

    it('should reject orders request without authentication', async () => {
      const response = await request(app).get('/api/checkout/orders')

      expect(response.status).toBe(401)
    })

    it('should support pagination', async () => {
      const { cookies, user } = await loginUser()

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      ;(prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrders[0]])
      ;(prisma.order.count as jest.Mock).mockResolvedValue(2)

      const response = await request(app)
        .get('/api/checkout/orders')
        .query({ page: 1, limit: 1 })
        .set('Cookie', `accessToken=${cookies.accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.orders).toHaveLength(1)
      expect(response.body.data.pagination.totalPages).toBe(2)
    })
  })

  describe('Get Single Order', () => {
    const mockOrder = {
      id: 1,
      userId: 1,
      orderNumber: 'ORD-2024-001',
      status: 'PAID',
      totalRON: '500.00',
      createdAt: new Date(),
      items: [
        {
          id: 1,
          product: mockProduct,
          quantity: 2,
          priceRON: '250.00',
        },
      ],
      customerName: 'John Doe',
      shippingAddressLine1: '123 Test Street',
      shippingCity: 'Test City',
      shippingPostalCode: '12345',
      shippingCountry: 'RO',
    }

    it('should return single order for authenticated user', async () => {
      const { cookies, user } = await loginUser()

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(mockOrder)

      const response = await request(app)
        .get('/api/checkout/orders/1')
        .set('Cookie', `accessToken=${cookies.accessToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.orderNumber).toBe('ORD-2024-001')
    })

    it('should return 404 for order not owned by user', async () => {
      const { cookies, user } = await loginUser()

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)
      ;(prisma.order.findFirst as jest.Mock).mockResolvedValue(null) // Order not found (filtered by userId)

      const response = await request(app)
        .get('/api/checkout/orders/999')
        .set('Cookie', `accessToken=${cookies.accessToken}`)

      expect(response.status).toBe(404)
    })

    it('should reject order request without authentication', async () => {
      const response = await request(app).get('/api/checkout/orders/1')

      expect(response.status).toBe(401)
    })

    it('should return validation error for invalid order ID', async () => {
      const { cookies, user } = await loginUser()

      // Re-mock user for auth middleware on subsequent request
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)

      const response = await request(app)
        .get('/api/checkout/orders/invalid')
        .set('Cookie', `accessToken=${cookies.accessToken}`)

      // Should fail validation because 'invalid' doesn't match /^\d+$/
      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })
})
