import { describe, it, expect, vi } from 'vitest'
import { productSchema, isAllowedImageUrl, genderOptions, concentrationOptions, concentrationLabels } from '../product'

// Mock the env module
vi.mock('@/lib/env', () => ({
  env: {
    apiUrl: 'http://localhost:4000',
    allowedImageHosts: ['example.com', 'cdn.test.com'],
  },
}))

describe('isAllowedImageUrl', () => {
  it('returns true for empty URL', () => {
    expect(isAllowedImageUrl('')).toBe(true)
  })

  it('returns true for local upload paths', () => {
    expect(isAllowedImageUrl('/uploads/image.jpg')).toBe(true)
    expect(isAllowedImageUrl('/uploads/subfolder/image.png')).toBe(true)
  })

  it('returns true for API URL', () => {
    expect(isAllowedImageUrl('http://localhost:4000/uploads/image.jpg')).toBe(true)
  })

  it('returns true for allowed external hosts', () => {
    expect(isAllowedImageUrl('https://example.com/image.jpg')).toBe(true)
    expect(isAllowedImageUrl('https://cdn.test.com/images/product.png')).toBe(true)
  })

  it('returns false for non-allowed hosts', () => {
    expect(isAllowedImageUrl('https://malicious-site.com/image.jpg')).toBe(false)
    expect(isAllowedImageUrl('https://random.org/img.png')).toBe(false)
  })

  it('returns false for invalid URLs', () => {
    expect(isAllowedImageUrl('not-a-url')).toBe(false)
    expect(isAllowedImageUrl('ftp://invalid-protocol.com/image.jpg')).toBe(false)
  })
})

describe('productSchema', () => {
  const validProduct = {
    name: 'Test Perfume',
    brand: 'Test Brand',
    concentration: 'Eau_de_Parfum',
    gender: 'Unisex',
    fragranceFamilyId: 1,
    topNotes: 'Bergamot, Lemon',
    heartNotes: 'Rose, Jasmine',
    baseNotes: 'Sandalwood, Vanilla',
    volumeMl: 100,
    priceRON: 250,
    launchYear: 2020,
    longevityId: 1,
    sillageId: 1,
    seasonIds: [1, 2],
    occasionIds: [1],
    rating: 4.5,
    stock: 10,
  }

  it('validates a valid product', () => {
    const result = productSchema.safeParse(validProduct)
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = productSchema.safeParse({ ...validProduct, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty brand', () => {
    const result = productSchema.safeParse({ ...validProduct, brand: '' })
    expect(result.success).toBe(false)
  })

  it('validates concentration options', () => {
    for (const concentration of concentrationOptions) {
      const result = productSchema.safeParse({ ...validProduct, concentration })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid concentration', () => {
    const result = productSchema.safeParse({ ...validProduct, concentration: 'Invalid' })
    expect(result.success).toBe(false)
  })

  it('validates gender options', () => {
    for (const gender of genderOptions) {
      const result = productSchema.safeParse({ ...validProduct, gender })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid gender', () => {
    const result = productSchema.safeParse({ ...validProduct, gender: 'Other' })
    expect(result.success).toBe(false)
  })

  it('rejects negative volume', () => {
    const result = productSchema.safeParse({ ...validProduct, volumeMl: -10 })
    expect(result.success).toBe(false)
  })

  it('rejects zero volume', () => {
    const result = productSchema.safeParse({ ...validProduct, volumeMl: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = productSchema.safeParse({ ...validProduct, priceRON: -100 })
    expect(result.success).toBe(false)
  })

  it('validates launch year range', () => {
    expect(productSchema.safeParse({ ...validProduct, launchYear: 1800 }).success).toBe(true)
    expect(productSchema.safeParse({ ...validProduct, launchYear: 2025 }).success).toBe(true)
    expect(productSchema.safeParse({ ...validProduct, launchYear: 1799 }).success).toBe(false)
  })

  it('validates rating range', () => {
    expect(productSchema.safeParse({ ...validProduct, rating: 0 }).success).toBe(true)
    expect(productSchema.safeParse({ ...validProduct, rating: 5 }).success).toBe(true)
    expect(productSchema.safeParse({ ...validProduct, rating: -1 }).success).toBe(false)
    expect(productSchema.safeParse({ ...validProduct, rating: 6 }).success).toBe(false)
  })

  it('requires at least one season', () => {
    const result = productSchema.safeParse({ ...validProduct, seasonIds: [] })
    expect(result.success).toBe(false)
  })

  it('requires at least one occasion', () => {
    const result = productSchema.safeParse({ ...validProduct, occasionIds: [] })
    expect(result.success).toBe(false)
  })

  it('allows optional fields', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      perfumer: undefined,
      imageUrl: undefined,
      description: undefined,
    })
    expect(result.success).toBe(true)
  })

  it('validates optional perfumer', () => {
    const result = productSchema.safeParse({
      ...validProduct,
      perfumer: 'Famous Perfumer',
    })
    expect(result.success).toBe(true)
  })

  it('validates image URL against allowed hosts', () => {
    // Local path allowed
    expect(productSchema.safeParse({
      ...validProduct,
      imageUrl: '/uploads/image.jpg',
    }).success).toBe(true)

    // Allowed host
    expect(productSchema.safeParse({
      ...validProduct,
      imageUrl: 'https://example.com/image.jpg',
    }).success).toBe(true)

    // Non-allowed host
    expect(productSchema.safeParse({
      ...validProduct,
      imageUrl: 'https://evil.com/image.jpg',
    }).success).toBe(false)
  })

  it('coerces string numbers to numbers', () => {
    const stringProduct = {
      ...validProduct,
      fragranceFamilyId: '1',
      volumeMl: '100',
      priceRON: '250.50',
      launchYear: '2020',
      longevityId: '1',
      sillageId: '1',
      rating: '4.5',
      stock: '10',
    }
    const result = productSchema.safeParse(stringProduct)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(typeof result.data.fragranceFamilyId).toBe('number')
      expect(typeof result.data.volumeMl).toBe('number')
      expect(typeof result.data.priceRON).toBe('number')
    }
  })
})

describe('concentrationLabels', () => {
  it('has labels for all concentration options', () => {
    for (const option of concentrationOptions) {
      expect(concentrationLabels[option]).toBeDefined()
      expect(typeof concentrationLabels[option]).toBe('string')
    }
  })

  it('has human-readable labels', () => {
    expect(concentrationLabels.Eau_de_Parfum).toBe('Eau de Parfum')
    expect(concentrationLabels.Eau_de_Toilette).toBe('Eau de Toilette')
  })
})
