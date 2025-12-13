import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CartSummary } from '../cart/cart-summary'

// Mock currency formatter
vi.mock('@/lib/currency', () => ({
  useFormattedPrice: () => (price: string | number) => `${price} RON`,
}))

describe('CartSummary', () => {
  const defaultProps = {
    totalItems: 3,
    totalPrice: 250.0,
    onClearCart: vi.fn(),
    discountPercent: null as number | null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the summary title', () => {
    render(<CartSummary {...defaultProps} />)
    expect(screen.getByText('summary.title')).toBeInTheDocument()
  })

  it('displays the correct number of items', () => {
    render(<CartSummary {...defaultProps} />)
    // Translation key with interpolation
    expect(screen.getByText(/summary\.items/)).toBeInTheDocument()
  })

  it('displays subtotal price', () => {
    render(<CartSummary {...defaultProps} />)
    expect(screen.getByText('summary.subtotal')).toBeInTheDocument()
    expect(screen.getByText('250 RON')).toBeInTheDocument()
  })

  it('displays total price', () => {
    render(<CartSummary {...defaultProps} />)
    expect(screen.getByText('summary.total')).toBeInTheDocument()
    expect(screen.getByText('250.00 RON')).toBeInTheDocument()
  })

  it('shows checkout button', () => {
    render(<CartSummary {...defaultProps} />)
    expect(screen.getByText('summary.checkout')).toBeInTheDocument()
    const checkoutLink = screen.getByRole('link', { name: /summary\.checkout/i })
    expect(checkoutLink).toHaveAttribute('href', '/checkout')
  })

  it('shows clear cart button', () => {
    render(<CartSummary {...defaultProps} />)
    expect(screen.getByText('summary.clearCart')).toBeInTheDocument()
  })

  it('opens confirmation dialog when clear cart is clicked', () => {
    render(<CartSummary {...defaultProps} />)
    const clearButton = screen.getByText('summary.clearCart')
    fireEvent.click(clearButton)

    expect(screen.getByText('confirmClear.title')).toBeInTheDocument()
    expect(screen.getByText('confirmClear.description')).toBeInTheDocument()
  })

  it('calls onClearCart when confirmation is clicked', async () => {
    render(<CartSummary {...defaultProps} />)

    // Open dialog
    const clearButton = screen.getByText('summary.clearCart')
    fireEvent.click(clearButton)

    // Confirm
    const confirmButton = screen.getByText('confirmClear.confirm')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(defaultProps.onClearCart).toHaveBeenCalledTimes(1)
    })
  })

  it('closes dialog when cancel is clicked', async () => {
    render(<CartSummary {...defaultProps} />)

    // Open dialog
    const clearButton = screen.getByText('summary.clearCart')
    fireEvent.click(clearButton)

    // Cancel
    const cancelButton = screen.getByText('confirmClear.cancel')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText('confirmClear.title')).not.toBeInTheDocument()
    })

    expect(defaultProps.onClearCart).not.toHaveBeenCalled()
  })

  describe('with discount', () => {
    const propsWithDiscount = {
      ...defaultProps,
      discountPercent: 20,
    }

    it('displays discount percentage', () => {
      render(<CartSummary {...propsWithDiscount} />)
      // Translation key with interpolation
      expect(screen.getByText(/summary\.discount/)).toBeInTheDocument()
    })

    it('shows strikethrough on original price', () => {
      render(<CartSummary {...propsWithDiscount} />)
      const subtotalElement = screen.getByText('250 RON')
      expect(subtotalElement).toHaveClass('line-through')
    })

    it('displays calculated discount amount', () => {
      render(<CartSummary {...propsWithDiscount} />)
      // 20% of 250 = 50
      expect(screen.getByText('-50.00 RON')).toBeInTheDocument()
    })

    it('displays final discounted price', () => {
      render(<CartSummary {...propsWithDiscount} />)
      // 250 - 50 = 200
      expect(screen.getByText('200.00 RON')).toBeInTheDocument()
    })

    it('shows savings message', () => {
      render(<CartSummary {...propsWithDiscount} />)
      expect(screen.getByText(/summary\.youSave/)).toBeInTheDocument()
    })
  })

  describe('with zero items', () => {
    const emptyCartProps = {
      ...defaultProps,
      totalItems: 0,
      totalPrice: 0,
    }

    it('renders with zero items', () => {
      render(<CartSummary {...emptyCartProps} />)
      expect(screen.getByText(/summary\.items/)).toBeInTheDocument()
    })

    it('shows zero total', () => {
      render(<CartSummary {...emptyCartProps} />)
      expect(screen.getByText('0.00 RON')).toBeInTheDocument()
    })
  })

  describe('with single item', () => {
    const singleItemProps = {
      ...defaultProps,
      totalItems: 1,
      totalPrice: 99.99,
    }

    it('renders correctly with single item', () => {
      render(<CartSummary {...singleItemProps} />)
      expect(screen.getByText(/summary\.items/)).toBeInTheDocument()
      // Total is formatted with .toFixed(2)
      const priceElements = screen.getAllByText('99.99 RON')
      expect(priceElements.length).toBeGreaterThan(0)
    })
  })
})
