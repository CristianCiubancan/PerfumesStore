import { Prisma } from '@prisma/client'
import * as orderConfirmation from '../order-confirmation'
import * as newsletterWelcome from '../newsletter-welcome'
import { SUPPORTED_LOCALES } from '../translations'

// Mock config
jest.mock('../../../../config', () => ({
  config: {
    CLIENT_URL: 'https://example.com',
  },
}))

describe('Email Templates', () => {
  describe('Order Confirmation Template', () => {
    const sampleOrder: orderConfirmation.OrderWithItems = {
      id: 1,
      orderNumber: 'ORD-20241215-000001',
      createdAt: new Date('2024-12-15'),
      updatedAt: new Date('2024-12-15'),
      paidAt: new Date('2024-12-15'),
      userId: 1,
      guestEmail: 'john@example.com',
      status: 'PAID',
      customerName: 'John Doe',
      customerPhone: '+40712345678',
      shippingAddressLine1: '123 Main Street',
      shippingAddressLine2: 'Apt 4B',
      shippingCity: 'Bucharest',
      shippingState: 'Bucharest',
      shippingPostalCode: '010101',
      shippingCountry: 'Romania',
      subtotalRON: new Prisma.Decimal(500),
      discountRON: new Prisma.Decimal(50),
      discountPercent: 10,
      totalRON: new Prisma.Decimal(450),
      paidAmountEUR: new Prisma.Decimal(90),
      exchangeRateUsed: new Prisma.Decimal(5),
      exchangeFeePercent: new Prisma.Decimal(2),
      stripeSessionId: 'cs_test_123',
      stripePaymentIntentId: 'pi_test_123',
      orderLocale: 'en',
      items: [
        {
          id: 1,
          createdAt: new Date('2024-12-15'),
          orderId: 1,
          productId: 1,
          productName: 'Sauvage',
          productBrand: 'Dior',
          productSlug: 'dior-sauvage',
          volumeMl: 100,
          quantity: 2,
          unitPriceRON: new Prisma.Decimal(250),
          totalPriceRON: new Prisma.Decimal(500),
          imageUrl: 'https://example.com/sauvage.jpg',
        },
      ],
    }

    describe('metadata', () => {
      it('should have correct id', () => {
        expect(orderConfirmation.metadata.id).toBe('order-confirmation')
      })

      it('should be a transactional email', () => {
        expect(orderConfirmation.metadata.category).toBe('transactional')
      })

      it('should list expected variables', () => {
        expect(orderConfirmation.metadata.variables).toContain('order')
      })
    })

    describe('render', () => {
      it.each(SUPPORTED_LOCALES)('should render for locale %s', (locale) => {
        const result = orderConfirmation.render({ order: sampleOrder }, locale)

        expect(result.subject).toBeDefined()
        expect(result.subject.length).toBeGreaterThan(0)
        expect(result.html).toBeDefined()
        expect(result.html).toContain('<!DOCTYPE html>')
        expect(result.text).toBeDefined()
      })

      it('should include order number in subject', () => {
        const result = orderConfirmation.render({ order: sampleOrder }, 'en')
        expect(result.subject).toContain('ORD-20241215-000001')
      })

      it('should include customer name in HTML', () => {
        const result = orderConfirmation.render({ order: sampleOrder }, 'en')
        expect(result.html).toContain('John Doe')
      })

      it('should include shipping address in HTML', () => {
        const result = orderConfirmation.render({ order: sampleOrder }, 'en')
        expect(result.html).toContain('123 Main Street')
        expect(result.html).toContain('Bucharest')
      })

      it('should include product details in HTML', () => {
        const result = orderConfirmation.render({ order: sampleOrder }, 'en')
        expect(result.html).toContain('Dior')
        expect(result.html).toContain('Sauvage')
        expect(result.html).toContain('100ml')
      })

      it('should include order totals in HTML', () => {
        const result = orderConfirmation.render({ order: sampleOrder }, 'en')
        expect(result.html).toContain('500.00')
        expect(result.html).toContain('450.00')
      })

      it('should include discount when present', () => {
        const result = orderConfirmation.render({ order: sampleOrder }, 'en')
        expect(result.html).toContain('10%')
        expect(result.html).toContain('50.00')
      })

      it('should include order number in plain text', () => {
        const result = orderConfirmation.render({ order: sampleOrder }, 'en')
        expect(result.text).toContain('ORD-20241215-000001')
      })

      it('should handle orders without discount', () => {
        const orderWithoutDiscount = {
          ...sampleOrder,
          discountRON: new Prisma.Decimal(0),
          discountPercent: 0,
        }
        const result = orderConfirmation.render({ order: orderWithoutDiscount }, 'en')

        expect(result.html).toBeDefined()
        // Should not have discount line with -0.00
        expect(result.html).not.toContain('-0.00')
      })
    })

    describe('getSampleData', () => {
      it('should return valid sample data', () => {
        const sampleData = orderConfirmation.getSampleData()

        expect(sampleData.order).toBeDefined()
        expect(sampleData.order.orderNumber).toBeDefined()
        expect(sampleData.order.items).toBeDefined()
        expect(sampleData.order.items.length).toBeGreaterThan(0)
      })

      it('should render without errors using sample data', () => {
        const sampleData = orderConfirmation.getSampleData()
        const result = orderConfirmation.render(sampleData, 'en')

        expect(result.html).toContain('<!DOCTYPE html>')
        expect(result.text).toBeDefined()
      })
    })
  })

  describe('Newsletter Welcome Template', () => {
    describe('metadata', () => {
      it('should have correct id', () => {
        expect(newsletterWelcome.metadata.id).toBe('newsletter-welcome')
      })

      it('should be a transactional email', () => {
        expect(newsletterWelcome.metadata.category).toBe('transactional')
      })
    })

    describe('render', () => {
      it.each(SUPPORTED_LOCALES)('should render for locale %s', (locale) => {
        const result = newsletterWelcome.render({ email: 'test@example.com' }, locale)

        expect(result.subject).toBeDefined()
        expect(result.subject.length).toBeGreaterThan(0)
        expect(result.html).toBeDefined()
        expect(result.html).toContain('<!DOCTYPE html>')
        expect(result.text).toBeDefined()
      })

      it('should include welcome message', () => {
        const result = newsletterWelcome.render({}, 'en')
        expect(result.html).toContain('Welcome')
      })

      it('should include what to expect section', () => {
        const result = newsletterWelcome.render({}, 'en')
        // New design uses table-based benefit rows instead of list items
        expect(result.html).toContain('Exclusive offers')
        expect(result.html).toContain('new arrivals')
        expect(result.html).toContain('Fragrance tips')
      })

      it('should include CTA button', () => {
        const result = newsletterWelcome.render({}, 'en')
        expect(result.html).toContain('href=')
        expect(result.html).toContain('/store')
      })

      it('should include unsubscribe notice', () => {
        const result = newsletterWelcome.render({}, 'en')
        expect(result.html.toLowerCase()).toContain('unsubscribe')
      })

      it('should include plain text version', () => {
        const result = newsletterWelcome.render({}, 'en')
        expect(result.text).toContain('Welcome')
        expect(result.text).not.toContain('<')
      })
    })

    describe('getSampleData', () => {
      it('should return valid sample data', () => {
        const sampleData = newsletterWelcome.getSampleData()
        expect(sampleData.email).toBeDefined()
      })
    })
  })
})
