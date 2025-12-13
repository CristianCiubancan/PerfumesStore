import { prisma } from '../../../lib/prisma'
import {
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  findValidRefreshToken,
  cleanupExpiredTokens,
  generateTokenPair,
  refreshTokens,
  getUserTokenVersion,
} from '../token.service'
import { AppError } from '../../../middleware/errorHandler'
import * as jwt from '../../../lib/jwt'

// Mock prisma
jest.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock logger
jest.mock('../../../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock jwt module
jest.mock('../../../lib/jwt', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  hashToken: jest.fn(),
  getRefreshTokenExpiry: jest.fn(),
}))

describe('TokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('storeRefreshToken', () => {
    it('should store a refresh token in the database', async () => {
      const userId = 1
      const token = 'refresh-token-string'
      const tokenHash = 'hashed-token'
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      ;(jwt.hashToken as jest.Mock).mockReturnValue(tokenHash)
      ;(jwt.getRefreshTokenExpiry as jest.Mock).mockReturnValue(expiresAt)
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      await storeRefreshToken(userId, token, {
        userAgent: 'Mozilla/5.0',
        ipAddress: '127.0.0.1',
      })

      expect(jwt.hashToken).toHaveBeenCalledWith(token)
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          tokenHash,
          expiresAt,
          userAgent: 'Mozilla/5.0',
          ipAddress: '127.0.0.1',
        },
      })
    })

    it('should store token without context', async () => {
      const userId = 1
      const token = 'refresh-token-string'
      const tokenHash = 'hashed-token'
      const expiresAt = new Date()

      ;(jwt.hashToken as jest.Mock).mockReturnValue(tokenHash)
      ;(jwt.getRefreshTokenExpiry as jest.Mock).mockReturnValue(expiresAt)
      ;(prisma.refreshToken.create as jest.Mock).mockResolvedValue({})

      await storeRefreshToken(userId, token)

      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          tokenHash,
          expiresAt,
          userAgent: undefined,
          ipAddress: undefined,
        },
      })
    })
  })

  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token', async () => {
      const token = 'refresh-token-string'
      const tokenHash = 'hashed-token'

      ;(jwt.hashToken as jest.Mock).mockReturnValue(tokenHash)
      ;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await revokeRefreshToken(token)

      expect(jwt.hashToken).toHaveBeenCalledWith(token)
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      })
      expect(result).toBe(true)
    })

    it('should return false if token not found', async () => {
      ;(jwt.hashToken as jest.Mock).mockReturnValue('hashed-token')
      ;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 0 })

      const result = await revokeRefreshToken('non-existent-token')

      expect(result).toBe(false)
    })
  })

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user and increment tokenVersion', async () => {
      const userId = 1

      ;(prisma.refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 3 })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})

      await revokeAllUserTokens(userId)

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      })
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      })
    })
  })

  describe('findValidRefreshToken', () => {
    it('should find a valid refresh token', async () => {
      const token = 'refresh-token-string'
      const tokenHash = 'hashed-token'
      const mockToken = {
        id: 'token-id',
        userId: 1,
        tokenHash,
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
      }

      ;(jwt.hashToken as jest.Mock).mockReturnValue(tokenHash)
      ;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(mockToken)

      const result = await findValidRefreshToken(token)

      expect(jwt.hashToken).toHaveBeenCalledWith(token)
      expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: {
          tokenHash,
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
      })
      expect(result).toEqual(mockToken)
    })

    it('should return null for invalid/expired token', async () => {
      ;(jwt.hashToken as jest.Mock).mockReturnValue('hashed-token')
      ;(prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null)

      const result = await findValidRefreshToken('invalid-token')

      expect(result).toBeNull()
    })
  })

  describe('cleanupExpiredTokens', () => {
    it('should delete expired and revoked tokens', async () => {
      ;(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 5 })

      const result = await cleanupExpiredTokens()

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { revokedAt: { not: null } },
          ],
        },
      })
      expect(result).toBe(5)
    })

    it('should return 0 when no tokens to clean', async () => {
      ;(prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })

      const result = await cleanupExpiredTokens()

      expect(result).toBe(0)
    })
  })

  describe('generateTokenPair', () => {
    it('should generate access and refresh tokens', () => {
      const payload = {
        userId: 1,
        email: 'test@example.com',
        role: 'USER' as const,
        tokenVersion: 0,
      }

      ;(jwt.generateAccessToken as jest.Mock).mockReturnValue('access-token')
      ;(jwt.generateRefreshToken as jest.Mock).mockReturnValue({ token: 'refresh-token' })

      const result = generateTokenPair(payload)

      expect(jwt.generateAccessToken).toHaveBeenCalledWith(payload)
      expect(jwt.generateRefreshToken).toHaveBeenCalledWith(payload)
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
    })
  })

  describe('getUserTokenVersion', () => {
    it('should return user tokenVersion', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ tokenVersion: 5 })

      const result = await getUserTokenVersion(1)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { tokenVersion: true },
      })
      expect(result).toBe(5)
    })

    it('should return null if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await getUserTokenVersion(999)

      expect(result).toBeNull()
    })
  })

  describe('refreshTokens', () => {
    it('should throw error if no refresh token provided', async () => {
      await expect(refreshTokens(undefined)).rejects.toThrow(AppError)
      await expect(refreshTokens(undefined)).rejects.toMatchObject({
        statusCode: 401,
        code: 'REFRESH_TOKEN_REQUIRED',
      })
    })

    it('should throw error if JWT verification fails', async () => {
      ;(jwt.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(refreshTokens('invalid-token')).rejects.toThrow(AppError)
      await expect(refreshTokens('invalid-token')).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
      })
    })

    it('should throw error if user not found', async () => {
      const payload = { userId: 999, email: 'test@example.com', role: 'USER', tokenVersion: 0 }
      ;(jwt.verifyRefreshToken as jest.Mock).mockReturnValue(payload)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(refreshTokens('valid-token')).rejects.toThrow(AppError)
      await expect(refreshTokens('valid-token')).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      })
    })

    it('should throw error if tokenVersion mismatch', async () => {
      const payload = { userId: 1, email: 'test@example.com', role: 'USER', tokenVersion: 0 }
      const user = {
        id: 1,
        email: 'test@example.com',
        name: 'Test',
        role: 'USER',
        tokenVersion: 1, // Different from payload
        createdAt: new Date(),
      }

      ;(jwt.verifyRefreshToken as jest.Mock).mockReturnValue(payload)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(user)

      await expect(refreshTokens('valid-token')).rejects.toThrow(AppError)
      await expect(refreshTokens('valid-token')).rejects.toMatchObject({
        statusCode: 401,
        code: 'SESSION_EXPIRED',
      })
    })
  })
})
