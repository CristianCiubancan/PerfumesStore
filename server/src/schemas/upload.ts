import { z } from 'zod'

/**
 * Validation schema for filename parameter in upload routes
 * - Prevents path traversal attacks (no ../ or ..\)
 * - Only allows alphanumeric, dash, underscore, and dot
 * - Enforces maximum length for security
 */
export const deleteImageSchema = z.object({
  params: z.object({
    filename: z
      .string()
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid filename format')
      .max(255, 'Filename too long')
      .refine(
        (filename) => !filename.includes('..'),
        'Path traversal not allowed'
      ),
  }),
})

export type DeleteImageParams = z.infer<typeof deleteImageSchema>['params']
