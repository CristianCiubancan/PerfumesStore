import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CartEmpty } from '../cart/cart-empty'

describe('CartEmpty', () => {
  it('renders empty cart message', () => {
    render(<CartEmpty />)

    expect(screen.getByText('empty.title')).toBeInTheDocument()
    expect(screen.getByText('empty.description')).toBeInTheDocument()
  })

  it('renders shopping cart icon', () => {
    render(<CartEmpty />)

    // The icon is decorative but the container should exist
    const iconContainer = document.querySelector('.rounded-full')
    expect(iconContainer).toBeInTheDocument()
  })

  it('renders continue shopping button', () => {
    render(<CartEmpty />)

    const button = screen.getByRole('button', { name: 'empty.continueShopping' })
    expect(button).toBeInTheDocument()
  })

  it('links to store page', () => {
    render(<CartEmpty />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/store')
  })
})
