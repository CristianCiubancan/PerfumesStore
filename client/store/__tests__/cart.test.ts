import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCartStore } from '../cart'
import { Product } from '@/types'

// Mock localStorage for persist middleware
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('useCartStore', () => {
  const mockProduct: Product = {
    id: 1,
    slug: 'test-perfume',
    name: 'Test Perfume',
    brand: 'Test Brand',
    concentration: 'Eau_de_Parfum',
    gender: 'Unisex',
    fragranceFamilyId: 1,
    fragranceFamily: { id: 1, name: 'Floral' },
    topNotes: ['Bergamot'],
    heartNotes: ['Rose'],
    baseNotes: ['Sandalwood'],
    volumeMl: 100,
    priceRON: '250.00',
    launchYear: 2020,
    perfumer: null,
    longevityId: 1,
    longevity: { id: 1, name: 'Long', sortOrder: 3 },
    sillageId: 1,
    sillage: { id: 1, name: 'Moderate', sortOrder: 2 },
    seasons: [{ id: 1, name: 'Summer' }],
    occasions: [{ id: 1, name: 'Casual' }],
    rating: '4.5',
    stock: 10,
    imageUrl: null,
    description: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  const mockProduct2: Product = {
    ...mockProduct,
    id: 2,
    name: 'Another Perfume',
    priceRON: '300.00',
    stock: 5,
  }

  beforeEach(() => {
    // Reset store
    useCartStore.setState({ items: [] })
    vi.clearAllMocks()
  })

  describe('addItem', () => {
    it('adds a new item to cart', () => {
      const result = useCartStore.getState().addItem(mockProduct)

      expect(result.success).toBe(true)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].productId).toBe(1)
      expect(useCartStore.getState().items[0].quantity).toBe(1)
    })

    it('adds item with custom quantity', () => {
      const result = useCartStore.getState().addItem(mockProduct, 3)

      expect(result.success).toBe(true)
      expect(useCartStore.getState().items[0].quantity).toBe(3)
    })

    it('increments quantity for existing item', () => {
      useCartStore.getState().addItem(mockProduct, 2)
      const result = useCartStore.getState().addItem(mockProduct, 3)

      expect(result.success).toBe(true)
      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].quantity).toBe(5)
    })

    it('returns error when out of stock', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 }
      const result = useCartStore.getState().addItem(outOfStockProduct)

      expect(result.success).toBe(false)
      expect(result.message).toBe('OUT_OF_STOCK')
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('returns error when exceeding stock', () => {
      const lowStockProduct = { ...mockProduct, stock: 2 }
      useCartStore.getState().addItem(lowStockProduct, 1)
      const result = useCartStore.getState().addItem(lowStockProduct, 3)

      expect(result.success).toBe(false)
      expect(result.message).toBe('STOCK_EXCEEDED')
    })

    it('stores correct item data', () => {
      useCartStore.getState().addItem(mockProduct)

      const item = useCartStore.getState().items[0]
      expect(item.productId).toBe(mockProduct.id)
      expect(item.name).toBe(mockProduct.name)
      expect(item.brand).toBe(mockProduct.brand)
      expect(item.priceRON).toBe(mockProduct.priceRON)
      expect(item.volumeMl).toBe(mockProduct.volumeMl)
      expect(item.stock).toBe(mockProduct.stock)
    })
  })

  describe('removeItem', () => {
    it('removes item from cart', () => {
      useCartStore.getState().addItem(mockProduct)
      useCartStore.getState().addItem(mockProduct2)

      useCartStore.getState().removeItem(1)

      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().items[0].productId).toBe(2)
    })

    it('does nothing when item not found', () => {
      useCartStore.getState().addItem(mockProduct)

      useCartStore.getState().removeItem(999)

      expect(useCartStore.getState().items).toHaveLength(1)
    })
  })

  describe('updateQuantity', () => {
    it('updates item quantity', () => {
      useCartStore.getState().addItem(mockProduct)
      const result = useCartStore.getState().updateQuantity(1, 5)

      expect(result.success).toBe(true)
      expect(useCartStore.getState().items[0].quantity).toBe(5)
    })

    it('removes item when quantity is zero', () => {
      useCartStore.getState().addItem(mockProduct)
      const result = useCartStore.getState().updateQuantity(1, 0)

      expect(result.success).toBe(true)
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('removes item when quantity is negative', () => {
      useCartStore.getState().addItem(mockProduct)
      const result = useCartStore.getState().updateQuantity(1, -1)

      expect(result.success).toBe(true)
      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('returns error when item not found', () => {
      const result = useCartStore.getState().updateQuantity(999, 5)

      expect(result.success).toBe(false)
      expect(result.message).toBe('ITEM_NOT_FOUND')
    })

    it('returns error when exceeding stock', () => {
      useCartStore.getState().addItem(mockProduct)
      const result = useCartStore.getState().updateQuantity(1, 100)

      expect(result.success).toBe(false)
      expect(result.message).toBe('STOCK_EXCEEDED')
    })
  })

  describe('clearCart', () => {
    it('removes all items', () => {
      useCartStore.getState().addItem(mockProduct)
      useCartStore.getState().addItem(mockProduct2)

      useCartStore.getState().clearCart()

      expect(useCartStore.getState().items).toHaveLength(0)
    })

    it('works on empty cart', () => {
      useCartStore.getState().clearCart()

      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('getTotalItems', () => {
    it('returns total quantity of all items', () => {
      useCartStore.getState().addItem(mockProduct, 2)
      useCartStore.getState().addItem(mockProduct2, 3)

      expect(useCartStore.getState().getTotalItems()).toBe(5)
    })

    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getTotalItems()).toBe(0)
    })
  })

  describe('getTotalPrice', () => {
    it('calculates total price', () => {
      useCartStore.getState().addItem(mockProduct, 2) // 2 * 250 = 500
      useCartStore.getState().addItem(mockProduct2, 1) // 1 * 300 = 300

      expect(useCartStore.getState().getTotalPrice()).toBe(800)
    })

    it('returns 0 for empty cart', () => {
      expect(useCartStore.getState().getTotalPrice()).toBe(0)
    })
  })

  describe('getItemQuantity', () => {
    it('returns quantity for existing item', () => {
      useCartStore.getState().addItem(mockProduct, 3)

      expect(useCartStore.getState().getItemQuantity(1)).toBe(3)
    })

    it('returns 0 for non-existing item', () => {
      expect(useCartStore.getState().getItemQuantity(999)).toBe(0)
    })
  })

  describe('isInCart', () => {
    it('returns true for item in cart', () => {
      useCartStore.getState().addItem(mockProduct)

      expect(useCartStore.getState().isInCart(1)).toBe(true)
    })

    it('returns false for item not in cart', () => {
      expect(useCartStore.getState().isInCart(999)).toBe(false)
    })
  })
})
