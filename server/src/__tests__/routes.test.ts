import request from 'supertest'
import app from './app'
import { prisma } from '../lib/prisma'

// Helper function to get CSRF token
async function getCsrfToken() {
  const response = await request(app).get('/api/auth/csrf')
  const setCookieHeader = response.headers['set-cookie']
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
  const csrfCookie = cookies.find((cookie: string) =>
    cookie.startsWith('csrf-token=')
  )
  if (!csrfCookie) return null
  const token = csrfCookie.split(';')[0].split('=')[1]
  return { token, cookie: csrfCookie }
}

describe('API Routes Integration Tests', () => {
  describe('GET /api/health', () => {
    it('should return health status when database is connected', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])
      // Mock exchange rate check
      ;(prisma.exchangeRate.findFirst as jest.Mock).mockResolvedValue({
        fetchedAt: new Date(),
      })

      const response = await request(app).get('/api/health')

      expect(response.status).toBe(200)
      // New health check format has services object
      expect(response.body.services.database.status).toBe('healthy')
      expect(response.body.timestamp).toBeDefined()
    })

    it('should return 503 when database is disconnected', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection failed'))

      const response = await request(app).get('/api/health')

      // Health endpoint returns 503 for unhealthy status
      expect(response.status).toBe(503)
      expect(response.body.status).toBe('unhealthy')
      expect(response.body.services.database.status).toBe('unhealthy')
    })
  })

  describe('GET /api/nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistent')

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('POST /api/auth/register', () => {
    it('should return validation error for missing fields', async () => {
      const csrf = await getCsrfToken()
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send({ email: 'invalid' })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return validation error for weak password', async () => {
      const csrf = await getCsrfToken()
      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
        })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should return validation error for missing password', async () => {
      const csrf = await getCsrfToken()
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send({ email: 'test@example.com' })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return validation error for invalid email', async () => {
      const csrf = await getCsrfToken()
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send({
          email: 'invalid-email',
          password: 'password123',
        })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/products', () => {
    it('should return products list', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      const response = await request(app).get('/api/products')

      expect(response.status).toBe(200)
      expect(response.body.data.products).toEqual([])
      expect(response.body.data.pagination).toBeDefined()
    })

    it('should accept pagination query params', async () => {
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.product.count as jest.Mock).mockResolvedValue(0)

      const response = await request(app)
        .get('/api/products')
        .query({ page: '2', limit: '10' })

      expect(response.status).toBe(200)
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      )
    })

    it('should return validation error for invalid page param', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 'abc' })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/products/:id', () => {
    it('should return product by id', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        brand: 'Test Brand',
        fragranceFamily: { id: 1, name: 'Woody' },
        longevity: { id: 1, name: 'Long', sortOrder: 1 },
        sillage: { id: 1, name: 'Moderate', sortOrder: 1 },
        seasons: [],
        occasions: [],
      }
      // getProduct uses findFirst with deletedAt: null
      ;(prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct)

      const response = await request(app).get('/api/products/1')

      expect(response.status).toBe(200)
      expect(response.body.data.id).toBe(1)
    })

    it('should return validation error for invalid id', async () => {
      const response = await request(app).get('/api/products/invalid')

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/products/filter-options', () => {
    it('should return filter options', async () => {
      ;(prisma.fragranceFamily.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.longevity.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.sillage.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.season.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.occasion.findMany as jest.Mock).mockResolvedValue([])

      const response = await request(app).get('/api/products/filter-options')

      expect(response.status).toBe(200)
      expect(response.body.data).toBeDefined()
    })
  })

  describe('GET /api/products/brands', () => {
    it('should return brands list with pagination', async () => {
      ;(prisma.product.groupBy as jest.Mock)
        .mockResolvedValueOnce([{ brand: 'Brand A' }, { brand: 'Brand B' }])
        .mockResolvedValueOnce([{ brand: 'Brand A' }, { brand: 'Brand B' }])

      const response = await request(app).get('/api/products/brands')

      expect(response.status).toBe(200)
      expect(response.body.data.brands).toEqual(['Brand A', 'Brand B'])
      expect(response.body.data.pagination).toBeDefined()
    })
  })

  describe('GET /api/products/stats', () => {
    it('should return product stats', async () => {
      ;(prisma.product.count as jest.Mock).mockResolvedValue(100)
      ;(prisma.product.findMany as jest.Mock).mockResolvedValue([
        { brand: 'A' },
        { brand: 'B' },
      ])

      const response = await request(app).get('/api/products/stats')

      expect(response.status).toBe(200)
      expect(response.body.data.productCount).toBe(100)
      expect(response.body.data.brandCount).toBe(2)
    })
  })

  describe('GET /api/promotions/active', () => {
    it('should return active promotion', async () => {
      const mockPromotion = {
        id: 1,
        name: 'Summer Sale',
        discountPercent: 20,
        startDate: new Date(),
        endDate: new Date(),
        isActive: true,
      }
      ;(prisma.promotion.findFirst as jest.Mock).mockResolvedValue(mockPromotion)

      const response = await request(app).get('/api/promotions/active')

      expect(response.status).toBe(200)
      expect(response.body.data.promotion).toBeDefined()
      expect(response.body.data.serverTime).toBeDefined()
    })

    it('should return null when no active promotion', async () => {
      ;(prisma.promotion.findFirst as jest.Mock).mockResolvedValue(null)

      const response = await request(app).get('/api/promotions/active')

      expect(response.status).toBe(200)
      expect(response.body.data.promotion).toBeNull()
    })
  })

  describe('POST /api/newsletter/subscribe', () => {
    it('should require CSRF token for newsletter subscription', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .set('Content-Type', 'application/json')
        .send({ email: 'invalid-email' })

      // CSRF protection kicks in before validation
      expect(response.status).toBe(403)
    })

    it('should require CSRF token even for missing email', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .set('Content-Type', 'application/json')
        .send({})

      // CSRF protection kicks in before validation
      expect(response.status).toBe(403)
    })
  })

  describe('Protected Routes', () => {
    describe('POST /api/products', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/products')
          .send({ name: 'Test' })

        expect(response.status).toBe(401)
      })
    })

    describe('DELETE /api/products/:id', () => {
      it('should require authentication', async () => {
        const response = await request(app).delete('/api/products/1')

        expect(response.status).toBe(401)
      })
    })

    describe('GET /api/promotions', () => {
      it('should require authentication', async () => {
        const response = await request(app).get('/api/promotions')

        expect(response.status).toBe(401)
      })
    })

    describe('POST /api/promotions', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/promotions')
          .send({ name: 'Test' })

        expect(response.status).toBe(401)
      })
    })

    describe('GET /api/admin/newsletter', () => {
      it('should require authentication', async () => {
        const response = await request(app).get('/api/admin/newsletter')

        expect(response.status).toBe(401)
      })
    })
  })
})
