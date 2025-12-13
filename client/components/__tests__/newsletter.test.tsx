import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Newsletter } from '../home/newsletter'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/client'

// Mock newsletter API
const mockSubscribe = vi.fn()
vi.mock('@/lib/api/newsletter', () => ({
  newsletterApi: {
    subscribe: (data: { email: string; locale: string }) => mockSubscribe(data),
  },
}))

// Mock constants
vi.mock('@/lib/constants', () => ({
  TIMING: {
    NEWSLETTER_RESET_MS: 100,
  },
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}))

describe('Newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSubscribe.mockResolvedValue(undefined)
  })

  it('renders newsletter title', () => {
    render(<Newsletter />)
    expect(screen.getByText('newsletter.title')).toBeInTheDocument()
  })

  it('renders newsletter subtitle', () => {
    render(<Newsletter />)
    expect(screen.getByText('newsletter.subtitle')).toBeInTheDocument()
  })

  it('renders email input', () => {
    render(<Newsletter />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('renders subscribe button', () => {
    render(<Newsletter />)
    expect(screen.getByRole('button', { name: /newsletter\.cta/ })).toBeInTheDocument()
  })

  it('renders privacy text', () => {
    render(<Newsletter />)
    expect(screen.getByText('newsletter.privacy')).toBeInTheDocument()
  })

  it('does not submit invalid email', async () => {
    const user = userEvent.setup()
    render(<Newsletter />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'invalid-email')

    const button = screen.getByRole('button', { name: /newsletter\.cta/ })
    await user.click(button)

    // Invalid email should not trigger API call
    expect(mockSubscribe).not.toHaveBeenCalled()
  })

  it('submits valid email', async () => {
    const user = userEvent.setup()
    render(<Newsletter />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test@example.com')

    const button = screen.getByRole('button', { name: /newsletter\.cta/ })
    await user.click(button)

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith({
        email: 'test@example.com',
        locale: 'en',
      })
    })
  })

  it('shows success toast on successful subscription', async () => {
    const user = userEvent.setup()
    render(<Newsletter />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test@example.com')

    const button = screen.getByRole('button', { name: /newsletter\.cta/ })
    await user.click(button)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('newsletter.success')
    })
  })

  it('resets form after successful submission', async () => {
    const user = userEvent.setup()
    render(<Newsletter />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test@example.com')

    const button = screen.getByRole('button', { name: /newsletter\.cta/ })
    await user.click(button)

    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('shows rate limit error', async () => {
    mockSubscribe.mockRejectedValue(new ApiError('Rate limited', 429, 'RATE_LIMIT_EXCEEDED'))
    const user = userEvent.setup()
    render(<Newsletter />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test@example.com')

    const button = screen.getByRole('button', { name: /newsletter\.cta/ })
    await user.click(button)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('newsletter.rateLimited')
    })
  })

  it('shows generic error for other failures', async () => {
    mockSubscribe.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<Newsletter />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test@example.com')

    const button = screen.getByRole('button', { name: /newsletter\.cta/ })
    await user.click(button)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('newsletter.error')
    })
  })

  it('disables button while loading', async () => {
    mockSubscribe.mockImplementation(() => new Promise(() => {})) // Never resolves
    const user = userEvent.setup()
    render(<Newsletter />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test@example.com')

    const button = screen.getByRole('button', { name: /newsletter\.cta/ })
    await user.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })

  it('shows success state after subscription', async () => {
    const user = userEvent.setup()
    render(<Newsletter />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'test@example.com')

    const button = screen.getByRole('button', { name: /newsletter\.cta/ })
    await user.click(button)

    await waitFor(() => {
      expect(screen.getByText('newsletter.subscribed')).toBeInTheDocument()
    })
  })

  describe('email validation', () => {
    it('rejects empty email', async () => {
      const user = userEvent.setup()
      render(<Newsletter />)

      const button = screen.getByRole('button', { name: /newsletter\.cta/ })
      await user.click(button)

      expect(mockSubscribe).not.toHaveBeenCalled()
    })

    it('does not submit email without @', async () => {
      const user = userEvent.setup()
      render(<Newsletter />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'testexample.com')

      const button = screen.getByRole('button', { name: /newsletter\.cta/ })
      await user.click(button)

      // Invalid email should not trigger API call
      expect(mockSubscribe).not.toHaveBeenCalled()
    })

    it('does not submit email without domain', async () => {
      const user = userEvent.setup()
      render(<Newsletter />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'test@')

      const button = screen.getByRole('button', { name: /newsletter\.cta/ })
      await user.click(button)

      // Invalid email should not trigger API call
      expect(mockSubscribe).not.toHaveBeenCalled()
    })

    it('accepts valid email formats', async () => {
      const user = userEvent.setup()
      render(<Newsletter />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'user+tag@subdomain.example.com')

      const button = screen.getByRole('button', { name: /newsletter\.cta/ })
      await user.click(button)

      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled()
      })
    })
  })
})
