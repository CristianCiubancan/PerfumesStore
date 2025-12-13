import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrdersPageContent } from '../orders/orders-page-content'

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
const mockGetUserOrders = vi.fn()
vi.mock('@/lib/api/checkout', () => ({
  checkoutApi: {
    getUserOrders: (page: number, limit: number) => mockGetUserOrders(page, limit),
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

const mockOrders = [
  {
    id: 1,
    orderNumber: 'ORD-001',
    status: 'PENDING' as const,
    customerName: 'John Doe',
    totalRON: '150.00',
    items: [
      { id: 1, productName: 'Perfume 1', quantity: 1 },
    ],
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    orderNumber: 'ORD-002',
    status: 'DELIVERED' as const,
    customerName: 'John Doe',
    totalRON: '250.00',
    items: [
      { id: 2, productName: 'Perfume 2', quantity: 2 },
    ],
    createdAt: '2024-01-10T14:00:00Z',
  },
]

describe('OrdersPageContent', () => {
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

    render(<OrdersPageContent />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated', async () => {
    mockAuthState = {
      isAuthenticated: false,
      isHydrating: false,
    }

    render(<OrdersPageContent />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/en/login')
    })
  })

  it('returns null when not authenticated after redirect', () => {
    mockAuthState = {
      isAuthenticated: false,
      isHydrating: false,
    }

    const { container } = render(<OrdersPageContent />)

    // Component should return null
    expect(container.firstChild).toBeNull()
  })

  it('shows loading state while fetching orders', async () => {
    mockGetUserOrders.mockReturnValue(new Promise(() => {})) // Never resolves

    render(<OrdersPageContent />)

    // Title should appear
    expect(screen.getByText('title')).toBeInTheDocument()

    // Loading spinner should be present
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  it('displays empty state when no orders', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: [],
      pagination: { totalPages: 1, page: 1, limit: 10, total: 0 },
    })

    render(<OrdersPageContent />)

    await waitFor(() => {
      expect(screen.getByText('empty.title')).toBeInTheDocument()
    })

    expect(screen.getByText('empty.description')).toBeInTheDocument()
    expect(screen.getByText('empty.startShopping')).toBeInTheDocument()
  })

  it('displays orders when present', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: mockOrders,
      pagination: { totalPages: 1, page: 1, limit: 10, total: 2 },
    })

    render(<OrdersPageContent />)

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument()
    })

    expect(screen.getByText('ORD-002')).toBeInTheDocument()
    expect(screen.getByText('150.00 RON')).toBeInTheDocument()
    expect(screen.getByText('250.00 RON')).toBeInTheDocument()
  })

  it('displays order status badges', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: mockOrders,
      pagination: { totalPages: 1, page: 1, limit: 10, total: 2 },
    })

    render(<OrdersPageContent />)

    await waitFor(() => {
      expect(screen.getByText('status.PENDING')).toBeInTheDocument()
      expect(screen.getByText('status.DELIVERED')).toBeInTheDocument()
    })
  })

  it('shows pagination when multiple pages', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: mockOrders,
      pagination: { totalPages: 3, page: 1, limit: 10, total: 25 },
    })

    render(<OrdersPageContent />)

    await waitFor(() => {
      expect(screen.getByText('pagination.previous')).toBeInTheDocument()
      expect(screen.getByText('pagination.next')).toBeInTheDocument()
    })
  })

  it('disables previous button on first page', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: mockOrders,
      pagination: { totalPages: 3, page: 1, limit: 10, total: 25 },
    })

    render(<OrdersPageContent />)

    await waitFor(() => {
      const prevButton = screen.getByText('pagination.previous')
      expect(prevButton).toBeDisabled()
    })
  })

  it('navigates to next page on click', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: mockOrders,
      pagination: { totalPages: 3, page: 1, limit: 10, total: 25 },
    })

    render(<OrdersPageContent />)

    await waitFor(() => {
      expect(screen.getByText('pagination.next')).toBeEnabled()
    })

    await userEvent.click(screen.getByText('pagination.next'))

    // Should call API with page 2
    await waitFor(() => {
      expect(mockGetUserOrders).toHaveBeenCalledWith(2, 10)
    })
  })

  it('hides pagination when only one page', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: mockOrders,
      pagination: { totalPages: 1, page: 1, limit: 10, total: 2 },
    })

    render(<OrdersPageContent />)

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument()
    })

    expect(screen.queryByText('pagination.previous')).not.toBeInTheDocument()
  })

  it('links to order details', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: mockOrders,
      pagination: { totalPages: 1, page: 1, limit: 10, total: 2 },
    })

    render(<OrdersPageContent />)

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument()
    })

    // Check that links exist
    const links = screen.getAllByRole('link')
    const orderLinks = links.filter(link => link.getAttribute('href')?.includes('/orders/'))
    expect(orderLinks.length).toBeGreaterThan(0)
  })
})
