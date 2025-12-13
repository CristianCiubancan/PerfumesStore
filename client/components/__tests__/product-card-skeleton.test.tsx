import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ProductCardSkeleton } from '../store/product-card-skeleton'

describe('ProductCardSkeleton', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<ProductCardSkeleton />)

    // Check for skeleton elements (animated pulse placeholders)
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders within a card', () => {
    const { container } = render(<ProductCardSkeleton />)

    // Card wrapper should be present
    const card = container.querySelector('[data-slot="card"]')
    expect(card).toBeInTheDocument()
  })

  it('has image placeholder with aspect-square', () => {
    const { container } = render(<ProductCardSkeleton />)

    // The first skeleton should be for the image
    const imageSkeleton = container.querySelector('.aspect-square')
    expect(imageSkeleton).toBeInTheDocument()
  })

  it('renders multiple skeleton elements for product details', () => {
    const { container } = render(<ProductCardSkeleton />)

    // Should have skeletons for: image, brand, name, rating, 2 badges, price, volume, button
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(6)
  })

  it('contains card content section', () => {
    const { container } = render(<ProductCardSkeleton />)

    const cardContent = container.querySelector('[data-slot="card-content"]')
    expect(cardContent).toBeInTheDocument()
  })

  it('renders skeleton for add-to-cart button', () => {
    const { container } = render(<ProductCardSkeleton />)

    // The button skeleton should have full width
    const buttonSkeleton = container.querySelector('.w-full.h-9')
    expect(buttonSkeleton).toBeInTheDocument()
  })
})
