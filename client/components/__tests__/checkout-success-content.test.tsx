import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CheckoutSuccessContent } from '../checkout/checkout-success-content'

// Mock the checkout API
const mockGetOrderBySession = vi.fn()
vi.mock('@/lib/api/checkout', () => ({
  checkoutApi: {
    getOrderBySession: (sessionId: string) => mockGetOrderBySession(sessionId),
  },
}))

// Mock cart store
const mockClearCart = vi.fn()
vi.mock('@/store/cart', () => ({
  useCartStore: (selector: (state: { clearCart: () => void }) => unknown) =>
    selector({ clearCart: mockClearCart }),
}))

// Mock auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: false,
    isHydrating: false,
  }),
}))

// Mock currency formatter
vi.mock('@/lib/currency', () => ({
  useFormattedPrice: () => (price: string | number) => `${price} RON`,
}))

// Mock searchParams
const mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation')
  return {
    ...actual,
    useSearchParams: () => mockSearchParams,
  }
})

const mockOrder = {
  id: 1,
  orderNumber: 'ORD-12345',
  status: 'PENDING',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+1234567890',
  guestEmail: 'john@example.com',
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
  items: [
    {
      id: 1,
      orderId: 1,
      productId: 1,
      productBrand: 'Test Brand',
      productName: 'Test Perfume',
      volumeMl: 100,
      quantity: 2,
      unitPriceRON: '50.00',
      totalPriceRON: '100.00',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('CheckoutSuccessContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.delete('session_id')
  })

  afterEach(() => {
    mockSearchParams.delete('session_id')
  })

  it('shows loading state initially', () => {
    mockSearchParams.set('session_id', 'test-session')
    mockGetOrderBySession.mockReturnValue(new Promise(() => {})) // Never resolves

    const { container } = render(<CheckoutSuccessContent />)

    // Should show loading spinner
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows error when no session_id provided', async () => {
    // No session_id in search params
    render(<CheckoutSuccessContent />)

    await waitFor(() => {
      expect(screen.getByText('error.title')).toBeInTheDocument()
    })
  })

  it('shows error when API call fails', async () => {
    mockSearchParams.set('session_id', 'invalid-session')
    mockGetOrderBySession.mockRejectedValue(new Error('Order not found'))

    render(<CheckoutSuccessContent />)

    await waitFor(() => {
      expect(screen.getByText('error.title')).toBeInTheDocument()
      expect(screen.getByText('Order not found')).toBeInTheDocument()
    })
  })

  it('displays order details on success', async () => {
    mockSearchParams.set('session_id', 'valid-session')
    mockGetOrderBySession.mockResolvedValue(mockOrder)

    render(<CheckoutSuccessContent />)

    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })

    // Order number
    expect(screen.getByText(/ORD-12345/)).toBeInTheDocument()

    // Product details
    expect(screen.getByText(/Test Brand/)).toBeInTheDocument()
    expect(screen.getByText(/Test Perfume/)).toBeInTheDocument()

    // Pricing
    expect(screen.getByText('subtotal')).toBeInTheDocument()
    expect(screen.getByText('total')).toBeInTheDocument()
  })

  it('clears cart on successful order load', async () => {
    mockSearchParams.set('session_id', 'valid-session')
    mockGetOrderBySession.mockResolvedValue(mockOrder)

    render(<CheckoutSuccessContent />)

    await waitFor(() => {
      expect(mockClearCart).toHaveBeenCalled()
    })
  })

  it('displays shipping address', async () => {
    mockSearchParams.set('session_id', 'valid-session')
    mockGetOrderBySession.mockResolvedValue(mockOrder)

    render(<CheckoutSuccessContent />)

    await waitFor(() => {
      expect(screen.getByText('shippingAddress')).toBeInTheDocument()
    })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('Apt 4')).toBeInTheDocument()
  })

  it('shows discount information when present', async () => {
    mockSearchParams.set('session_id', 'valid-session')
    mockGetOrderBySession.mockResolvedValue(mockOrder)

    render(<CheckoutSuccessContent />)

    await waitFor(() => {
      // Translation key with interpolation
      expect(screen.getByText(/discount/)).toBeInTheDocument()
    })
  })

  it('shows EUR payment amount when present', async () => {
    mockSearchParams.set('session_id', 'valid-session')
    mockGetOrderBySession.mockResolvedValue(mockOrder)

    render(<CheckoutSuccessContent />)

    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })

    // The paidInEUR translation key with parameter
    expect(screen.getByText(/paidInEUR/)).toBeInTheDocument()
  })

  it('shows email notification for guest orders', async () => {
    mockSearchParams.set('session_id', 'valid-session')
    mockGetOrderBySession.mockResolvedValue(mockOrder)

    render(<CheckoutSuccessContent />)

    await waitFor(() => {
      expect(screen.getByText(/emailSent/)).toBeInTheDocument()
    })
  })

  it('shows continue shopping button', async () => {
    mockSearchParams.set('session_id', 'valid-session')
    mockGetOrderBySession.mockResolvedValue(mockOrder)

    render(<CheckoutSuccessContent />)

    await waitFor(() => {
      expect(screen.getByText('continueShopping')).toBeInTheDocument()
    })

    const link = screen.getByRole('link', { name: /continueShopping/ })
    expect(link).toHaveAttribute('href', '/store')
  })
})

