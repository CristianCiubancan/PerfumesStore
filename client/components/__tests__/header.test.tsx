import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../layout/header'

// Mock auth store
const mockClearAuth = vi.fn()
const mockIsAuthenticated = vi.fn()
const mockUser = vi.fn()

vi.mock('@/store/auth', () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      isAuthenticated: mockIsAuthenticated(),
      user: mockUser(),
      clearAuth: mockClearAuth,
    }),
}))

// Mock auth API
const mockLogout = vi.fn()
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    logout: () => mockLogout(),
  },
}))

// Mock components
vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}))

vi.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <button data-testid="language-switcher">Lang</button>,
}))

vi.mock('@/components/currency-switcher', () => ({
  CurrencySwitcher: () => <button data-testid="currency-switcher">Currency</button>,
}))

vi.mock('@/components/layout/cart-badge', () => ({
  CartBadge: () => <button data-testid="cart-badge">Cart</button>,
}))

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogout.mockResolvedValue(undefined)
    mockIsAuthenticated.mockReturnValue(false)
    mockUser.mockReturnValue(null)
  })

  it('renders logo', () => {
    render(<Header />)
    const logo = screen.getByAltText('Perfumes Store')
    expect(logo).toBeInTheDocument()
  })

  it('renders home link', () => {
    render(<Header />)
    const homeLink = screen.getByLabelText('Perfumes Store Home')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('renders currency switcher', () => {
    render(<Header />)
    expect(screen.getByTestId('currency-switcher')).toBeInTheDocument()
  })

  it('renders language switcher', () => {
    render(<Header />)
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument()
  })

  it('renders theme toggle', () => {
    render(<Header />)
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('renders cart badge', () => {
    render(<Header />)
    expect(screen.getByTestId('cart-badge')).toBeInTheDocument()
  })

  it('renders menu button', () => {
    render(<Header />)
    const menuButton = screen.getByRole('button', { name: /openMenu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('opens menu when menu button is clicked', () => {
    render(<Header />)
    const menuButton = screen.getByRole('button', { name: /openMenu/i })
    fireEvent.click(menuButton)

    expect(screen.getByText('menu')).toBeInTheDocument()
  })

  it('shows home navigation item in menu', () => {
    render(<Header />)
    const menuButton = screen.getByRole('button', { name: /openMenu/i })
    fireEvent.click(menuButton)

    expect(screen.getByText('home')).toBeInTheDocument()
  })

  it('shows store navigation item in menu', () => {
    render(<Header />)
    const menuButton = screen.getByRole('button', { name: /openMenu/i })
    fireEvent.click(menuButton)

    expect(screen.getByText('store')).toBeInTheDocument()
  })

  it('shows cart navigation item in menu', () => {
    render(<Header />)
    const menuButton = screen.getByRole('button', { name: /openMenu/i })
    fireEvent.click(menuButton)

    expect(screen.getByText('cart')).toBeInTheDocument()
  })

  describe('unauthenticated user', () => {
    it('shows sign in option', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /openMenu/i })
      fireEvent.click(menuButton)

      expect(screen.getByText('signIn')).toBeInTheDocument()
    })

    it('shows create account option', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /openMenu/i })
      fireEvent.click(menuButton)

      expect(screen.getByText('createAccount')).toBeInTheDocument()
    })

    it('does not show sign out option', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /openMenu/i })
      fireEvent.click(menuButton)

      expect(screen.queryByText('signOut')).not.toBeInTheDocument()
    })
  })

  describe('authenticated user', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue(true)
      mockUser.mockReturnValue({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      })
    })

    it('shows user name', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /openMenu/i })
      fireEvent.click(menuButton)

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('shows user email', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /openMenu/i })
      fireEvent.click(menuButton)

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('shows my orders option', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /openMenu/i })
      fireEvent.click(menuButton)

      expect(screen.getByText('myOrders')).toBeInTheDocument()
    })

    it('shows sign out option', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /openMenu/i })
      fireEvent.click(menuButton)

      expect(screen.getByText('signOut')).toBeInTheDocument()
    })

    it('does not show sign in option', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /openMenu/i })
      fireEvent.click(menuButton)

      expect(screen.queryByText('signIn')).not.toBeInTheDocument()
    })
  })

  describe('admin user', () => {
    beforeEach(() => {
      mockIsAuthenticated.mockReturnValue(true)
      mockUser.mockReturnValue({
        id: 1,
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN',
      })
    })

    it('shows admin dashboard option', () => {
      render(<Header />)
      const menuButton = screen.getByRole('button', { name: /openMenu/i })
      fireEvent.click(menuButton)

      expect(screen.getByText('adminDashboard')).toBeInTheDocument()
    })
  })
})
