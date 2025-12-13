import { Request, Response } from 'express'
import { etagMiddleware, shortEtag, mediumEtag, longEtag } from '../etag'

describe('ETag Middleware', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: jest.Mock
  let jsonSpy: jest.Mock
  let statusSpy: jest.Mock
  let endSpy: jest.Mock
  let setHeaderSpy: jest.Mock

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      headers: {},
    }
    endSpy = jest.fn().mockReturnThis()
    statusSpy = jest.fn().mockReturnThis()
    setHeaderSpy = jest.fn()
    jsonSpy = jest.fn().mockReturnThis()

    mockRes = {
      json: jsonSpy,
      status: statusSpy,
      end: endSpy,
      setHeader: setHeaderSpy,
    }
    mockRes.json = mockRes.json!.bind(mockRes)

    mockNext = jest.fn()
  })

  describe('etagMiddleware', () => {
    it('should skip non-GET requests', () => {
      mockReq.method = 'POST'
      const originalJson = mockRes.json
      const middleware = etagMiddleware()

      middleware(mockReq as Request, mockRes as Response, mockNext)

      expect(mockNext).toHaveBeenCalled()
      // json should not be overridden - compare by reference
      expect(mockRes.json).toBe(originalJson)
    })

    it('should generate and set ETag header on response', () => {
      const middleware = etagMiddleware()
      const responseBody = { data: 'test' }

      middleware(mockReq as Request, mockRes as Response, mockNext)
      expect(mockNext).toHaveBeenCalled()

      // Call the overridden json method
      mockRes.json!(responseBody)

      // Should set ETag header
      expect(setHeaderSpy).toHaveBeenCalledWith('ETag', expect.stringMatching(/^W\/"[a-f0-9]+"$/))
      // Should set Cache-Control header
      expect(setHeaderSpy).toHaveBeenCalledWith('Cache-Control', expect.stringContaining('max-age='))
    })

    it('should return 304 when If-None-Match matches ETag', () => {
      const middleware = etagMiddleware()
      const responseBody = { data: 'test' }

      // First request to get the ETag
      middleware(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!(responseBody)

      // Get the generated ETag from the first call
      const generatedETag = setHeaderSpy.mock.calls.find((call: unknown[]) => call[0] === 'ETag')?.[1]
      expect(generatedETag).toBeDefined()

      // Reset mocks for second request
      setHeaderSpy.mockClear()
      statusSpy.mockClear()
      endSpy.mockClear()
      jsonSpy.mockClear()

      // Second request with If-None-Match header
      mockReq.headers = { 'if-none-match': generatedETag }
      mockRes.json = jest.fn().mockReturnThis()
      mockRes.json = mockRes.json.bind(mockRes)

      middleware(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!(responseBody)

      // Should return 304
      expect(statusSpy).toHaveBeenCalledWith(304)
      expect(endSpy).toHaveBeenCalled()
    })

    it('should return full response when If-None-Match does not match', () => {
      const middleware = etagMiddleware()
      const responseBody = { data: 'test' }

      mockReq.headers = { 'if-none-match': 'W/"different-etag"' }

      middleware(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!(responseBody)

      // Should NOT return 304
      expect(statusSpy).not.toHaveBeenCalledWith(304)
      // Should set new ETag
      expect(setHeaderSpy).toHaveBeenCalledWith('ETag', expect.stringMatching(/^W\/"[a-f0-9]+"$/))
    })

    it('should use custom maxAge in Cache-Control header', () => {
      const middleware = etagMiddleware(120)
      const responseBody = { data: 'test' }

      middleware(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!(responseBody)

      expect(setHeaderSpy).toHaveBeenCalledWith('Cache-Control', 'private, max-age=120, must-revalidate')
    })

    it('should generate same ETag for same content', () => {
      const middleware = etagMiddleware()
      const responseBody = { data: 'same content' }
      const etags: string[] = []

      // First request
      middleware(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!(responseBody)
      etags.push(setHeaderSpy.mock.calls.find((call: unknown[]) => call[0] === 'ETag')?.[1])

      // Reset and second request
      setHeaderSpy.mockClear()
      mockRes.json = jest.fn().mockReturnThis()
      mockRes.json = mockRes.json.bind(mockRes)

      middleware(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!(responseBody)
      etags.push(setHeaderSpy.mock.calls.find((call: unknown[]) => call[0] === 'ETag')?.[1])

      expect(etags[0]).toBe(etags[1])
    })

    it('should generate different ETag for different content', () => {
      const middleware = etagMiddleware()
      const etags: string[] = []

      // First request
      middleware(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!({ data: 'content 1' })
      etags.push(setHeaderSpy.mock.calls.find((call: unknown[]) => call[0] === 'ETag')?.[1])

      // Reset and second request with different content
      setHeaderSpy.mockClear()
      mockRes.json = jest.fn().mockReturnThis()
      mockRes.json = mockRes.json.bind(mockRes)

      middleware(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!({ data: 'content 2' })
      etags.push(setHeaderSpy.mock.calls.find((call: unknown[]) => call[0] === 'ETag')?.[1])

      expect(etags[0]).not.toBe(etags[1])
    })
  })

  describe('preset middlewares', () => {
    it('shortEtag should use 30 second max-age', () => {
      shortEtag(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!({ data: 'test' })

      expect(setHeaderSpy).toHaveBeenCalledWith('Cache-Control', 'private, max-age=30, must-revalidate')
    })

    it('mediumEtag should use 60 second max-age', () => {
      mediumEtag(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!({ data: 'test' })

      expect(setHeaderSpy).toHaveBeenCalledWith('Cache-Control', 'private, max-age=60, must-revalidate')
    })

    it('longEtag should use 300 second max-age', () => {
      longEtag(mockReq as Request, mockRes as Response, mockNext)
      mockRes.json!({ data: 'test' })

      expect(setHeaderSpy).toHaveBeenCalledWith('Cache-Control', 'private, max-age=300, must-revalidate')
    })
  })
})
