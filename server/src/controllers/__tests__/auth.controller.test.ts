import { Request, Response } from 'express'
import * as authService from '../../services/auth.service'
import * as authController from '../auth.controller'
import { AppError } from '../../middleware/errorHandler'

// Mock auth service
jest.mock('../../services/auth.service', () => ({
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  logoutAllDevices: jest.fn(),
  refreshTokens: jest.fn(),
  getProfile: jest.fn(),
  changePassword: jest.fn(),
}))

// Mock CSRF functions
jest.mock('../../middleware/csrf', () => ({
  generateCsrfToken: jest.fn().mockReturnValue('mock-csrf-token'),
  setCsrfCookie: jest.fn(),
  clearCsrfCookie: jest.fn(),
}))

describe('AuthController', () => {
  let req: Partial<Request>
  let res: Partial<Response>

  beforeEach(() => {
    req = {
      body: {},
      cookies: {},
      user: undefined,
      get: jest.fn().mockReturnValue('test-user-agent'),
      ip: '127.0.0.1',
    } as Partial<Request>
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    }
  })

  describe('register', () => {
    it('should register a new user and set cookies', async () => {
      const mockResult = {
        user: { id: 1, email: 'test@example.com', name: 'Test', role: 'USER' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test',
      }

      ;(authService.register as jest.Mock).mockResolvedValue(mockResult)

      await authController.register(req as Request, res as Response)

      expect(authService.register).toHaveBeenCalledWith(
        req.body,
        expect.objectContaining({
          userAgent: 'test-user-agent',
        })
      )
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'access-token',
        expect.any(Object)
      )
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.any(Object)
      )
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        data: { user: mockResult.user },
      })
    })
  })

  describe('login', () => {
    it('should login user and set cookies', async () => {
      const mockResult = {
        user: { id: 1, email: 'test@example.com', name: 'Test', role: 'USER' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
      }

      ;(authService.login as jest.Mock).mockResolvedValue(mockResult)

      await authController.login(req as Request, res as Response)

      expect(res.cookie).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({
        data: { user: mockResult.user },
      })
    })
  })

  describe('logout', () => {
    it('should logout user and clear cookies', async () => {
      req.cookies = { refreshToken: 'refresh-token' }
      ;(authService.logout as jest.Mock).mockResolvedValue(undefined)

      await authController.logout(req as Request, res as Response)

      expect(authService.logout).toHaveBeenCalledWith('refresh-token')
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.any(Object))
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object))
      expect(res.json).toHaveBeenCalledWith({
        data: { message: 'Logged out successfully' },
      })
    })
  })

  describe('logoutAllDevices', () => {
    it('should logout from all devices', async () => {
      req.user = { userId: 1, email: 'test@example.com', role: 'USER', tokenVersion: 0 }
      ;(authService.logoutAllDevices as jest.Mock).mockResolvedValue(undefined)

      await authController.logoutAllDevices(req as Request, res as Response)

      expect(authService.logoutAllDevices).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({
        data: { message: 'Logged out from all devices successfully' },
      })
    })

    it('should throw error if user not authenticated', async () => {
      req.user = undefined

      await expect(
        authController.logoutAllDevices(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  describe('refresh', () => {
    it('should refresh tokens and set new cookies', async () => {
      const mockResult = {
        user: { id: 1, email: 'test@example.com', name: 'Test', role: 'USER' },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }

      req.cookies = { refreshToken: 'old-refresh-token' }
      ;(authService.refreshTokens as jest.Mock).mockResolvedValue(mockResult)

      await authController.refresh(req as Request, res as Response)

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'old-refresh-token',
        expect.objectContaining({
          userAgent: 'test-user-agent',
        })
      )
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'new-access-token',
        expect.any(Object)
      )
      expect(res.json).toHaveBeenCalledWith({
        data: { user: mockResult.user },
      })
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test',
        role: 'USER',
      }

      req.user = { userId: 1, email: 'test@example.com', role: 'USER', tokenVersion: 0 }
      ;(authService.getProfile as jest.Mock).mockResolvedValue(mockUser)

      await authController.getProfile(req as Request, res as Response)

      expect(authService.getProfile).toHaveBeenCalledWith(1)
      expect(res.json).toHaveBeenCalledWith({ data: mockUser })
    })

    it('should throw error if user not authenticated', async () => {
      req.user = undefined

      await expect(
        authController.getProfile(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })

  describe('changePassword', () => {
    it('should change password and clear cookies', async () => {
      const mockResult = { message: 'Password changed successfully' }

      req.user = { userId: 1, email: 'test@example.com', role: 'USER', tokenVersion: 0 }
      req.body = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      }
      ;(authService.changePassword as jest.Mock).mockResolvedValue(mockResult)

      await authController.changePassword(req as Request, res as Response)

      expect(authService.changePassword).toHaveBeenCalledWith(1, req.body)
      expect(res.clearCookie).toHaveBeenCalled()
      expect(res.json).toHaveBeenCalledWith({ data: mockResult })
    })

    it('should throw error if user not authenticated', async () => {
      req.user = undefined

      await expect(
        authController.changePassword(req as Request, res as Response)
      ).rejects.toThrow(AppError)
    })
  })
})
