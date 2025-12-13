import { Request, Response } from 'express'
import { requestIdMiddleware } from '../requestId'

// Mock crypto
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-1234'),
}))

describe('requestIdMiddleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockReq = {
      headers: {},
    }
    mockRes = {
      setHeader: jest.fn(),
    }
    mockNext = jest.fn()
  })

  it('should generate a new UUID if no X-Request-ID header is provided', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.requestId).toBe('mock-uuid-1234')
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'mock-uuid-1234')
    expect(mockNext).toHaveBeenCalled()
  })

  it('should use client-provided X-Request-ID header if present', () => {
    mockReq.headers = {
      'x-request-id': 'client-provided-id-567',
    }

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.requestId).toBe('client-provided-id-567')
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'client-provided-id-567')
    expect(mockNext).toHaveBeenCalled()
  })

  it('should attach requestId to the request object', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq).toHaveProperty('requestId')
    expect(typeof mockReq.requestId).toBe('string')
  })

  it('should set X-Request-ID response header', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockRes.setHeader).toHaveBeenCalledTimes(1)
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String))
  })

  it('should call next() to continue the middleware chain', () => {
    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockNext).toHaveBeenCalledTimes(1)
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should handle empty x-request-id header by generating new UUID', () => {
    mockReq.headers = {
      'x-request-id': '',
    }

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    // Empty string is falsy, so should generate new UUID
    expect(mockReq.requestId).toBe('mock-uuid-1234')
  })

  it('should preserve request ID for distributed tracing', () => {
    const tracingId = 'trace-abc-123-xyz'
    mockReq.headers = {
      'x-request-id': tracingId,
    }

    requestIdMiddleware(mockReq as Request, mockRes as Response, mockNext)

    expect(mockReq.requestId).toBe(tracingId)
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', tracingId)
  })
})
