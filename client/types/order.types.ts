/**
 * Order and checkout-related types
 */

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'

export interface OrderItem {
  id: number
  productId: number
  productName: string
  productBrand: string
  productSlug: string
  volumeMl: number
  imageUrl: string | null
  quantity: number
  unitPriceRON: string
  totalPriceRON: string
}

export interface Order {
  id: number
  orderNumber: string
  userId: number | null
  guestEmail: string | null
  customerName: string
  customerPhone: string | null
  shippingAddressLine1: string
  shippingAddressLine2: string | null
  shippingCity: string
  shippingState: string | null
  shippingPostalCode: string
  shippingCountry: string
  subtotalRON: string
  discountRON: string
  discountPercent: number | null
  totalRON: string
  paidAmountEUR: string | null
  exchangeRateUsed: string | null
  status: OrderStatus
  createdAt: string
  paidAt: string | null
  items: OrderItem[]
}

export interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ShippingAddress {
  name: string
  phone?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export interface CheckoutSessionResponse {
  sessionId: string
  url: string
  orderNumber: string
}
