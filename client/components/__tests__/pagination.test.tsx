import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from '../store/pagination'

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: vi.fn(),
  }

  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders pagination controls', () => {
    render(<Pagination {...defaultProps} />)

    // Mock returns translation keys - 'pagination' for nav label
    expect(screen.getByLabelText('pagination')).toBeInTheDocument()
    expect(screen.getByLabelText('previous')).toBeInTheDocument()
    expect(screen.getByLabelText('next')).toBeInTheDocument()
  })

  it('renders page numbers', () => {
    render(<Pagination {...defaultProps} />)

    // Page buttons have aria-label from translation mock and display number as text
    const pageButtons = screen.getAllByRole('button').filter(btn =>
      !btn.getAttribute('aria-label')?.match(/^(previous|next)$/)
    )
    expect(pageButtons).toHaveLength(5)
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
  })

  it('marks current page with aria-current', () => {
    render(<Pagination {...defaultProps} currentPage={3} />)

    // Find the button displaying "3" (the current page)
    const currentPageButton = screen.getByText('3').closest('button')!
    expect(currentPageButton).toHaveAttribute('aria-current', 'page')

    // Find the button displaying "1" (not the current page)
    const otherPageButton = screen.getByText('1').closest('button')!
    expect(otherPageButton).not.toHaveAttribute('aria-current')
  })

  describe('previous button', () => {
    it('is disabled on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />)

      expect(screen.getByLabelText('previous')).toBeDisabled()
    })

    it('is enabled on subsequent pages', () => {
      render(<Pagination {...defaultProps} currentPage={2} />)

      expect(screen.getByLabelText('previous')).not.toBeDisabled()
    })

    it('calls onPageChange with previous page', async () => {
      const onPageChange = vi.fn()
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />)

      await userEvent.click(screen.getByLabelText('previous'))

      expect(onPageChange).toHaveBeenCalledWith(2)
    })
  })

  describe('next button', () => {
    it('is disabled on last page', () => {
      render(<Pagination {...defaultProps} currentPage={5} />)

      expect(screen.getByLabelText('next')).toBeDisabled()
    })

    it('is enabled on previous pages', () => {
      render(<Pagination {...defaultProps} currentPage={4} />)

      expect(screen.getByLabelText('next')).not.toBeDisabled()
    })

    it('calls onPageChange with next page', async () => {
      const onPageChange = vi.fn()
      render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />)

      await userEvent.click(screen.getByLabelText('next'))

      expect(onPageChange).toHaveBeenCalledWith(3)
    })
  })

  describe('page buttons', () => {
    it('calls onPageChange when clicked', async () => {
      const onPageChange = vi.fn()
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />)

      // Click the button displaying "3"
      await userEvent.click(screen.getByText('3').closest('button')!)

      expect(onPageChange).toHaveBeenCalledWith(3)
    })
  })

  describe('ellipsis behavior', () => {
    it('shows ellipsis for many pages when on first page', () => {
      render(<Pagination currentPage={1} totalPages={10} onPageChange={vi.fn()} />)

      // Should show: 1 2 3 ... 10
      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByText('1').closest('button')).toBeInTheDocument()
      expect(screen.getByText('10').closest('button')).toBeInTheDocument()
    })

    it('shows ellipsis on both sides when in middle', () => {
      render(<Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />)

      // Should show: 1 ... 4 5 6 ... 10
      const ellipses = screen.getAllByText('...')
      expect(ellipses).toHaveLength(2)
    })

    it('shows ellipsis before last page when near end', () => {
      render(<Pagination currentPage={9} totalPages={10} onPageChange={vi.fn()} />)

      // Should show: 1 ... 8 9 10
      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByText('1').closest('button')).toBeInTheDocument()
      expect(screen.getByText('10').closest('button')).toBeInTheDocument()
    })

    it('shows all pages without ellipsis when 7 or fewer pages', () => {
      render(<Pagination currentPage={4} totalPages={7} onPageChange={vi.fn()} />)

      // Should show all pages 1-7
      for (let i = 1; i <= 7; i++) {
        expect(screen.getByText(String(i)).closest('button')).toBeInTheDocument()
      }
      expect(screen.queryByText('...')).not.toBeInTheDocument()
    })
  })
})
