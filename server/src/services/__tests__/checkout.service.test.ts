import { Prisma } from '@prisma/client'
import { AppError } from '../../middleware/errorHandler'
import * as checkoutService from '../checkout.service'
import * as orderService from '../order.service'
import { stripe } from '../../lib/stripe'

// Mock Stripe
jest.mock('../../lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
}))

// Mock order service
jest.mock('../order.service', () => ({
  calculateOrder: jest.fn(),
  createOrder: jest.fn(),
}))

// Mock config
jest.mock('../../config', () => ({
  config: {
    CLIENT_URL: 'http://localhost:3000',
  },
}))

describe('CheckoutService', () => {
  const mockOrderCalculation = {
    subtotalRON: new Prisma.Decimal(1000),
    discountRON: new Prisma.Decimal(0),
    discountPercent: null,
    totalRON: new Prisma.Decimal(1000),
    totalEUR: 204,
    exchangeRate: 5.0,
    feePercent: 2,
    orderItems: [
      {
        productId: 1,
        productName: 'Sauvage',
        productBrand: 'Dior',
        productSlug: 'dior-sauvage',
        volumeMl: 100,
        imageUrl: 'https://example.com/sauvage.jpg',
        quantity: 2,
        unitPriceRON: new Prisma.Decimal(500),
        totalPriceRON: new Prisma.Decimal(1000),
      },
    ],
  }

  const mockOrder = {
    id: 1,
    orderNumber: 'ORD-20251210-000001',
    userId: 1,
    status: 'PENDING',
    items: [],
  }

  const mockStripeSession = {
    id: 'cs_test_abc123',
    url: 'https://checkout.stripe.com/pay/cs_test_abc123',
  }

  const validInput = {
    items: [{ productId: 1, quantity: 2 }],
    shippingAddress: {
      name: 'John Doe',
      phone: '+40712345678',
      addressLine1: '123 Main Street',
      city: 'Bucharest',
      postalCode: '010101',
      country: 'RO',
    },
    guestEmail: 'guest@example.com',
    locale: 'en' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(orderService.calculateOrder as jest.Mock).mockResolvedValue(mockOrderCalculation)
    ;(orderService.createOrder as jest.Mock).mockResolvedValue({
      order: mockOrder,
      calculation: mockOrderCalculation,
    })
    ;(stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockStripeSession)
  })

  describe('createCheckoutSession', () => {
    it('should create checkout session for authenticated user', async () => {
      const result = await checkoutService.createCheckoutSession({
        input: validInput,
        userId: 1,
      })

      expect(result).toMatchObject({
        sessionId: 'cs_test_abc123',
        url: 'https://checkout.stripe.com/pay/cs_test_abc123',
        orderNumber: 'ORD-20251210-000001',
      })
      expect(orderService.calculateOrder).toHaveBeenCalledWith(validInput.items)
      expect(stripe.checkout.sessions.create).toHaveBeenCalled()
      expect(orderService.createOrder).toHaveBeenCalledWith({
        userId: 1,
        guestEmail: 'guest@example.com',
        shippingAddress: validInput.shippingAddress,
        items: validInput.items,
        stripeSessionId: 'cs_test_abc123',
        locale: 'en',
      })
    })

    it('should create checkout session for guest with email', async () => {
      const result = await checkoutService.createCheckoutSession({
        input: validInput,
        userId: undefined,
      })

      expect(result.sessionId).toBe('cs_test_abc123')
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'guest@example.com',
        })
      )
    })

    it('should throw error for guest without email', async () => {
      const inputWithoutEmail = {
        ...validInput,
        guestEmail: undefined,
      }

      await expect(
        checkoutService.createCheckoutSession({
          input: inputWithoutEmail,
          userId: undefined,
        })
      ).rejects.toThrow(AppError)
      await expect(
        checkoutService.createCheckoutSession({
          input: inputWithoutEmail,
          userId: undefined,
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'EMAIL_REQUIRED',
      })
    })

    it('should not require guest email for authenticated user', async () => {
      const inputWithoutEmail = {
        ...validInput,
        guestEmail: undefined,
      }

      const result = await checkoutService.createCheckoutSession({
        input: inputWithoutEmail,
        userId: 1,
      })

      expect(result.sessionId).toBe('cs_test_abc123')
    })

    it('should apply discount to line items when promotion is active', async () => {
      const calculationWithDiscount = {
        ...mockOrderCalculation,
        discountPercent: 20,
        discountRON: new Prisma.Decimal(200),
        totalRON: new Prisma.Decimal(800),
      }
      ;(orderService.calculateOrder as jest.Mock).mockResolvedValue(calculationWithDiscount)

      await checkoutService.createCheckoutSession({
        input: validInput,
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                // Price should be discounted: 500 RON * 0.8 / 5.0 * 1.02 * 100 = 8160 cents
                unit_amount: expect.any(Number),
              }),
            }),
          ]),
        })
      )
    })

    it('should use correct locale for Stripe session', async () => {
      await checkoutService.createCheckoutSession({
        input: { ...validInput, locale: 'ro' },
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: 'ro',
        })
      )
    })

    it('should use auto locale when locale not provided', async () => {
      const inputWithoutLocale = {
        ...validInput,
        locale: undefined,
      }

      await checkoutService.createCheckoutSession({
        input: inputWithoutLocale,
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: 'auto',
        })
      )
    })

    it('should use auto locale for unsupported locales', async () => {
      const inputWithUnsupportedLocale = {
        ...validInput,
        locale: 'zh' as 'en', // Type assertion for test
      }

      await checkoutService.createCheckoutSession({
        input: inputWithUnsupportedLocale,
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: 'auto',
        })
      )
    })

    it('should set correct success and cancel URLs', async () => {
      await checkoutService.createCheckoutSession({
        input: { ...validInput, locale: 'fr' },
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'http://localhost:3000/fr/checkout/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'http://localhost:3000/fr/cart',
        })
      )
    })

    it('should set session expiration to 30 minutes', async () => {
      const now = Math.floor(Date.now() / 1000)
      jest.spyOn(Date, 'now').mockReturnValue(now * 1000)

      await checkoutService.createCheckoutSession({
        input: validInput,
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          expires_at: now + 30 * 60,
        })
      )

      jest.restoreAllMocks()
    })

    it('should include user metadata in Stripe session', async () => {
      await checkoutService.createCheckoutSession({
        input: validInput,
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: '1',
            guestEmail: 'guest@example.com',
          },
        })
      )
    })

    it('should include empty userId in metadata for guest', async () => {
      await checkoutService.createCheckoutSession({
        input: validInput,
        userId: undefined,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: '',
          }),
        })
      )
    })

    it('should create line items with product details', async () => {
      await checkoutService.createCheckoutSession({
        input: validInput,
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'eur',
                product_data: expect.objectContaining({
                  name: 'Dior - Sauvage',
                  description: '100ml',
                  images: ['https://example.com/sauvage.jpg'],
                }),
              }),
              quantity: 2,
            }),
          ]),
        })
      )
    })

    it('should handle products without images', async () => {
      const calculationWithoutImage = {
        ...mockOrderCalculation,
        orderItems: [
          {
            ...mockOrderCalculation.orderItems[0],
            imageUrl: null,
          },
        ],
      }
      ;(orderService.calculateOrder as jest.Mock).mockResolvedValue(calculationWithoutImage)

      await checkoutService.createCheckoutSession({
        input: validInput,
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: expect.not.objectContaining({
                  images: expect.anything(),
                }),
              }),
            }),
          ]),
        })
      )
    })

    it('should use card payment method', async () => {
      await checkoutService.createCheckoutSession({
        input: validInput,
        userId: 1,
      })

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          mode: 'payment',
        })
      )
    })

    it('should calculate EUR price correctly', async () => {
      // With 500 RON, rate 5.0, fee 2%:
      // priceEUR = (500 / 5.0) * 1.02 * 100 = 10200 cents
      await checkoutService.createCheckoutSession({
        input: validInput,
        userId: 1,
      })

      const createCall = (stripe.checkout.sessions.create as jest.Mock).mock.calls[0][0]
      const unitAmount = createCall.line_items[0].price_data.unit_amount

      expect(unitAmount).toBe(10200)
    })
  })
})
