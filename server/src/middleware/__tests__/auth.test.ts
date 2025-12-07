import { Request, Response, NextFunction } from 'express'
import { authenticate, authorize } from '../auth'
import { AppError } from '../errorHandler'
import * as jwt from '../../lib/jwt'
import * as authService from '../../services/auth.service'

// Mock jwt module
jest.mock('../../lib/jwt', () => ({
  verifyAccessToken: jest.fn(),
}))

// Mock auth service
jest.mock('../../services/auth.service', () => ({
  getUserTokenVersion: jest.fn(),
}))

describe('authenticate middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      cookies: {},
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    next = jest.fn()
  })

  it('should call next with AppError when no token provided', async () => {
    req.cookies = {}

    await authenticate(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
  })

  it('should authenticate successfully with valid token', async () => {
    const mockPayload = {
      userId: 1,
      email: 'test@example.com',
      role: 'ADMIN',
      tokenVersion: 0,
    }

    req.cookies = { accessToken: 'valid-token' }
    ;(jwt.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload)
    ;(authService.getUserTokenVersion as jest.Mock).mockResolvedValue(0)

    await authenticate(req as Request, res as Response, next)

    expect(req.user).toEqual(mockPayload)
    expect(next).toHaveBeenCalledWith()
  })

  it('should call next with AppError when token is invalid', async () => {
    req.cookies = { accessToken: 'invalid-token' }
    ;(jwt.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token')
    })

    await authenticate(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('INVALID_TOKEN')
  })

  it('should call next with AppError when tokenVersion does not match', async () => {
    const mockPayload = {
      userId: 1,
      email: 'test@example.com',
      role: 'ADMIN',
      tokenVersion: 0,
    }

    req.cookies = { accessToken: 'valid-token' }
    ;(jwt.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload)
    ;(authService.getUserTokenVersion as jest.Mock).mockResolvedValue(1) // Different version

    await authenticate(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('SESSION_EXPIRED')
  })

  it('should call next with AppError when user not found', async () => {
    const mockPayload = {
      userId: 1,
      email: 'test@example.com',
      role: 'ADMIN',
      tokenVersion: 0,
    }

    req.cookies = { accessToken: 'valid-token' }
    ;(jwt.verifyAccessToken as jest.Mock).mockReturnValue(mockPayload)
    ;(authService.getUserTokenVersion as jest.Mock).mockResolvedValue(null)

    await authenticate(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('SESSION_EXPIRED')
  })

  it('should pass through AppError from jwt verification', async () => {
    const customError = new AppError('Custom error', 403, 'CUSTOM_ERROR')

    req.cookies = { accessToken: 'token' }
    ;(jwt.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw customError
    })

    await authenticate(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith(customError)
  })
})

describe('authorize middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {}
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    next = jest.fn()
  })

  it('should call next with AppError when user is not authenticated', () => {
    const middleware = authorize('ADMIN')
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
  })

  it('should call next() when user has required role', () => {
    req.user = {
      userId: 1,
      email: 'admin@example.com',
      role: 'ADMIN',
      tokenVersion: 0,
    }

    const middleware = authorize('ADMIN')
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should call next with AppError when user does not have required role', () => {
    req.user = {
      userId: 1,
      email: 'user@example.com',
      role: 'USER',
      tokenVersion: 0,
    }

    const middleware = authorize('ADMIN')
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('FORBIDDEN')
  })

  it('should allow access when user has any of multiple roles', () => {
    req.user = {
      userId: 1,
      email: 'user@example.com',
      role: 'USER',
      tokenVersion: 0,
    }

    const middleware = authorize('ADMIN', 'USER')
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should deny access when user has none of the required roles', () => {
    req.user = {
      userId: 1,
      email: 'user@example.com',
      role: 'GUEST',
      tokenVersion: 0,
    }

    const middleware = authorize('ADMIN', 'USER')
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(403)
  })
})
