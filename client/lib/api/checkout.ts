import { api } from './client'
import type {
  Order,
  OrdersResponse,
  CheckoutSessionResponse,
  ShippingAddress,
} from '@/types'

export interface CreateCheckoutParams {
  items: Array<{ productId: number; quantity: number }>
  shippingAddress: ShippingAddress
  guestEmail?: string
  locale?: string
}

export const checkoutApi = {
  createSession: (data: CreateCheckoutParams) =>
    api.post<CheckoutSessionResponse>('/api/checkout/create-session', data),

  getOrderBySession: (sessionId: string) =>
    api.get<Order>(`/api/checkout/session/${sessionId}`),

  getUserOrders: (page = 1, limit = 10) =>
    api.get<OrdersResponse>(`/api/checkout/orders?page=${page}&limit=${limit}`),

  getOrder: (id: number) => api.get<Order>(`/api/checkout/orders/${id}`),
}
