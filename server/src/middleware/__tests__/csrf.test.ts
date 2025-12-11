import { Request, Response, NextFunction } from 'express'
import {
  generateCsrfToken,
  setCsrfCookie,
  clearCsrfCookie,
  csrfProtection,
} from '../csrf'
import { AppError } from '../errorHandler'

describe('CSRF utilities', () => {
  describe('generateCsrfToken', () => {
    it('should generate a 64-character hex token', () => {
      const token = generateCsrfToken()
      expect(token).toHaveLength(64)
      expect(/^[a-f0-9]+$/.test(token)).toBe(true)
    })

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('setCsrfCookie', () => {
    it('should set CSRF cookie with correct options', () => {
      const res = {
        cookie: jest.fn(),
      } as unknown as Response

      setCsrfCookie(res, 'test-token')

      expect(res.cookie).toHaveBeenCalledWith(
        'csrf-token',
        'test-token',
        expect.objectContaining({
          httpOnly: false, // Must be readable by JS
          sameSite: 'lax', // Allows cross-origin requests while protecting against CSRF
          maxAge: 24 * 60 * 60 * 1000,
        })
      )
    })
  })

  describe('clearCsrfCookie', () => {
    it('should clear CSRF cookie', () => {
      const res = {
        clearCookie: jest.fn(),
      } as unknown as Response

      clearCsrfCookie(res)

      expect(res.clearCookie).toHaveBeenCalledWith(
        'csrf-token',
        expect.objectContaining({
          httpOnly: false,
          sameSite: 'lax',
        })
      )
    })
  })
})

describe('csrfProtection middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      method: 'POST',
      cookies: {},
      get: jest.fn(),
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    next = jest.fn()
  })

  it('should skip CSRF check for GET requests', () => {
    req.method = 'GET'

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should skip CSRF check for HEAD requests', () => {
    req.method = 'HEAD'

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should skip CSRF check for OPTIONS requests', () => {
    req.method = 'OPTIONS'

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should call next with AppError when cookie token is missing', () => {
    req.method = 'POST'
    req.cookies = {}
    ;(req.get as jest.Mock).mockReturnValue('header-token')

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('CSRF_TOKEN_MISSING')
  })

  it('should call next with AppError when header token is missing', () => {
    req.method = 'POST'
    req.cookies = { 'csrf-token': 'cookie-token' }
    ;(req.get as jest.Mock).mockReturnValue(undefined)

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe('CSRF_TOKEN_MISSING')
  })

  it('should call next with AppError when tokens do not match', () => {
    req.method = 'POST'
    req.cookies = { 'csrf-token': 'cookie-token' }
    ;(req.get as jest.Mock).mockReturnValue('different-header-token')

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe('CSRF_TOKEN_INVALID')
  })

  it('should call next() when tokens match', () => {
    const token = 'matching-token'
    req.method = 'POST'
    req.cookies = { 'csrf-token': token }
    ;(req.get as jest.Mock).mockReturnValue(token)

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should work for PUT requests', () => {
    const token = 'matching-token'
    req.method = 'PUT'
    req.cookies = { 'csrf-token': token }
    ;(req.get as jest.Mock).mockReturnValue(token)

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should work for DELETE requests', () => {
    const token = 'matching-token'
    req.method = 'DELETE'
    req.cookies = { 'csrf-token': token }
    ;(req.get as jest.Mock).mockReturnValue(token)

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should work for PATCH requests', () => {
    const token = 'matching-token'
    req.method = 'PATCH'
    req.cookies = { 'csrf-token': token }
    ;(req.get as jest.Mock).mockReturnValue(token)

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should reject tokens with different lengths', () => {
    req.method = 'POST'
    req.cookies = { 'csrf-token': 'short' }
    ;(req.get as jest.Mock).mockReturnValue('longer-token')

    csrfProtection(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.code).toBe('CSRF_TOKEN_INVALID')
  })
})
