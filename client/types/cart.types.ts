/**
 * Cart-related types
 */

export interface CartItem {
  productId: number
  slug: string
  quantity: number
  name: string
  brand: string
  priceRON: string
  imageUrl: string | null
  volumeMl: number
  stock: number
}
