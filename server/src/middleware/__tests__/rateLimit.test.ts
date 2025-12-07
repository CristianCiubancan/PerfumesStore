import request from 'supertest'
import express, { Express, Request, Response } from 'express'
import rateLimit from 'express-rate-limit'

/**
 * Rate Limiting Tests
 *
 * Tests rate limiting middleware configurations to verify:
 * - Requests within limits are allowed
 * - Requests exceeding limits receive 429 status
 * - Error responses have correct format (code: RATE_LIMIT_EXCEEDED)
 * - RateLimit headers are set correctly (draft-7 standard)
 *
 * Each test creates fresh rate limiter instances to ensure isolation.
 */

// Helper to create a test app with a rate limiter
function createTestApp(limiter: ReturnType<typeof rateLimit>): Express {
  const app = express()
  app.use(express.json())
  app.use(limiter)
  app.get('/test', (_req: Request, res: Response) => {
    res.json({ success: true })
  })
  app.post('/test', (_req: Request, res: Response) => {
    res.json({ success: true })
  })
  return app
}

// Helper to make N requests and return all responses
async function makeRequests(
  app: Express,
  count: number,
  method: 'get' | 'post' = 'get'
): Promise<request.Response[]> {
  const responses: request.Response[] = []
  for (let i = 0; i < count; i++) {
    const response = await request(app)[method]('/test')
    responses.push(response)
  }
  return responses
}

