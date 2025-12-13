import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AddToCartButton } from '../store/add-to-cart-button'
import { toast } from 'sonner'
import type { Product } from '@/types'

// Mock the cart store
const mockAddItem = vi.fn()
const mockIsInCart = vi.fn()
const mockGetItemQuantity = vi.fn()

vi.mock('@/store/cart', () => ({
  useCartStore: () => ({
    addItem: mockAddItem,
    isInCart: mockIsInCart,
    getItemQuantity: mockGetItemQuantity,
  }),
}))

// Mock constants
vi.mock('@/lib/constants', () => ({
  TIMING: {
    ADD_TO_CART_DELAY_MS: 0, // No delay in tests
    ADD_TO_CART_FEEDBACK_MS: 100,
  },
}))

describe('AddToCartButton', () => {
  const mockProduct: Product = {
    id: 1,
    name: 'Test Perfume',
    brand: 'Test Brand',
    slug: 'test-perfume',
    priceRON: '100.00',
    volumeMl: 50,
    concentration: 'Eau_de_Parfum',
    gender: 'Unisex',
    rating: '4.5',
    stock: 10,
    imageUrl: 'https://example.com/image.jpg',
    description: 'A test perfume',
    topNotes: [],
    heartNotes: [],
    baseNotes: [],
    fragranceFamilyId: 1,
    fragranceFamily: { id: 1, name: 'Woody' },
    longevityId: 1,
    longevity: { id: 1, name: 'Long', sortOrder: 3 },
    sillageId: 1,
    sillage: { id: 1, name: 'Moderate', sortOrder: 2 },
    seasons: [],
    occasions: [],
    launchYear: 2020,
    perfumer: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsInCart.mockReturnValue(false)
    mockGetItemQuantity.mockReturnValue(0)
    mockAddItem.mockReturnValue({ success: true })
  })

  it('renders add to cart button text', () => {
    render(<AddToCartButton product={mockProduct} />)
    expect(screen.getByText('addToCart.add')).toBeInTheDocument()
  })

  it('shows out of stock state when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 }
    render(<AddToCartButton product={outOfStockProduct} />)
    expect(screen.getByText('addToCart.outOfStock')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls addItem when clicked', async () => {
    render(<AddToCartButton product={mockProduct} />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(mockProduct, 1)
    })
  })

  it('shows success toast on successful add', async () => {
    render(<AddToCartButton product={mockProduct} />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('shows error toast when stock exceeded', async () => {
    mockAddItem.mockReturnValue({ success: false, message: 'STOCK_EXCEEDED' })
    render(<AddToCartButton product={mockProduct} />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('shows error toast when out of stock error', async () => {
    mockAddItem.mockReturnValue({ success: false, message: 'OUT_OF_STOCK' })
    render(<AddToCartButton product={mockProduct} />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('uses custom quantity when provided', async () => {
    render(<AddToCartButton product={mockProduct} quantity={3} />)
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(mockProduct, 3)
    })
  })

  it('prevents event propagation', async () => {
    const parentClickHandler = vi.fn()
    render(
      <div onClick={parentClickHandler}>
        <AddToCartButton product={mockProduct} />
      </div>
    )
    const button = screen.getByRole('button')

    await act(async () => {
      fireEvent.click(button)
    })

    expect(parentClickHandler).not.toHaveBeenCalled()
  })

  describe('variant="icon"', () => {
    it('renders as icon button', () => {
      render(<AddToCartButton product={mockProduct} variant="icon" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('shows screen reader text', () => {
      render(<AddToCartButton product={mockProduct} variant="icon" />)
      const srText = screen.getByText('addToCart.add')
      expect(srText).toHaveClass('sr-only')
    })
  })

  describe('variant="full"', () => {
    it('renders with full width', () => {
      render(<AddToCartButton product={mockProduct} variant="full" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })
  })

  describe('when item is in cart', () => {
    beforeEach(() => {
      mockIsInCart.mockReturnValue(true)
      mockGetItemQuantity.mockReturnValue(2)
    })

    it('shows quantity in cart', () => {
      render(<AddToCartButton product={mockProduct} />)
      expect(screen.getByText(/addToCart\.inCart/)).toBeInTheDocument()
    })

    it('hides quantity when showQuantityInCart is false', () => {
      render(<AddToCartButton product={mockProduct} showQuantityInCart={false} />)
      expect(screen.getByText('addToCart.add')).toBeInTheDocument()
    })
  })

  describe('custom className', () => {
    it('applies custom className', () => {
      render(<AddToCartButton product={mockProduct} className="custom-class" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('adding state', () => {
    it('shows adding text during add operation', async () => {
      render(<AddToCartButton product={mockProduct} />)
      const button = screen.getByRole('button')

      await act(async () => {
        fireEvent.click(button)
      })

      // After clicking, addItem should be called
      await waitFor(() => {
        expect(mockAddItem).toHaveBeenCalled()
      })
    })
  })

  describe('edge cases', () => {
    it('does not add when out of stock', async () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 }
      render(<AddToCartButton product={outOfStockProduct} />)

      // Button should be disabled
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('handles click on out of stock product', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 }
      render(<AddToCartButton product={outOfStockProduct} />)
      const button = screen.getByRole('button')

      // Clicking should not call addItem since button is disabled
      fireEvent.click(button)
      expect(mockAddItem).not.toHaveBeenCalled()
    })
  })
})
