import { z } from 'zod'
import { PAGINATION, VALIDATION } from '../config/constants'

export const createPromotionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    discountPercent: z.number().int().min(VALIDATION.DISCOUNT_MIN_PERCENT).max(VALIDATION.DISCOUNT_MAX_PERCENT, `Discount must be between ${VALIDATION.DISCOUNT_MIN_PERCENT} and ${VALIDATION.DISCOUNT_MAX_PERCENT}`),
    startDate: z.string().datetime({ message: 'Invalid start date format' }),
    endDate: z.string().datetime({ message: 'Invalid end date format' }),
    isActive: z.boolean().optional().default(true),
  }).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  }),
})

export const updatePromotionSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    discountPercent: z.number().int().min(VALIDATION.DISCOUNT_MIN_PERCENT).max(VALIDATION.DISCOUNT_MAX_PERCENT, `Discount must be between ${VALIDATION.DISCOUNT_MIN_PERCENT} and ${VALIDATION.DISCOUNT_MAX_PERCENT}`).optional(),
    startDate: z.string().datetime({ message: 'Invalid start date format' }).optional(),
    endDate: z.string().datetime({ message: 'Invalid end date format' }).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid promotion ID'),
  }),
})

export const getPromotionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid promotion ID'),
  }),
})

export const listPromotionsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a positive integer')
      .refine((val) => !val || parseInt(val, 10) >= 1, 'Page must be at least 1')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a positive integer')
      .refine(
        (val) => !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= PAGINATION.MAX_LIMIT),
        `Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`
      )
      .optional(),
    isActive: z.enum(['true', 'false', '1', '0']).optional(),
  }).optional(),
})

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>['body']
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>['body']
