import bcrypt from 'bcrypt'
import { prisma } from '../../lib/prisma'
import * as jwt from '../../lib/jwt'
import { AppError } from '../../middleware/errorHandler'

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

// Mock jwt module
jest.mock('../../lib/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue({
    token: 'mock-refresh-token',
    jti: 'mock-jti',
  }),
  verifyRefreshToken: jest.fn(),
  hashToken: jest.fn().mockReturnValue('mock-token-hash'),
  getRefreshTokenExpiry: jest.fn().mockReturnValue(new Date('2025-01-01')),
}))

// Import after mocks
import * as authService from '../auth.service'

describe('AuthService', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    tokenVersion: 0,
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const input = {
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New User',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        ...mockUser,
        email: input.email,
        name: input.name,
      })
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      const result = await authService.register(input)

      expect(result.user.email).toBe(input.email)
      expect(result.accessToken).toBe('mock-access-token')
      expect(result.refreshToken).toBe('mock-refresh-token')
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12)
    })

    it('should throw error if email already exists', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await expect(authService.register(input)).rejects.toThrow(AppError)
      await expect(authService.register(input)).rejects.toMatchObject({
        statusCode: 400,
        code: 'EMAIL_EXISTS',
      })
    })
  })

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const input = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      const result = await authService.login(input)

      expect(result.user.email).toBe(input.email)
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
    })

    it('should throw error for non-existent email', async () => {
      const input = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(authService.login(input)).rejects.toThrow(AppError)
      await expect(authService.login(input)).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      })
    })

    it('should throw error for incorrect password', async () => {
      const input = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(authService.login(input)).rejects.toThrow(AppError)
      await expect(authService.login(input)).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      })
    })
  })

  describe('logout', () => {
    it('should revoke refresh token on logout', async () => {
      ;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      await authService.logout('valid-refresh-token')

      expect(prisma.refreshToken.updateMany).toHaveBeenCalled()
    })

    it('should handle logout without token gracefully', async () => {
      await expect(authService.logout(undefined)).resolves.not.toThrow()
    })
  })

  describe('logoutAllDevices', () => {
    it('should revoke all tokens for a user', async () => {
      ;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 3 })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, tokenVersion: 1 })

      await authService.logoutAllDevices(1)

      expect(prisma.refreshToken.updateMany).toHaveBeenCalled()
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: { tokenVersion: { increment: 1 } },
        })
      )
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        createdAt: new Date(),
      })

      const result = await authService.getProfile(1)

      expect(result.id).toBe(1)
      expect(result.email).toBe('test@example.com')
    })

    it('should throw error if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(authService.getProfile(999)).rejects.toThrow(AppError)
      await expect(authService.getProfile(999)).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      })
    })
  })

  describe('refreshTokens', () => {
    it('should throw error when no refresh token provided', async () => {
      await expect(authService.refreshTokens(undefined)).rejects.toThrow(AppError)
      await expect(authService.refreshTokens(undefined)).rejects.toMatchObject({
        statusCode: 401,
        code: 'REFRESH_TOKEN_REQUIRED',
      })
    })

    it('should throw error for invalid refresh token', async () => {
      ;(jwt.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(authService.refreshTokens('invalid-token')).rejects.toThrow(
        AppError
      )
    })

    it('should throw error when token not found in database', async () => {
      ;(jwt.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: 1,
        email: 'test@example.com',
        role: 'USER',
        tokenVersion: 0,
        jti: 'test-jti',
      })
      ;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      await expect(authService.refreshTokens('valid-but-deleted')).rejects.toThrow(
        AppError
      )
    })

    it('should refresh tokens successfully', async () => {
      const mockTokenPayload = {
        userId: 1,
        email: 'test@example.com',
        role: 'USER',
        tokenVersion: 0,
        jti: 'test-jti',
      }

      ;(jwt.verifyRefreshToken as jest.Mock).mockReturnValue(mockTokenPayload)
      ;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
        id: 'token-id',
        userId: 1,
        tokenHash: 'hash',
        expiresAt: new Date('2025-12-31'),
        revokedAt: null,
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        tokenVersion: 0,
      })
      ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
        const tx = {
          refreshToken: {
            findFirst: jest.fn().mockResolvedValue({ id: 'token-id' }),
            update: jest.fn().mockResolvedValue({}),
            create: jest.fn().mockResolvedValue({}),
          },
        }
        return fn(tx)
      })

      const result = await authService.refreshTokens('valid-refresh-token')

      expect(result.user).toBeDefined()
      expect(result.accessToken).toBe('mock-access-token')
      expect(result.refreshToken).toBe('mock-refresh-token')
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const input = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await authService.changePassword(1, input)

      expect(result.message).toContain('Password changed')
    })

    it('should throw error if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        authService.changePassword(999, {
          currentPassword: 'Old123!',
          newPassword: 'New123!',
        })
      ).rejects.toThrow(AppError)
    })

    it('should throw error if current password is incorrect', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        authService.changePassword(1, {
          currentPassword: 'WrongOld123!',
          newPassword: 'New123!',
        })
      ).rejects.toThrow(AppError)
      await expect(
        authService.changePassword(1, {
          currentPassword: 'WrongOld123!',
          newPassword: 'New123!',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_CURRENT_PASSWORD',
      })
    })
  })

  describe('getUserTokenVersion', () => {
    it('should return token version for existing user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        tokenVersion: 5,
      })

      const result = await authService.getUserTokenVersion(1)

      expect(result).toBe(5)
    })

    it('should return null for non-existent user', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await authService.getUserTokenVersion(999)

      expect(result).toBeNull()
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and revoked tokens', async () => {
      ;(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 5 })

      const result = await authService.cleanupExpiredTokens()

      expect(result).toBe(5)
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalled()
    })

    it('should return 0 when no tokens to clean', async () => {
      ;(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })

      const result = await authService.cleanupExpiredTokens()

      expect(result).toBe(0)
    })
  })
})
