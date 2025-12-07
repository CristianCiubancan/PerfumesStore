import { Request, Response, NextFunction } from 'express'
import { asyncHandler } from '../asyncHandler'

describe('asyncHandler', () => {
  let req: Request
  let res: Response
  let next: NextFunction

  beforeEach(() => {
    req = {} as Request
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response
    next = jest.fn()
  })

  it('should call the async function', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined)
    const handler = asyncHandler(mockFn)

    await handler(req, res, next)

    expect(mockFn).toHaveBeenCalledWith(req, res, next)
  })

  it('should pass through when async function succeeds', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined)
    const handler = asyncHandler(mockFn)

    await handler(req, res, next)

    expect(next).not.toHaveBeenCalled()
  })

  it('should call next with error when async function throws', async () => {
    const error = new Error('Test error')
    const mockFn = jest.fn().mockRejectedValue(error)
    const handler = asyncHandler(mockFn)

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('should handle sync errors wrapped in promise', async () => {
    const error = new Error('Sync error')
    const mockFn = jest.fn().mockImplementation(() => Promise.reject(error))
    const handler = asyncHandler(mockFn)

    await handler(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('should not call next when function returns a response', async () => {
    const mockFn = jest.fn().mockImplementation(async (_req, res) => {
      res.json({ success: true })
    })
    const handler = asyncHandler(mockFn)

    await handler(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ success: true })
    expect(next).not.toHaveBeenCalled()
  })
})
