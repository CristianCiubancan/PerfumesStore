import bcrypt from 'bcrypt'
import { prisma } from '../../../lib/prisma'
import {
  hashPassword,
  verifyPassword,
  changePassword,
  DUMMY_HASH,
} from '../password.service'
import { AppError } from '../../../middleware/errorHandler'
import * as tokenService from '../token.service'

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

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
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock token service
jest.mock('../token.service', () => ({
  revokeAllUserTokens: jest.fn(),
}))

describe('PasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash a password with bcrypt', async () => {
      const password = 'testPassword123!'
      const expectedHash = '$2b$12$hashedpassword'
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(expectedHash)

      const result = await hashPassword(password)

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12) // AUTH.BCRYPT_SALT_ROUNDS
      expect(result).toBe(expectedHash)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testPassword123!'
      const hash = '$2b$12$hashedpassword'
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await verifyPassword(password, hash)

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash)
      expect(result).toBe(true)
    })

    it('should return false for non-matching password', async () => {
      const password = 'wrongPassword'
      const hash = '$2b$12$hashedpassword'
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const result = await verifyPassword(password, hash)

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash)
      expect(result).toBe(false)
    })
  })

  describe('DUMMY_HASH', () => {
    it('should be a valid bcrypt hash', () => {
      expect(DUMMY_HASH).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/)
    })
  })

  describe('changePassword', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      passwordHash: '$2b$12$existinghash',
    }

    it('should change password successfully', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhash')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(tokenService.revokeAllUserTokens as jest.Mock).mockResolvedValue(undefined)

      const result = await changePassword(1, {
        currentPassword: 'currentPass123!',
        newPassword: 'newPass456!',
      })

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      })
      expect(bcrypt.compare).toHaveBeenCalledWith('currentPass123!', mockUser.passwordHash)
      expect(bcrypt.hash).toHaveBeenCalledWith('newPass456!', 12)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { passwordHash: '$2b$12$newhash' },
      })
      expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith(1)
      expect(result.message).toContain('Password changed successfully')
    })

    it('should throw error if user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await expect(
        changePassword(999, {
          currentPassword: 'currentPass123!',
          newPassword: 'newPass456!',
        })
      ).rejects.toThrow(AppError)

      await expect(
        changePassword(999, {
          currentPassword: 'currentPass123!',
          newPassword: 'newPass456!',
        })
      ).rejects.toMatchObject({
        statusCode: 404,
        code: 'USER_NOT_FOUND',
      })
    })

    it('should throw error if current password is incorrect', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        changePassword(1, {
          currentPassword: 'wrongPassword',
          newPassword: 'newPass456!',
        })
      ).rejects.toThrow(AppError)

      await expect(
        changePassword(1, {
          currentPassword: 'wrongPassword',
          newPassword: 'newPass456!',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_CURRENT_PASSWORD',
      })

      expect(prisma.user.update).not.toHaveBeenCalled()
    })

    it('should invalidate all sessions after password change', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhash')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(tokenService.revokeAllUserTokens as jest.Mock).mockResolvedValue(undefined)

      await changePassword(1, {
        currentPassword: 'currentPass123!',
        newPassword: 'newPass456!',
      })

      expect(tokenService.revokeAllUserTokens).toHaveBeenCalledWith(1)
    })
  })
})
