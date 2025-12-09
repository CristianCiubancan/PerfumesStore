import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError, ZodIssue } from 'zod'
import { AppError } from './errorHandler'

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        const messages = err.issues.map((issue: ZodIssue) => issue.message).join(', ')
        return next(new AppError(messages, 400, 'VALIDATION_ERROR'))
      }
      return next(err)
    }
  }
}
