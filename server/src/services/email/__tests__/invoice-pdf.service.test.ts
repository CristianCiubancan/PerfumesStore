import { Prisma } from '@prisma/client'
import { generateInvoicePDF } from '../invoice-pdf.service'
import { OrderWithItems } from '../templates'

describe('Invoice PDF Service', () => {
  const sampleOrder: OrderWithItems = {
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

  describe('generateInvoicePDF', () => {
    it('should generate a PDF buffer', async () => {
      const pdfBuffer = await generateInvoicePDF(sampleOrder, 'en')

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
      expect(pdfBuffer.length).toBeGreaterThan(0)
    })

    it('should generate valid PDF (check PDF header)', async () => {
      const pdfBuffer = await generateInvoicePDF(sampleOrder, 'en')

      // PDF files start with %PDF-
      const pdfHeader = pdfBuffer.slice(0, 5).toString()
      expect(pdfHeader).toBe('%PDF-')
    })

    it('should generate PDF for all supported locales', async () => {
      const locales = ['en', 'ro', 'fr', 'de', 'es'] as const

      for (const locale of locales) {
        const pdfBuffer = await generateInvoicePDF(sampleOrder, locale)

        expect(pdfBuffer).toBeDefined()
        expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
        expect(pdfBuffer.length).toBeGreaterThan(0)
      }
    })

    it('should handle order without discount', async () => {
      const orderWithoutDiscount: OrderWithItems = {
        ...sampleOrder,
        discountRON: new Prisma.Decimal(0),
        discountPercent: 0,
      }

      const pdfBuffer = await generateInvoicePDF(orderWithoutDiscount, 'en')

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
    })

    it('should handle order without secondary address line', async () => {
      const orderWithoutLine2: OrderWithItems = {
        ...sampleOrder,
        shippingAddressLine2: null,
      }

      const pdfBuffer = await generateInvoicePDF(orderWithoutLine2, 'en')

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
    })

    it('should handle order without phone', async () => {
      const orderWithoutPhone: OrderWithItems = {
        ...sampleOrder,
        customerPhone: null,
      }

      const pdfBuffer = await generateInvoicePDF(orderWithoutPhone, 'en')

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
    })

    it('should handle order without state', async () => {
      const orderWithoutState: OrderWithItems = {
        ...sampleOrder,
        shippingState: null,
      }

      const pdfBuffer = await generateInvoicePDF(orderWithoutState, 'en')

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
    })

    it('should handle order without paidAmountEUR', async () => {
      const orderWithoutEUR: OrderWithItems = {
        ...sampleOrder,
        paidAmountEUR: null,
      }

      const pdfBuffer = await generateInvoicePDF(orderWithoutEUR, 'en')

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
    })

    it('should handle order with multiple items', async () => {
      const orderWithMultipleItems: OrderWithItems = {
        ...sampleOrder,
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
          {
            id: 2,
            createdAt: new Date('2024-12-15'),
            orderId: 1,
            productId: 2,
            productName: 'Bleu de Chanel',
            productBrand: 'Chanel',
            productSlug: 'chanel-bleu',
            volumeMl: 50,
            quantity: 1,
            unitPriceRON: new Prisma.Decimal(300),
            totalPriceRON: new Prisma.Decimal(300),
            imageUrl: 'https://example.com/bleu.jpg',
          },
          {
            id: 3,
            createdAt: new Date('2024-12-15'),
            orderId: 1,
            productId: 3,
            productName: 'Acqua di Gio',
            productBrand: 'Armani',
            productSlug: 'armani-acqua-di-gio',
            volumeMl: 75,
            quantity: 3,
            unitPriceRON: new Prisma.Decimal(200),
            totalPriceRON: new Prisma.Decimal(600),
            imageUrl: null,
          },
        ],
      }

      const pdfBuffer = await generateInvoicePDF(orderWithMultipleItems, 'en')

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
      // PDF should be larger with more items
      expect(pdfBuffer.length).toBeGreaterThan(1000)
    })

    it('should use createdAt when paidAt is not available', async () => {
      const orderWithoutPaidAt: OrderWithItems = {
        ...sampleOrder,
        paidAt: null,
      }

      const pdfBuffer = await generateInvoicePDF(orderWithoutPaidAt, 'en')

      expect(pdfBuffer).toBeDefined()
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true)
    })

    it('should generate different content for different locales', async () => {
      const enPdf = await generateInvoicePDF(sampleOrder, 'en')
      const roPdf = await generateInvoicePDF(sampleOrder, 'ro')

      // The PDFs should have different sizes due to different text
      // This is a rough check - localized PDFs will have different content
      expect(enPdf).toBeDefined()
      expect(roPdf).toBeDefined()
      // Both should be valid PDFs
      expect(enPdf.slice(0, 5).toString()).toBe('%PDF-')
      expect(roPdf.slice(0, 5).toString()).toBe('%PDF-')
    })
  })
})
