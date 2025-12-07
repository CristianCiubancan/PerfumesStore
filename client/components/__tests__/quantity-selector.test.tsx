import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuantitySelector } from '../ui/quantity-selector'

describe('QuantitySelector', () => {
  const defaultProps = {
    value: 1,
    max: 10,
    onChange: vi.fn(),
  }

  // Helper to get buttons by their accessible name (sr-only text)
  // Note: next-intl is mocked to return translation keys
  const getDecrementButton = () => screen.getByRole('button', { name: 'decreaseQuantity' })
  const getIncrementButton = () => screen.getByRole('button', { name: 'increaseQuantity' })

  it('renders current value', () => {
    render(<QuantitySelector {...defaultProps} value={5} />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(5)
  })

  it('renders increment and decrement buttons', () => {
    render(<QuantitySelector {...defaultProps} />)

    expect(getDecrementButton()).toBeInTheDocument()
    expect(getIncrementButton()).toBeInTheDocument()
  })

  describe('decrement button', () => {
    it('decrements value when clicked', async () => {
      const onChange = vi.fn()
      render(<QuantitySelector {...defaultProps} value={5} onChange={onChange} />)

      await userEvent.click(getDecrementButton())

      expect(onChange).toHaveBeenCalledWith(4)
    })

    it('is disabled at minimum value', () => {
      render(<QuantitySelector {...defaultProps} value={1} min={1} />)

      expect(getDecrementButton()).toBeDisabled()
    })

    it('is disabled when component is disabled', () => {
      render(<QuantitySelector {...defaultProps} value={5} disabled />)

      expect(getDecrementButton()).toBeDisabled()
    })
  })

  describe('increment button', () => {
    it('increments value when clicked', async () => {
      const onChange = vi.fn()
      render(<QuantitySelector {...defaultProps} value={5} onChange={onChange} />)

      await userEvent.click(getIncrementButton())

      expect(onChange).toHaveBeenCalledWith(6)
    })

    it('is disabled at maximum value', () => {
      render(<QuantitySelector {...defaultProps} value={10} max={10} />)

      expect(getIncrementButton()).toBeDisabled()
    })

    it('is disabled when component is disabled', () => {
      render(<QuantitySelector {...defaultProps} value={5} disabled />)

      expect(getIncrementButton()).toBeDisabled()
    })
  })

  describe('input field', () => {
    it('allows direct input', () => {
      const onChange = vi.fn()
      render(<QuantitySelector {...defaultProps} value={1} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '7' } })

      expect(onChange).toHaveBeenCalledWith(7)
    })

    it('clamps value to minimum', () => {
      const onChange = vi.fn()
      render(<QuantitySelector {...defaultProps} min={2} value={5} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '1' } })

      expect(onChange).toHaveBeenCalledWith(2)
    })

    it('clamps value to maximum', () => {
      const onChange = vi.fn()
      render(<QuantitySelector {...defaultProps} max={5} value={3} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '10' } })

      expect(onChange).toHaveBeenCalledWith(5)
    })

    it('ignores non-numeric input', () => {
      const onChange = vi.fn()
      render(<QuantitySelector {...defaultProps} value={5} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: 'abc' } })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('is disabled when component is disabled', () => {
      render(<QuantitySelector {...defaultProps} disabled />)

      expect(screen.getByRole('spinbutton')).toBeDisabled()
    })
  })

  describe('size variants', () => {
    it('applies small size classes', () => {
      render(<QuantitySelector {...defaultProps} size="sm" />)

      const input = screen.getByRole('spinbutton')
      expect(input.className).toContain('h-8')
    })

    it('applies medium size classes by default', () => {
      render(<QuantitySelector {...defaultProps} />)

      const input = screen.getByRole('spinbutton')
      expect(input.className).toContain('h-10')
    })
  })

  describe('custom props', () => {
    it('applies custom className', () => {
      const { container } = render(
        <QuantitySelector {...defaultProps} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('respects custom min value', () => {
      render(<QuantitySelector {...defaultProps} value={5} min={5} />)

      expect(getDecrementButton()).toBeDisabled()
    })
  })
})
