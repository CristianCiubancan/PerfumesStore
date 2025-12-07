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
