import { Request, Response, NextFunction } from 'express'
import { AppError, errorHandler, notFoundHandler } from '../errorHandler'

describe('AppError', () => {
  it('should create an error with default status code 500', () => {
    const error = new AppError('Something went wrong')
    expect(error.message).toBe('Something went wrong')
    expect(error.statusCode).toBe(500)
    expect(error.code).toBeUndefined()
    expect(error.name).toBe('AppError')
  })

  it('should create an error with custom status code', () => {
    const error = new AppError('Not found', 404)
    expect(error.message).toBe('Not found')
    expect(error.statusCode).toBe(404)
  })

  it('should create an error with custom status code and code', () => {
    const error = new AppError('Invalid input', 400, 'VALIDATION_ERROR')
    expect(error.message).toBe('Invalid input')
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
  })
})

describe('notFoundHandler', () => {
  it('should return 404 with error message', () => {
    const req = {} as Request
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response

    notFoundHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Not Found',
        code: 'NOT_FOUND',
      },
    })
  })
})

describe('errorHandler', () => {
  let req: Request
  let res: Response
  let next: NextFunction

  beforeEach(() => {
    req = { method: 'GET', path: '/test' } as Request
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response
    next = jest.fn()
  })

  it('should handle AppError with status < 500', () => {
    const error = new AppError('Bad request', 400, 'BAD_REQUEST')

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Bad request',
        code: 'BAD_REQUEST',
      },
    })
  })

  it('should handle AppError with status >= 500', () => {
    const error = new AppError('Server error', 500, 'INTERNAL_ERROR')

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Server error',
        code: 'INTERNAL_ERROR',
      },
    })
  })

  it('should handle generic Error', () => {
    const error = new Error('Unknown error')

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
      },
    })
  })

  it('should handle AppError without code', () => {
    const error = new AppError('Forbidden', 403)

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Forbidden',
        code: undefined,
      },
    })
  })
})
