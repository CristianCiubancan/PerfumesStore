import { prisma } from '../../../lib/prisma'
import {
  checkEmailRateLimit,
  resetEmailRateLimit,
  isAccountLocked,
  resetFailedLoginAttempts,
  handleFailedLogin,
  getProfile,
  getLockoutStatus,
} from '../account.service'
import { AppError } from '../../../middleware/errorHandler'

// Mock prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock logger
jest.mock('../../../lib/logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}))

describe('AccountService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkEmailRateLimit', () => {
    beforeEach(() => {
      // Reset rate limit store between tests
      resetEmailRateLimit('test@example.com')
    })

    it('should return false for first attempt', () => {
      const result = checkEmailRateLimit('fresh@example.com')
      expect(result).toBe(false)
      resetEmailRateLimit('fresh@example.com')
    })

    it('should return false for attempts within limit', () => {
      const email = 'limit@example.com'
      for (let i = 0; i < 5; i++) {
        expect(checkEmailRateLimit(email)).toBe(false)
      }
      resetEmailRateLimit(email)
    })

    it('should return true when rate limit exceeded', () => {
      const email = 'exceeded@example.com'
      // Make 5 attempts (at the limit)
      for (let i = 0; i < 5; i++) {
        checkEmailRateLimit(email)
      }
      // 6th attempt should exceed limit
      expect(checkEmailRateLimit(email)).toBe(true)
      resetEmailRateLimit(email)
    })
  })

  describe('resetEmailRateLimit', () => {
    it('should reset rate limit for email', () => {
      const email = 'reset@example.com'
      // Hit rate limit
      for (let i = 0; i < 6; i++) {
        checkEmailRateLimit(email)
      }
      expect(checkEmailRateLimit(email)).toBe(true)

      // Reset
      resetEmailRateLimit(email)

      // Should allow again
      expect(checkEmailRateLimit(email)).toBe(false)
      resetEmailRateLimit(email)
    })
  })

  describe('isAccountLocked', () => {
    it('should return false when lockedUntil is null', () => {
      const user = { lockedUntil: null }
      expect(isAccountLocked(user)).toBe(false)
    })

    it('should return false when lock has expired', () => {
      const pastDate = new Date(Date.now() - 60000) // 1 minute ago
      const user = { lockedUntil: pastDate }
      expect(isAccountLocked(user)).toBe(false)
    })

    it('should return true when account is currently locked', () => {
      const futureDate = new Date(Date.now() + 60000) // 1 minute from now
      const user = { lockedUntil: futureDate }
      expect(isAccountLocked(user)).toBe(true)
    })
  })

  describe('resetFailedLoginAttempts', () => {
    it('should reset failed attempts and lockedUntil', async () => {
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      await resetFailedLoginAttempts(1)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      })
    })
  })

  describe('handleFailedLogin', () => {
    it('should increment failed attempts', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        failedLoginAttempts: 1,
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      await handleFailedLogin(1)

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            failedLoginAttempts: 2,
          }),
        })
      )
    })

    it('should do nothing if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handleFailedLogin(999)

      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should lock account after max failed attempts', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        failedLoginAttempts: 4, // Will become 5 (MAX_FAILED_ATTEMPTS)
      })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      await handleFailedLogin(1)

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            failedLoginAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        })
      )
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
      }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await getProfile(1)

      expect(result).toEqual(mockUser)
    })

    it('should throw error if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(getProfile(999)).rejects.toThrow(AppError)
      await expect(getProfile(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      })
    })
  })

  describe('getLockoutStatus', () => {
    it('should return null when account is not locked', () => {
      const user = { lockedUntil: null }
      expect(getLockoutStatus(user)).toBeNull()
    })

    it('should return null when lock has expired', () => {
      const pastDate = new Date(Date.now() - 60000)
      const user = { lockedUntil: pastDate }
      expect(getLockoutStatus(user)).toBeNull()
    })

    it('should return lockout status when account is locked', () => {
      const futureDate = new Date(Date.now() + 5 * 60000) // 5 minutes from now
      const user = { lockedUntil: futureDate }

      const result = getLockoutStatus(user)

      expect(result).not.toBeNull()
      expect(result?.isLocked).toBe(true)
      expect(result?.minutesRemaining).toBeGreaterThan(0)
      expect(result?.minutesRemaining).toBeLessThanOrEqual(5)
      expect(result?.logMessage).toContain('Login attempt for locked account')
    })
  })
})
