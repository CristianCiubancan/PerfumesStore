import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { OrderDetailContent } from '../orders/order-detail-content'

// Mock router
const mockPush = vi.fn()
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation')
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      replace: vi.fn(),
    }),
  }
})

// Mock checkout API
const mockGetOrder = vi.fn()
vi.mock('@/lib/api/checkout', () => ({
  checkoutApi: {
    getOrder: (id: number) => mockGetOrder(id),
  },
}))

// Mock auth store - will be overridden per test
let mockAuthState = {
  isAuthenticated: true,
  isHydrating: false,
}

vi.mock('@/store/auth', () => ({
  useAuthStore: () => mockAuthState,
}))

// Mock currency formatter
vi.mock('@/lib/currency', () => ({
  useFormattedPrice: () => (price: string | number) => `${price} RON`,
}))

const mockOrder = {
  id: 1,
  orderNumber: 'ORD-12345',
  status: 'PAID' as const,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+1234567890',
  shippingAddressLine1: '123 Main St',
  shippingAddressLine2: 'Apt 4',
  shippingCity: 'New York',
  shippingState: 'NY',
  shippingPostalCode: '10001',
  shippingCountry: 'United States',
  subtotalRON: '100.00',
  discountPercent: 10,
  discountRON: '10.00',
  totalRON: '90.00',
  paidAmountEUR: '18.50',
  paidAt: '2024-01-15T12:00:00Z',
  items: [
    {
      id: 1,
      orderId: 1,
      productId: 1,
      productSlug: 'test-perfume',
      productBrand: 'Test Brand',
      productName: 'Test Perfume',
      imageUrl: '/uploads/test.jpg',
      volumeMl: 100,
      quantity: 2,
      unitPriceRON: '50.00',
      totalPriceRON: '100.00',
    },
  ],
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T12:00:00Z',
}

describe('OrderDetailContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      isAuthenticated: true,
      isHydrating: false,
    }
  })

  it('shows loading state when hydrating', () => {
    mockAuthState = {
      isAuthenticated: false,
      isHydrating: true,
    }

    render(<OrderDetailContent orderId={1} />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', async () => {
    mockAuthState = {
      isAuthenticated: false,
      isHydrating: false,
    }

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/login')
    })
  })

  it('shows loading state while fetching order', async () => {
    mockGetOrder.mockReturnValue(new Promise(() => {})) // Never resolves

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  it('shows error state when order not found', async () => {
    mockGetOrder.mockRejectedValue(new Error('Order not found'))

    render(<OrderDetailContent orderId={999} />)

    await waitFor(() => {
      expect(screen.getByText('error.title')).toBeInTheDocument()
    })

    expect(screen.getByText('Order not found')).toBeInTheDocument()
    expect(screen.getByText('backToOrders')).toBeInTheDocument()
  })

  it('displays order details on success', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      // Wait for the order number translation key to appear
      expect(screen.getByText(/orderNumber/)).toBeInTheDocument()
    })
  })

  it('displays order items', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText('orderItems')).toBeInTheDocument()
    })

    expect(screen.getByText(/Test Brand - Test Perfume/)).toBeInTheDocument()
    expect(screen.getByText(/100ml/)).toBeInTheDocument()
  })

  it('displays shipping address', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText('shippingAddress')).toBeInTheDocument()
    })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('Apt 4')).toBeInTheDocument()
    expect(screen.getByText(/New York/)).toBeInTheDocument()
  })

  it('displays payment summary', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText('summary.title')).toBeInTheDocument()
    })

    expect(screen.getByText('summary.subtotal')).toBeInTheDocument()
    expect(screen.getByText('summary.total')).toBeInTheDocument()
    // Multiple elements may have the same price
    expect(screen.getAllByText(/100.00 RON/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/90.00 RON/).length).toBeGreaterThan(0)
  })

  it('displays discount when present', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText(/summary.discount/)).toBeInTheDocument()
    })

    expect(screen.getByText(/-10.00 RON/)).toBeInTheDocument()
  })

  it('displays status badge', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText('status.PAID')).toBeInTheDocument()
    })
  })

  it('displays EUR payment amount when present', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText('summary.title')).toBeInTheDocument()
    })

    // The paidInEUR translation key with parameter
    expect(screen.getByText(/summary.paidInEUR/)).toBeInTheDocument()
  })

  it('displays paid date when present', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText('summary.title')).toBeInTheDocument()
    })

    // Text contains both the translation key and the formatted date
    expect(screen.getByText(/summary.paidAt/)).toBeInTheDocument()
  })

  it('shows back to orders link', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText('backToOrders')).toBeInTheDocument()
    })

    const backLink = screen.getByRole('link', { name: /backToOrders/ })
    expect(backLink).toHaveAttribute('href', '/orders')
  })

  it('links to product pages', async () => {
    mockGetOrder.mockResolvedValue(mockOrder)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText(/Test Brand - Test Perfume/)).toBeInTheDocument()
    })

    const productLink = screen.getByRole('link', { name: /Test Brand - Test Perfume/ })
    expect(productLink).toHaveAttribute('href', '/product/test-perfume')
  })

  it('handles order without discount', async () => {
    const orderWithoutDiscount = {
      ...mockOrder,
      discountPercent: null,
      discountRON: '0.00',
    }
    mockGetOrder.mockResolvedValue(orderWithoutDiscount)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText('summary.title')).toBeInTheDocument()
    })

    // Discount should not be shown
    expect(screen.queryByText(/summary.discount/)).not.toBeInTheDocument()
  })

  it('handles order without secondary address line', async () => {
    const orderWithoutLine2 = {
      ...mockOrder,
      shippingAddressLine2: null,
    }
    mockGetOrder.mockResolvedValue(orderWithoutLine2)

    render(<OrderDetailContent orderId={1} />)

    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument()
    })

    expect(screen.queryByText('Apt 4')).not.toBeInTheDocument()
  })
})
