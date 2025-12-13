import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '../store/product-card'
import type { Product } from '@/types'

// Mock currency formatter
vi.mock('@/lib/currency', () => ({
  useFormattedPrice: () => (price: string | number) => `${price} RON`,
}))

// Mock upload helper
vi.mock('@/lib/api/upload', () => ({
  getFullImageUrl: (url: string) => url,
}))

// Mock AddToCartButton
vi.mock('@/components/store/add-to-cart-button', () => ({
  AddToCartButton: ({ product, variant }: { product: Product; variant: string }) => (
    <button data-testid="add-to-cart" data-variant={variant}>
      Add {product.name}
    </button>
  ),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, priority, loading, ...props }: { src: string; alt: string; priority?: boolean; loading?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-priority={priority?.toString()}
      data-loading={loading}
      {...props}
    />
  ),
}))

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 1,
    name: 'Elegant Perfume',
    brand: 'Luxury Brand',
    slug: 'elegant-perfume',
    priceRON: '250.00',
    volumeMl: 100,
    concentration: 'Eau_de_Parfum',
    gender: 'Unisex',
    rating: '4.5',
    stock: 10,
    imageUrl: 'https://example.com/perfume.jpg',
    description: 'A beautiful perfume',
    topNotes: [],
    heartNotes: [],
    baseNotes: [],
    fragranceFamilyId: 1,
    fragranceFamily: { id: 1, name: 'Floral' },
    longevityId: 1,
    longevity: { id: 1, name: 'Long', sortOrder: 3 },
    sillageId: 1,
    sillage: { id: 1, name: 'Moderate', sortOrder: 2 },
    seasons: [],
    occasions: [],
    launchYear: 2020,
    perfumer: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders product image', () => {
    render(<ProductCard product={mockProduct} />)
    const img = screen.getByAltText('Elegant Perfume')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/perfume.jpg')
  })

  it('renders product brand', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Luxury Brand')).toBeInTheDocument()
  })

  it('renders product name', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Elegant Perfume')).toBeInTheDocument()
  })

  it('renders product price', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('250.00 RON')).toBeInTheDocument()
  })

  it('renders volume', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('100ml')).toBeInTheDocument()
  })

  it('renders rating when present', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('does not render rating when zero', () => {
    const noRatingProduct = { ...mockProduct, rating: '0' }
    render(<ProductCard product={noRatingProduct} />)
    expect(screen.queryByText('0.0')).not.toBeInTheDocument()
  })

  it('renders concentration badge', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('concentration.Eau_de_Parfum')).toBeInTheDocument()
  })

  it('renders gender badge', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('gender.Unisex')).toBeInTheDocument()
  })

  it('renders product link', () => {
    render(<ProductCard product={mockProduct} />)
    const links = screen.getAllByRole('link')
    expect(links.some(link => link.getAttribute('href')?.includes('/product/elegant-perfume'))).toBe(true)
  })

  it('renders AddToCartButton with full variant', () => {
    render(<ProductCard product={mockProduct} />)
    const addToCartButton = screen.getByTestId('add-to-cart')
    expect(addToCartButton).toHaveAttribute('data-variant', 'full')
  })

  it('shows out of stock badge when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 }
    render(<ProductCard product={outOfStockProduct} />)
    expect(screen.getByText('outOfStock')).toBeInTheDocument()
  })

  it('renders placeholder when no image', () => {
    const noImageProduct = { ...mockProduct, imageUrl: null }
    render(<ProductCard product={noImageProduct} />)
    expect(screen.getByText('🧴')).toBeInTheDocument()
  })

  describe('priority loading', () => {
    it('sets priority when priority prop is true', () => {
      render(<ProductCard product={mockProduct} priority={true} />)
      const img = screen.getByAltText('Elegant Perfume')
      expect(img).toHaveAttribute('data-priority', 'true')
    })

    it('sets lazy loading when priority is false', () => {
      render(<ProductCard product={mockProduct} priority={false} />)
      const img = screen.getByAltText('Elegant Perfume')
      expect(img).toHaveAttribute('data-loading', 'lazy')
    })

    it('defaults to lazy loading when priority is not specified', () => {
      render(<ProductCard product={mockProduct} />)
      const img = screen.getByAltText('Elegant Perfume')
      expect(img).toHaveAttribute('data-loading', 'lazy')
    })
  })

  describe('different product types', () => {
    it('renders EDT concentration', () => {
      const edtProduct: Product = { ...mockProduct, concentration: 'Eau_de_Toilette' }
      render(<ProductCard product={edtProduct} />)
      expect(screen.getByText('concentration.Eau_de_Toilette')).toBeInTheDocument()
    })

    it('renders PARFUM concentration', () => {
      const parfumProduct: Product = { ...mockProduct, concentration: 'Parfum' }
      render(<ProductCard product={parfumProduct} />)
      expect(screen.getByText('concentration.Parfum')).toBeInTheDocument()
    })

    it('renders Women gender', () => {
      const womenProduct: Product = { ...mockProduct, gender: 'Women' }
      render(<ProductCard product={womenProduct} />)
      expect(screen.getByText('gender.Women')).toBeInTheDocument()
    })

    it('renders Men gender', () => {
      const menProduct: Product = { ...mockProduct, gender: 'Men' }
      render(<ProductCard product={menProduct} />)
      expect(screen.getByText('gender.Men')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles high price', () => {
      const expensiveProduct = { ...mockProduct, priceRON: '9999.99' }
      render(<ProductCard product={expensiveProduct} />)
      expect(screen.getByText('9999.99 RON')).toBeInTheDocument()
    })

    it('handles small volume', () => {
      const smallProduct = { ...mockProduct, volumeMl: 5 }
      render(<ProductCard product={smallProduct} />)
      expect(screen.getByText('5ml')).toBeInTheDocument()
    })

    it('handles large volume', () => {
      const largeProduct = { ...mockProduct, volumeMl: 500 }
      render(<ProductCard product={largeProduct} />)
      expect(screen.getByText('500ml')).toBeInTheDocument()
    })

    it('handles low rating', () => {
      const lowRatingProduct = { ...mockProduct, rating: '1.5' }
      render(<ProductCard product={lowRatingProduct} />)
      expect(screen.getByText('1.5')).toBeInTheDocument()
    })

    it('handles perfect rating', () => {
      const perfectRatingProduct = { ...mockProduct, rating: '5.0' }
      render(<ProductCard product={perfectRatingProduct} />)
      expect(screen.getByText('5.0')).toBeInTheDocument()
    })
  })
})
