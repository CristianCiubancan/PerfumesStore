import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CartBadge } from '../layout/cart-badge'

// Mock the cart store with useSyncExternalStore pattern
const mockGetTotalItems = vi.fn()

vi.mock('@/store/cart', () => ({
  useCartStore: Object.assign(
    () => ({ getTotalItems: mockGetTotalItems }),
    {
      subscribe: () => () => {},
      getState: () => ({
        getTotalItems: mockGetTotalItems,
      }),
    }
  ),
}))

// Mock constants
vi.mock('@/lib/constants', () => ({
  TIMING: {
    BADGE_ANIMATION_MS: 100,
  },
}))

describe('CartBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetTotalItems.mockReturnValue(0)
  })

  it('renders cart link', () => {
    render(<CartBadge />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/cart')
  })

  it('renders shopping cart icon button', () => {
    render(<CartBadge />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('renders screen reader text', () => {
    render(<CartBadge />)
    expect(screen.getByText('cart')).toBeInTheDocument()
  })

  it('does not show count badge when cart is empty', () => {
    mockGetTotalItems.mockReturnValue(0)
    render(<CartBadge />)
    // No count badge should be visible
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows count badge when cart has items', () => {
    mockGetTotalItems.mockReturnValue(5)
    render(<CartBadge />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows 99+ when cart has more than 99 items', () => {
    mockGetTotalItems.mockReturnValue(150)
    render(<CartBadge />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('shows exact count for 99 items', () => {
    mockGetTotalItems.mockReturnValue(99)
    render(<CartBadge />)
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('shows 99+ for 100 items', () => {
    mockGetTotalItems.mockReturnValue(100)
    render(<CartBadge />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('shows count badge for single item', () => {
    mockGetTotalItems.mockReturnValue(1)
    render(<CartBadge />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  describe('badge styling', () => {
    it('badge has correct positioning classes', () => {
      mockGetTotalItems.mockReturnValue(5)
      render(<CartBadge />)

      const badge = screen.getByText('5')
      expect(badge).toHaveClass('absolute')
      expect(badge).toHaveClass('-top-1')
      expect(badge).toHaveClass('-right-1')
    })

    it('badge has rounded styling', () => {
      mockGetTotalItems.mockReturnValue(5)
      render(<CartBadge />)

      const badge = screen.getByText('5')
      expect(badge).toHaveClass('rounded-full')
    })
  })

  describe('edge cases', () => {
    it('handles large count gracefully', () => {
      mockGetTotalItems.mockReturnValue(999999)
      render(<CartBadge />)
      // Should still show 99+
      expect(screen.getByText('99+')).toBeInTheDocument()
    })
  })
})
