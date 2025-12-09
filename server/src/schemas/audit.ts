import { z } from 'zod'
import { PAGINATION } from '../config/constants'

const AuditActionEnum = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'BULK_DELETE',
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGE',
])

const AuditEntityTypeEnum = z.enum([
  'PRODUCT',
  'PROMOTION',
  'USER',
  'SETTINGS',
  'FILE',
  'NEWSLETTER_SUBSCRIBER',
])

export const listAuditLogsSchema = z.object({
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
      userId: z.string().regex(/^\d+$/, 'User ID must be a positive integer').optional(),
      action: AuditActionEnum.optional(),
      entityType: AuditEntityTypeEnum.optional(),
      entityId: z.string().regex(/^\d+$/, 'Entity ID must be a positive integer').optional(),
      startDate: z.string().datetime({ message: 'Invalid start date format' }).optional(),
      endDate: z.string().datetime({ message: 'Invalid end date format' }).optional(),
    })
    .optional(),
})

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsSchema>['query']
