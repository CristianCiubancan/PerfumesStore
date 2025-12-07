import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validate } from '../validate'
import { AppError } from '../errorHandler'

describe('validate middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    next = jest.fn()
  })

  it('should call next() when validation passes', () => {
    const schema = z.object({
      body: z.object({
        name: z.string(),
      }),
    })

    req.body = { name: 'Test' }

    const middleware = validate(schema)
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should call next with AppError when validation fails', () => {
    const schema = z.object({
      body: z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
      }),
    })

    req.body = { name: '', email: 'invalid' }

    const middleware = validate(schema)
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('VALIDATION_ERROR')
  })

  it('should validate query params', () => {
    const schema = z.object({
      query: z.object({
        page: z.string().regex(/^\d+$/),
      }),
    })

    req.query = { page: 'abc' }

    const middleware = validate(schema)
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(400)
  })

  it('should validate route params', () => {
    const schema = z.object({
      params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid ID'),
      }),
    })

    req.params = { id: '123' }

    const middleware = validate(schema)
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('should validate route params with invalid value', () => {
    const schema = z.object({
      params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid ID'),
      }),
    })

    req.params = { id: 'abc' }

    const middleware = validate(schema)
    middleware(req as Request, res as Response, next)

    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
  })

  it('should pass through non-Zod errors', () => {
    const schema = z.object({
      body: z.object({
        value: z.string().transform(() => {
          throw new Error('Transform error')
        }),
      }),
    })

    req.body = { value: 'test' }

    const middleware = validate(schema)
    middleware(req as Request, res as Response, next)

    expect(next).toHaveBeenCalledTimes(1)
    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error.message).toBe('Transform error')
  })

  it('should combine multiple validation error messages', () => {
    const schema = z.object({
      body: z.object({
        name: z.string().min(1, 'Name required'),
        age: z.number({ message: 'Age must be a number' }),
      }),
    })

    req.body = { name: '', age: 'not-a-number' }

    const middleware = validate(schema)
    middleware(req as Request, res as Response, next)

    const error = (next as jest.Mock).mock.calls[0][0]
    expect(error).toBeInstanceOf(AppError)
    expect(error.message).toContain('Name required')
    expect(error.message).toContain('Age must be a number')
  })
})
