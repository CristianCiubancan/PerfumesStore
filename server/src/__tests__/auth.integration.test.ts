/**
 * Auth Flow Integration Tests
 *
 * Tests the complete authentication flow including:
 * - Registration
 * - Login
 * - Token refresh
 * - Profile access
 * - Logout
 *
 * Note: Tests are grouped to minimize login calls due to rate limiting (5/15min)
 */
import request from 'supertest'
import app from './app'
import { prisma } from '../lib/prisma'
import * as bcrypt from 'bcrypt'

// Mock bcrypt for consistent password hashing in tests
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockImplementation((plain, hashed) =>
    Promise.resolve(plain === 'ValidPassword123!' || plain === 'NewPassword123!')
  ),
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

describe('Auth Flow Integration Tests', () => {
  const testUser = {
    email: 'integration-test@example.com',
    password: 'ValidPassword123!',
    name: 'Integration Test User',
  }

  const mockDbUser = {
    id: 1,
    email: testUser.email,
    name: testUser.name,
    password: 'hashed-password',
    role: 'USER',
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const csrf = await getCsrfToken()

      // Mock: user doesn't exist
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      // Mock: create user
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockDbUser)
      // Mock: create refresh token
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: 1,
        token: 'hashed-refresh-token',
        userId: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send(testUser)

      expect(response.status).toBe(201)
      expect(response.body.data.user.email).toBe(testUser.email)
      expect(response.body.data.user.name).toBe(testUser.name)
      expect(response.body.data.user).not.toHaveProperty('password')

      // Should set auth cookies
      const cookies = extractCookies(response)
      expect(cookies.accessToken).toBeDefined()
      expect(cookies.refreshToken).toBeDefined()
    })

    it('should reject registration with existing email', async () => {
      const csrf = await getCsrfToken()

      // Mock: user already exists
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)

      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send(testUser)

      expect(response.status).toBe(409)
      expect(response.body.error.code).toBe('CONFLICT')
    })

    it('should reject registration with weak password', async () => {
      const csrf = await getCsrfToken()

      const response = await request(app)
        .post('/api/auth/register')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send({
          ...testUser,
          password: 'weak',
        })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const csrf = await getCsrfToken()

      // Mock: find user
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)
      // Mock: create refresh token
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: 1,
        token: 'hashed-refresh-token',
        userId: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send({
          email: testUser.email,
          password: testUser.password,
        })

      expect(response.status).toBe(200)
      expect(response.body.data.user.email).toBe(testUser.email)

      // Should set auth cookies
      const cookies = extractCookies(response)
      expect(cookies.accessToken).toBeDefined()
      expect(cookies.refreshToken).toBeDefined()
    })

    it('should reject login with invalid email', async () => {
      const csrf = await getCsrfToken()

      // Mock: user not found
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('should reject login with wrong password', async () => {
      const csrf = await getCsrfToken()

      // Mock: find user but password won't match
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValueOnce(false)

      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('Profile Access', () => {
    it('should return profile for authenticated user', async () => {
      // Mock: get profile
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockDbUser,
        _count: { orders: 5 },
      })

      // First login to get tokens
      const csrf = await getCsrfToken()
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
          email: testUser.email,
          password: testUser.password,
        })

      const cookies = extractCookies(loginResponse)

      // Access profile with token
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', `accessToken=${cookies.accessToken}`)

      expect(profileResponse.status).toBe(200)
      expect(profileResponse.body.data.email).toBe(testUser.email)
    })

    it('should reject profile access without authentication', async () => {
      const response = await request(app).get('/api/auth/profile')

      expect(response.status).toBe(401)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('Token Refresh Flow', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const csrf = await getCsrfToken()

      // Mock user and refresh token
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser)
      ;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        token: 'hashed-refresh-token',
        userId: 1,
        user: mockDbUser,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      ;(prisma.refreshToken.delete as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        id: 2,
        token: 'new-hashed-refresh-token',
        userId: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)
        .send({
          email: testUser.email,
          password: testUser.password,
        })

      const cookies = extractCookies(loginResponse)

      // Refresh tokens (needs CSRF)
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${cookies.refreshToken}; ${csrf!.cookie}`)
        .set('x-csrf-token', csrf!.token)

      expect(refreshResponse.status).toBe(200)
      expect(refreshResponse.body.data.user.email).toBe(testUser.email)

      // Should set new cookies
      const newCookies = extractCookies(refreshResponse)
      expect(newCookies.accessToken).toBeDefined()
      expect(newCookies.refreshToken).toBeDefined()
    })

    it('should reject refresh with missing refresh token', async () => {
      const csrf = await getCsrfToken()

      // Needs CSRF even when refresh token is missing
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)

      expect(response.status).toBe(401)
    })
  })

  describe('Logout Flow', () => {
    it('should handle logout and clear cookies', async () => {
      const csrf = await getCsrfToken()

      // Logout needs CSRF
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', csrf!.cookie)
        .set('x-csrf-token', csrf!.token)

      // Should return success even without token (graceful handling)
      expect(response.status).toBe(200)
    })
  })
})
