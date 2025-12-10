import { z } from 'zod'
import { PAGINATION } from '../config/constants'

const OrderStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
])

export const listOrdersSchema = z.object({
  query: z
    .object({
      page: z
        .string()
        .regex(/^\d+$/, 'Page must be a positive integer')
        .refine((val) => !val || parseInt(val, 10) >= 1, 'Page must be at least 1')
        .optional(),
      limit: z
        .string()
        .regex(/^\d+$/, 'Limit must be a positive integer')
        .refine(
          (val) =>
            !val || (parseInt(val, 10) >= 1 && parseInt(val, 10) <= PAGINATION.MAX_LIMIT),
          `Limit must be between 1 and ${PAGINATION.MAX_LIMIT}`
        )
        .optional(),
      status: z
        .string()
        .refine(
          (val) => val === 'all' || OrderStatusEnum.safeParse(val).success,
          'Invalid order status'
        )
        .optional(),
      search: z.string().max(100, 'Search query too long').optional(),
      sortBy: z.enum(['createdAt', 'totalRON', 'status']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
    })
    .optional(),
})

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Order ID must be a positive integer'),
  }),
})

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Order ID must be a positive integer'),
  }),
  body: z.object({
    status: OrderStatusEnum,
  }),
})

export type ListOrdersQuery = z.infer<typeof listOrdersSchema>['query']
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>['body']
