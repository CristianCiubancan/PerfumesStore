import { z } from 'zod'
import { PAGINATION } from '../config/constants'

export const listSubscribersSchema = z.object({
  query: z
    .object({
      page: z
        .string()
        .regex(/^\d+$/, 'Page must be a positive integer')
        .refine(
          (val) => !val || parseInt(val, 10) >= 1,
          'Page must be at least 1'
        )
        .optional(),
      limit: z
        .string()
        .regex(/^\d+$/, 'Limit must be a positive integer')
        .refine(
          (val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= PAGINATION.MAX_LIMIT),
          `Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`
        )
        .optional(),
      isActive: z.enum(['true', 'false']).optional(),
    })
    .optional(),
})

export const subscriberIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid subscriber ID format'),
  }),
})

export type ListSubscribersQuery = z.infer<typeof listSubscribersSchema>['query']
