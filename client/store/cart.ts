'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product, CartItem } from '@/types'
import { calculateCartTotal } from '@/lib/currency'

interface CartState {
  items: CartItem[]

  // Actions
  addItem: (product: Product, quantity?: number) => { success: boolean; message?: string }
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => { success: boolean; message?: string }
  clearCart: () => void
  // FE-004: Validate stock levels against current product data
  validateStock: (products: Product[]) => { updated: number; removed: number }

  // Selectors
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemQuantity: (productId: number) => number
  isInCart: (productId: number) => boolean
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const { items } = get()
        const existingItem = items.find(item => item.productId === product.id)
        const currentQty = existingItem?.quantity || 0
        const newQty = currentQty + quantity

        // Stock validation
        if (product.stock === 0) {
          return { success: false, message: 'OUT_OF_STOCK' }
        }

        if (newQty > product.stock) {
          return { success: false, message: 'STOCK_EXCEEDED' }
        }

        if (existingItem) {
          set({
            items: items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: newQty, stock: product.stock }
                : item
            )
          })
        } else {
          set({
            items: [...items, {
              productId: product.id,
              slug: product.slug,
              quantity,
              name: product.name,
              brand: product.brand,
              priceRON: product.priceRON,
              imageUrl: product.imageUrl,
              volumeMl: product.volumeMl,
              stock: product.stock,
            }]
          })
        }

        return { success: true }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(item => item.productId !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get()
        const item = items.find(i => i.productId === productId)

        if (!item) {
          return { success: false, message: 'ITEM_NOT_FOUND' }
        }

        if (quantity <= 0) {
          get().removeItem(productId)
          return { success: true }
        }

        if (quantity > item.stock) {
          return { success: false, message: 'STOCK_EXCEEDED' }
        }

        set({
          items: items.map(i =>
            i.productId === productId ? { ...i, quantity } : i
          )
        })

        return { success: true }
      },

      clearCart: () => set({ items: [] }),

      // FE-004: Validate cart items against current product stock
      validateStock: (products: Product[]) => {
        const { items } = get()
        let updated = 0
        let removed = 0

        const validatedItems = items.reduce<CartItem[]>((acc, item) => {
          const product = products.find(p => p.id === item.productId)

          if (!product || product.stock === 0) {
            // Product no longer exists or is out of stock
            removed++
            return acc
          }

          if (item.quantity > product.stock) {
            // Reduce quantity to available stock
            updated++
            acc.push({ ...item, quantity: product.stock, stock: product.stock })
          } else if (item.stock !== product.stock) {
            // Update stored stock value
            acc.push({ ...item, stock: product.stock })
          } else {
            acc.push(item)
          }

          return acc
        }, [])

        if (updated > 0 || removed > 0) {
          set({ items: validatedItems })
        }

        return { updated, removed }
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getTotalPrice: () => {
        return calculateCartTotal(get().items)
      },

      getItemQuantity: (productId) => {
        return get().items.find(i => i.productId === productId)?.quantity || 0
      },

      isInCart: (productId) => {
        return get().items.some(i => i.productId === productId)
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
