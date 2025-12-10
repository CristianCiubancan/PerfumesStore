import {
  createCheckoutSessionSchema,
  getOrderSchema,
  getOrderBySessionSchema,
  listOrdersSchema,
} from '../checkout'

describe('Checkout Schemas', () => {
  describe('createCheckoutSessionSchema', () => {
    const validInput = {
      body: {
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
        shippingAddress: {
          name: 'John Doe',
          phone: '+40712345678',
          addressLine1: '123 Main Street',
          addressLine2: 'Apt 4B',
          city: 'Bucharest',
          state: 'Sector 1',
          postalCode: '010101',
          country: 'RO',
        },
        guestEmail: 'guest@example.com',
        locale: 'en',
      },
    }

    it('should validate a complete valid input', () => {
      const result = createCheckoutSessionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should validate input without optional fields', () => {
      const input = {
        body: {
          items: [{ productId: 1, quantity: 1 }],
          shippingAddress: {
            name: 'Jane Doe',
            addressLine1: '456 Oak Avenue',
            city: 'Cluj',
            postalCode: '400001',
            country: 'RO',
          },
        },
      }
      const result = createCheckoutSessionSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should validate all supported locales', () => {
      const locales = ['en', 'ro', 'fr', 'de', 'es']
      locales.forEach((locale) => {
        const input = {
          body: {
            ...validInput.body,
            locale,
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('items validation', () => {
      it('should reject empty items array', () => {
        const input = {
          body: {
            ...validInput.body,
            items: [],
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject items array exceeding max (50)', () => {
        const items = Array.from({ length: 51 }, (_, i) => ({
          productId: i + 1,
          quantity: 1,
        }))
        const input = {
          body: {
            ...validInput.body,
            items,
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject non-positive productId', () => {
        const input = {
          body: {
            ...validInput.body,
            items: [{ productId: 0, quantity: 1 }],
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject negative productId', () => {
        const input = {
          body: {
            ...validInput.body,
            items: [{ productId: -1, quantity: 1 }],
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject non-integer productId', () => {
        const input = {
          body: {
            ...validInput.body,
            items: [{ productId: 1.5, quantity: 1 }],
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject non-positive quantity', () => {
        const input = {
          body: {
            ...validInput.body,
            items: [{ productId: 1, quantity: 0 }],
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject quantity exceeding max (99)', () => {
        const input = {
          body: {
            ...validInput.body,
            items: [{ productId: 1, quantity: 100 }],
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should accept quantity at max boundary (99)', () => {
        const input = {
          body: {
            ...validInput.body,
            items: [{ productId: 1, quantity: 99 }],
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('shippingAddress validation', () => {
      it('should reject name shorter than 2 characters', () => {
        const input = {
          body: {
            ...validInput.body,
            shippingAddress: {
              ...validInput.body.shippingAddress,
              name: 'A',
            },
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject name longer than 100 characters', () => {
        const input = {
          body: {
            ...validInput.body,
            shippingAddress: {
              ...validInput.body.shippingAddress,
              name: 'A'.repeat(101),
            },
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject addressLine1 shorter than 5 characters', () => {
        const input = {
          body: {
            ...validInput.body,
            shippingAddress: {
              ...validInput.body.shippingAddress,
              addressLine1: '123',
            },
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject addressLine1 longer than 200 characters', () => {
        const input = {
          body: {
            ...validInput.body,
            shippingAddress: {
              ...validInput.body.shippingAddress,
              addressLine1: 'A'.repeat(201),
            },
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject city shorter than 2 characters', () => {
        const input = {
          body: {
            ...validInput.body,
            shippingAddress: {
              ...validInput.body.shippingAddress,
              city: 'A',
            },
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject postalCode shorter than 2 characters', () => {
        const input = {
          body: {
            ...validInput.body,
            shippingAddress: {
              ...validInput.body.shippingAddress,
              postalCode: '1',
            },
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject country not exactly 2 characters', () => {
        const input = {
          body: {
            ...validInput.body,
            shippingAddress: {
              ...validInput.body.shippingAddress,
              country: 'ROM',
            },
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should accept valid 2-character country code', () => {
        const input = {
          body: {
            ...validInput.body,
            shippingAddress: {
              ...validInput.body.shippingAddress,
              country: 'US',
            },
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('guestEmail validation', () => {
      it('should accept valid email', () => {
        const result = createCheckoutSessionSchema.safeParse(validInput)
        expect(result.success).toBe(true)
      })

      it('should reject invalid email format', () => {
        const input = {
          body: {
            ...validInput.body,
            guestEmail: 'not-an-email',
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should accept missing guestEmail (optional)', () => {
        const { guestEmail: _guestEmail, ...bodyWithoutEmail } = validInput.body
        const input = { body: bodyWithoutEmail }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('locale validation', () => {
      it('should reject unsupported locale', () => {
        const input = {
          body: {
            ...validInput.body,
            locale: 'zh',
          },
        }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should accept missing locale (optional)', () => {
        const { locale: _locale, ...bodyWithoutLocale } = validInput.body
        const input = { body: bodyWithoutLocale }
        const result = createCheckoutSessionSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('getOrderSchema', () => {
    it('should validate valid numeric id', () => {
      const result = getOrderSchema.safeParse({ params: { id: '123' } })
      expect(result.success).toBe(true)
    })

    it('should validate single digit id', () => {
      const result = getOrderSchema.safeParse({ params: { id: '1' } })
      expect(result.success).toBe(true)
    })

    it('should validate large numeric id', () => {
      const result = getOrderSchema.safeParse({ params: { id: '999999999' } })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric id', () => {
      const result = getOrderSchema.safeParse({ params: { id: 'abc' } })
      expect(result.success).toBe(false)
    })

    it('should reject id with letters mixed with numbers', () => {
      const result = getOrderSchema.safeParse({ params: { id: '123abc' } })
      expect(result.success).toBe(false)
    })

    it('should reject negative number string', () => {
      const result = getOrderSchema.safeParse({ params: { id: '-1' } })
      expect(result.success).toBe(false)
    })

    it('should reject floating point number string', () => {
      const result = getOrderSchema.safeParse({ params: { id: '1.5' } })
      expect(result.success).toBe(false)
    })

    it('should reject empty id', () => {
      const result = getOrderSchema.safeParse({ params: { id: '' } })
      expect(result.success).toBe(false)
    })

    it('should reject missing id', () => {
      const result = getOrderSchema.safeParse({ params: {} })
      expect(result.success).toBe(false)
    })
  })

  describe('getOrderBySessionSchema', () => {
    it('should validate valid session id', () => {
      const result = getOrderBySessionSchema.safeParse({
        params: { sessionId: 'cs_test_abc123def456' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate UUID-like session id', () => {
      const result = getOrderBySessionSchema.safeParse({
        params: { sessionId: '550e8400-e29b-41d4-a716-446655440000' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty session id', () => {
      const result = getOrderBySessionSchema.safeParse({
        params: { sessionId: '' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing sessionId', () => {
      const result = getOrderBySessionSchema.safeParse({ params: {} })
      expect(result.success).toBe(false)
    })
  })

  describe('listOrdersSchema', () => {
    it('should validate empty query', () => {
      const result = listOrdersSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate valid pagination params', () => {
      const result = listOrdersSchema.safeParse({
        query: { page: '1', limit: '20' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-numeric page', () => {
      const result = listOrdersSchema.safeParse({
        query: { page: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-numeric limit', () => {
      const result = listOrdersSchema.safeParse({
        query: { limit: 'abc' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate all order status values', () => {
      const statuses = [
        'PENDING',
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED',
      ]
      statuses.forEach((status) => {
        const result = listOrdersSchema.safeParse({
          query: { status },
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid status', () => {
      const result = listOrdersSchema.safeParse({
        query: { status: 'INVALID_STATUS' },
      })
      expect(result.success).toBe(false)
    })

    it('should validate page and limit together', () => {
      const result = listOrdersSchema.safeParse({
        query: { page: '2', limit: '10' },
      })
      expect(result.success).toBe(true)
    })

    it('should validate status with pagination', () => {
      const result = listOrdersSchema.safeParse({
        query: { page: '1', limit: '10', status: 'PAID' },
      })
      expect(result.success).toBe(true)
    })
  })
})
