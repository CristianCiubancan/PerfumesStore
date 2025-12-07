import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: 'Not Found',
      code: 'NOT_FOUND',
    },
  })
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, 'ErrorHandler', err)
    }
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    })
  }

  logger.error('Unhandled error', 'ErrorHandler', err)

  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    },
  })
}