describe('Rate Limiting Middleware', () => {
  describe('authRateLimiter', () => {
    // Configuration: 5 requests per 15 minutes
    const createAuthLimiter = () =>
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        message: {
          error: {
            message:
              'Too many authentication attempts, please try again after 15 minutes',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        },
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      })

    it('should allow requests within the limit', async () => {
      const app = createTestApp(createAuthLimiter())
      const responses = await makeRequests(app, 5)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })
    })

    it('should block requests exceeding the limit with 429 status', async () => {
      const app = createTestApp(createAuthLimiter())
      const responses = await makeRequests(app, 6)

      // First 5 should succeed
      for (let i = 0; i < 5; i++) {
        expect(responses[i].status).toBe(200)
      }

      // 6th should be rate limited
      expect(responses[5].status).toBe(429)
    })

    it('should return correct error format when rate limited', async () => {
      const app = createTestApp(createAuthLimiter())
      await makeRequests(app, 5)
      const blockedResponse = await request(app).get('/test')

      expect(blockedResponse.status).toBe(429)
      expect(blockedResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(blockedResponse.body.error.message).toBe(
        'Too many authentication attempts, please try again after 15 minutes'
      )
    })

    it('should set RateLimit headers according to draft-7', async () => {
      const app = createTestApp(createAuthLimiter())
      const response = await request(app).get('/test')

      expect(response.status).toBe(200)
      // draft-7 uses lowercase 'ratelimit' header
      expect(response.headers['ratelimit']).toBeDefined()
      expect(response.headers['ratelimit-policy']).toBeDefined()
    })

    it('should not set legacy X-RateLimit headers', async () => {
      const app = createTestApp(createAuthLimiter())
      const response = await request(app).get('/test')

      expect(response.headers['x-ratelimit-limit']).toBeUndefined()
      expect(response.headers['x-ratelimit-remaining']).toBeUndefined()
    })
  })

  describe('apiRateLimiter', () => {
    // Configuration: 200 requests per minute
    // Using smaller limit for testing to avoid slow tests
    const createApiLimiter = (limit = 5) =>
      rateLimit({
        windowMs: 60 * 1000,
        limit,
        message: {
          error: {
            message: 'Too many requests, please slow down',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        },
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      })

    it('should allow requests within the limit', async () => {
      const app = createTestApp(createApiLimiter(5))
      const responses = await makeRequests(app, 5)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should block requests exceeding the limit', async () => {
      const app = createTestApp(createApiLimiter(3))
      const responses = await makeRequests(app, 4)

      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[2].status).toBe(200)
      expect(responses[3].status).toBe(429)
    })

    it('should return correct error message for API rate limit', async () => {
      const app = createTestApp(createApiLimiter(1))
      await request(app).get('/test')
      const blockedResponse = await request(app).get('/test')

      expect(blockedResponse.status).toBe(429)
      expect(blockedResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(blockedResponse.body.error.message).toBe(
        'Too many requests, please slow down'
      )
    })
  })

  describe('healthRateLimiter', () => {
    // Configuration: 60 requests per minute
    const createHealthLimiter = (limit = 5) =>
      rateLimit({
        windowMs: 60 * 1000,
        limit,
        message: {
          error: {
            message: 'Too many health checks',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        },
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      })

    it('should allow health checks within the limit', async () => {
      const app = createTestApp(createHealthLimiter(5))
      const responses = await makeRequests(app, 5)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should block excessive health checks', async () => {
      const app = createTestApp(createHealthLimiter(2))
      const responses = await makeRequests(app, 3)

      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[2].status).toBe(429)
    })

    it('should return correct error message for health check rate limit', async () => {
      const app = createTestApp(createHealthLimiter(1))
      await request(app).get('/test')
      const blockedResponse = await request(app).get('/test')

      expect(blockedResponse.status).toBe(429)
      expect(blockedResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(blockedResponse.body.error.message).toBe('Too many health checks')
    })
  })

  describe('sensitiveRateLimiter', () => {
    // Configuration: 20 requests per minute
    const createSensitiveLimiter = (limit = 5) =>
      rateLimit({
        windowMs: 60 * 1000,
        limit,
        message: {
          error: {
            message: 'Too many requests for this operation, please wait',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        },
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      })

    it('should allow sensitive operations within the limit', async () => {
      const app = createTestApp(createSensitiveLimiter(5))
      const responses = await makeRequests(app, 5, 'post')

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should block excessive sensitive operations', async () => {
      const app = createTestApp(createSensitiveLimiter(2))
      const responses = await makeRequests(app, 3, 'post')

      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[2].status).toBe(429)
    })

    it('should return correct error message for sensitive operation rate limit', async () => {
      const app = createTestApp(createSensitiveLimiter(1))
      await request(app).post('/test')
      const blockedResponse = await request(app).post('/test')

      expect(blockedResponse.status).toBe(429)
      expect(blockedResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(blockedResponse.body.error.message).toBe(
        'Too many requests for this operation, please wait'
      )
    })
  })

  describe('newsletterRateLimiter', () => {
    // Configuration: 20 requests per 15 minutes
    const createNewsletterLimiter = (limit = 5) =>
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit,
        message: {
          error: {
            message: 'Too many subscription attempts, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
          },
        },
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      })

    it('should allow newsletter subscriptions within the limit', async () => {
      const app = createTestApp(createNewsletterLimiter(5))
      const responses = await makeRequests(app, 5, 'post')

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should block excessive newsletter subscription attempts', async () => {
      const app = createTestApp(createNewsletterLimiter(3))
      const responses = await makeRequests(app, 4, 'post')

      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[2].status).toBe(200)
      expect(responses[3].status).toBe(429)
    })

    it('should return correct error message for newsletter rate limit', async () => {
      const app = createTestApp(createNewsletterLimiter(1))
      await request(app).post('/test')
      const blockedResponse = await request(app).post('/test')

      expect(blockedResponse.status).toBe(429)
      expect(blockedResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(blockedResponse.body.error.message).toBe(
        'Too many subscription attempts, please try again later'
      )
    })
  })

  describe('Rate limiter configuration validation', () => {
    it('should track requests per IP address by default', async () => {
      // express-rate-limit uses req.ip by default
      const limiter = rateLimit({
        windowMs: 60 * 1000,
        limit: 2,
        message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Limited' } },
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      })
      const app = createTestApp(limiter)

      // All requests from same test client share same IP
      const responses = await makeRequests(app, 3)

      expect(responses[0].status).toBe(200)
      expect(responses[1].status).toBe(200)
      expect(responses[2].status).toBe(429)
    })

    it('should include RateLimit-Policy header with limit and window', async () => {
      const limiter = rateLimit({
        windowMs: 60 * 1000,
        limit: 10,
        message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Limited' } },
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      })
      const app = createTestApp(limiter)

      const response = await request(app).get('/test')

      expect(response.headers['ratelimit-policy']).toBeDefined()
      // Policy should contain limit and window
      expect(response.headers['ratelimit-policy']).toContain('10')
      expect(response.headers['ratelimit-policy']).toContain('w=60')
    })

    it('should decrement remaining count with each request', async () => {
      const limiter = rateLimit({
        windowMs: 60 * 1000,
        limit: 5,
        message: { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Limited' } },
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      })
      const app = createTestApp(limiter)

      const response1 = await request(app).get('/test')
      const response2 = await request(app).get('/test')

      // Parse the ratelimit header to check remaining
      // Format: limit=5, remaining=4, reset=60
      const header1 = response1.headers['ratelimit']
      const header2 = response2.headers['ratelimit']

      expect(header1).toContain('remaining=4')
      expect(header2).toContain('remaining=3')
    })
  })

  describe('Error response format consistency', () => {
    const errorMessages = [
      {
        name: 'auth',
        message:
          'Too many authentication attempts, please try again after 15 minutes',
      },
      { name: 'api', message: 'Too many requests, please slow down' },
      { name: 'health', message: 'Too many health checks' },
      {
        name: 'sensitive',
        message: 'Too many requests for this operation, please wait',
      },
      {
        name: 'newsletter',
        message: 'Too many subscription attempts, please try again later',
      },
    ]

    errorMessages.forEach(({ name, message }) => {
      it(`should return consistent error format for ${name} rate limiter`, async () => {
        const limiter = rateLimit({
          windowMs: 60 * 1000,
          limit: 1,
          message: {
            error: {
              message,
              code: 'RATE_LIMIT_EXCEEDED',
            },
          },
          standardHeaders: 'draft-7',
          legacyHeaders: false,
        })
        const app = createTestApp(limiter)

        await request(app).get('/test')
        const response = await request(app).get('/test')

        expect(response.status).toBe(429)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED')
        expect(response.body.error).toHaveProperty('message', message)
      })
    })
  })
})
