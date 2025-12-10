import { z } from 'zod'

// Cart item from client
const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().max(99),
})

// Shipping address
const shippingAddressSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(2).max(20),
  country: z.string().length(2), // ISO country code
})

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    items: z.array(cartItemSchema).min(1).max(50),
    shippingAddress: shippingAddressSchema,
    guestEmail: z.string().email().optional(), // Required if not authenticated
    locale: z.enum(['en', 'ro', 'fr', 'de', 'es']).optional(),
  }),
})

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid order ID'),
  }),
})

export const getOrderBySessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
})

export const listOrdersSchema = z.object({
  query: z
    .object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      status: z
        .enum([
          'PENDING',
          'PAID',
          'PROCESSING',
          'SHIPPED',
          'DELIVERED',
          'CANCELLED',
          'REFUNDED',
        ])
        .optional(),
    })
    .optional(),
})

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>['body']
export type ShippingAddress = z.infer<typeof shippingAddressSchema>
export type CartItemInput = z.infer<typeof cartItemSchema>
