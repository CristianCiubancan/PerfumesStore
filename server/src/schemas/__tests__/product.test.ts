import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  listProductsSchema,
  bulkDeleteSchema,
} from '../product'

describe('Product Schemas', () => {
  describe('createProductSchema', () => {
    const validProduct = {
      name: 'Test Perfume',
      brand: 'Test Brand',
      concentration: 'Eau_de_Parfum',
      gender: 'Unisex',
      fragranceFamilyId: 1,
      topNotes: ['Bergamot'],
      heartNotes: ['Rose'],
      baseNotes: ['Musk'],
      volumeMl: 100,
      priceRON: 500,
      launchYear: 2020,
      longevityId: 1,
      sillageId: 1,
      seasonIds: [1],
      occasionIds: [1],
      rating: 4.5,
      stock: 10,
    }

    it('should validate a valid product', () => {
      const result = createProductSchema.safeParse({ body: validProduct })
      expect(result.success).toBe(true)
    })

    it('should reject missing required fields', () => {
      const result = createProductSchema.safeParse({ body: {} })
      expect(result.success).toBe(false)
    })

    it('should reject invalid gender', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, gender: 'Invalid' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid concentration', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, concentration: 'Invalid' },
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid local imageUrl', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, imageUrl: '/uploads/products/test.webp' },
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty imageUrl', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, imageUrl: '' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid external imageUrl', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, imageUrl: 'https://malicious.com/image.jpg' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid imageUrl format', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, imageUrl: 'not-a-valid-url' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject rating below minimum', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, rating: -1 },
      })
      expect(result.success).toBe(false)
    })

    it('should reject rating above maximum', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, rating: 6 },
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty topNotes array', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, topNotes: [] },
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative stock', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, stock: -1 },
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty seasonIds', () => {
      const result = createProductSchema.safeParse({
        body: { ...validProduct, seasonIds: [] },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateProductSchema', () => {
    it('should validate partial update', () => {
      const result = updateProductSchema.safeParse({
        body: { name: 'Updated Name' },
        params: { id: '1' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid product id', () => {
      const result = updateProductSchema.safeParse({
        body: { name: 'Updated Name' },
        params: { id: 'invalid' },
      })
      expect(result.success).toBe(false)
    })

    it('should accept empty body for update', () => {
      const result = updateProductSchema.safeParse({
        body: {},
        params: { id: '1' },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('getProductSchema', () => {
    it('should validate valid product id', () => {
      const result = getProductSchema.safeParse({
        params: { id: '123' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric id', () => {
      const result = getProductSchema.safeParse({
        params: { id: 'abc' },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('listProductsSchema', () => {
    it('should validate empty query', () => {
      const result = listProductsSchema.safeParse({ query: {} })
      expect(result.success).toBe(true)
    })

    it('should validate pagination params', () => {
      const result = listProductsSchema.safeParse({
        query: { page: '1', limit: '20' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric page', () => {
      const result = listProductsSchema.safeParse({
        query: { page: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate gender filter', () => {
      const result = listProductsSchema.safeParse({
        query: { gender: 'Men' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate concentration filter', () => {
      const result = listProductsSchema.safeParse({
        query: { concentration: 'Eau_de_Parfum' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate price range', () => {
      const result = listProductsSchema.safeParse({
        query: { minPrice: '100', maxPrice: '500.50' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate sort params', () => {
      const result = listProductsSchema.safeParse({
        query: { sortBy: 'price', sortOrder: 'desc' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate filter IDs', () => {
      const result = listProductsSchema.safeParse({
        query: {
          fragranceFamilyId: '1',
          longevityId: '2',
          sillageId: '3',
        },
      })
      expect(result.success).toBe(true)
    })

    it('should validate season and occasion IDs', () => {
      const result = listProductsSchema.safeParse({
        query: {
          seasonIds: '1,2,3',
          seasonMatchMode: 'all',
          occasionIds: '1,2',
          occasionMatchMode: 'any',
        },
      })
      expect(result.success).toBe(true)
    })

    it('should validate rating range', () => {
      const result = listProductsSchema.safeParse({
        query: { minRating: '3.5', maxRating: '5.0' },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('bulkDeleteSchema', () => {
    it('should validate valid ids array', () => {
      const result = bulkDeleteSchema.safeParse({
        body: { ids: [1, 2, 3] },
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty ids array', () => {
      const result = bulkDeleteSchema.safeParse({
        body: { ids: [] },
      })
      expect(result.success).toBe(false)
    })

    it('should reject too many ids', () => {
      const ids = Array.from({ length: 101 }, (_, i) => i + 1)
      const result = bulkDeleteSchema.safeParse({
        body: { ids },
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-positive ids', () => {
      const result = bulkDeleteSchema.safeParse({
        body: { ids: [0, -1, 2] },
      })
      expect(result.success).toBe(false)
    })
  })
})
