import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CartItemRow } from '../cart/cart-item-row'
import type { CartItem } from '@/types'

// Mock currency functions
vi.mock('@/lib/currency', () => ({
  useFormattedPrice: () => (price: string | number) => `${price} RON`,
  calculateLineTotal: (price: string, quantity: number) => parseFloat(price) * quantity,
}))

// Mock upload helper
vi.mock('@/lib/api/upload', () => ({
  getFullImageUrl: (url: string) => url,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

describe('CartItemRow', () => {
  const mockItem: CartItem = {
    productId: 1,
    name: 'Test Perfume',
    brand: 'Test Brand',
    slug: 'test-perfume',
    priceRON: '100.00',
    volumeMl: 50,
    quantity: 2,
    stock: 10,
    imageUrl: 'https://example.com/image.jpg',
  }

  const defaultProps = {
    item: mockItem,
    onRemove: vi.fn(),
    onQuantityChange: vi.fn(),
    discountPercent: null as number | null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product image', () => {
    render(<CartItemRow {...defaultProps} />)
    const img = screen.getByAltText('Test Perfume')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('renders product brand', () => {
    render(<CartItemRow {...defaultProps} />)
    expect(screen.getByText('Test Brand')).toBeInTheDocument()
  })

  it('renders product name', () => {
    render(<CartItemRow {...defaultProps} />)
    expect(screen.getByText('Test Perfume')).toBeInTheDocument()
  })

  it('renders volume', () => {
    render(<CartItemRow {...defaultProps} />)
    expect(screen.getByText('50ml')).toBeInTheDocument()
  })

  it('renders product link', () => {
    render(<CartItemRow {...defaultProps} />)
    const links = screen.getAllByRole('link')
    expect(links.some(link => link.getAttribute('href')?.includes('/product/test-perfume'))).toBe(true)
  })

  it('renders line total price', () => {
    render(<CartItemRow {...defaultProps} />)
    // 100 * 2 = 200
    expect(screen.getByText('200 RON')).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', () => {
    render(<CartItemRow {...defaultProps} />)
    // Find the remove button by its sr-only text
    const removeButton = screen.getByRole('button', { name: /item\.remove/i })
    fireEvent.click(removeButton)
    expect(defaultProps.onRemove).toHaveBeenCalledWith(1)
  })

  it('renders quantity selector with correct value', () => {
    render(<CartItemRow {...defaultProps} />)
    // Quantity is shown in the input field
    const quantityInput = screen.getByRole('spinbutton')
    expect(quantityInput).toHaveValue(2)
  })

  it('renders placeholder when no image', () => {
    const propsWithoutImage = {
      ...defaultProps,
      item: { ...mockItem, imageUrl: null },
    }
    render(<CartItemRow {...propsWithoutImage} />)
    expect(screen.getByText('🧴')).toBeInTheDocument()
  })

  describe('with discount', () => {
    const propsWithDiscount = {
      ...defaultProps,
      discountPercent: 15,
    }

    it('shows original price with strikethrough', () => {
      render(<CartItemRow {...propsWithDiscount} />)
      const originalPrice = screen.getByText('200 RON')
      expect(originalPrice).toHaveClass('line-through')
    })

    it('shows discounted price', () => {
      render(<CartItemRow {...propsWithDiscount} />)
      // 200 - 15% = 170
      expect(screen.getByText('170.00 RON')).toBeInTheDocument()
    })

    it('shows tag icon with discounted price', () => {
      const { container } = render(<CartItemRow {...propsWithDiscount} />)
      // Tag icon should be present
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('quantity selector interaction', () => {
    it('calls onQuantityChange when quantity is increased', () => {
      render(<CartItemRow {...defaultProps} />)
      const incrementButton = screen.getByRole('button', { name: /increaseQuantity/i })
      fireEvent.click(incrementButton)
      expect(defaultProps.onQuantityChange).toHaveBeenCalledWith(1, 3)
    })

    it('calls onQuantityChange when quantity is decreased', () => {
      render(<CartItemRow {...defaultProps} />)
      const decrementButton = screen.getByRole('button', { name: /decreaseQuantity/i })
      fireEvent.click(decrementButton)
      expect(defaultProps.onQuantityChange).toHaveBeenCalledWith(1, 1)
    })
  })

  describe('edge cases', () => {
    it('handles item with quantity of 1', () => {
      const singleQuantityProps = {
        ...defaultProps,
        item: { ...mockItem, quantity: 1 },
      }
      render(<CartItemRow {...singleQuantityProps} />)
      expect(screen.getByText('100 RON')).toBeInTheDocument()
    })

    it('handles item with low stock', () => {
      const lowStockProps = {
        ...defaultProps,
        item: { ...mockItem, stock: 2, quantity: 2 },
      }
      render(<CartItemRow {...lowStockProps} />)
      expect(screen.getByText('200 RON')).toBeInTheDocument()
    })

    it('handles item with large quantity', () => {
      const largeQuantityProps = {
        ...defaultProps,
        item: { ...mockItem, quantity: 99 },
      }
      render(<CartItemRow {...largeQuantityProps} />)
      // 100 * 99 = 9900
      expect(screen.getByText('9900 RON')).toBeInTheDocument()
    })
  })
})
