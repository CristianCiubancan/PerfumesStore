import PDFDocument from 'pdfkit'
import path from 'path'
import {
  getTranslations,
  getDateLocale,
  type Locale,
  type OrderWithItems,
} from './templates'

// ============================================================================
// Font paths for Unicode support (Romanian diacritics: ă, â, î, ș, ț)
// ============================================================================
const FONTS_DIR = path.join(__dirname, '../../assets/fonts')
const FONT_REGULAR = path.join(FONTS_DIR, 'Roboto-Regular.ttf')
const FONT_BOLD = path.join(FONTS_DIR, 'Roboto-Bold.ttf')

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(amount: number | { toNumber: () => number }): string {
  const value = typeof amount === 'number' ? amount : amount.toNumber()
  return `${value.toFixed(2)} RON`
}

function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(getDateLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ============================================================================
// PDF Generation
// ============================================================================

export async function generateInvoicePDF(
  order: OrderWithItems,
  locale: Locale
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const t = getTranslations(locale).invoice
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `${t.title} - ${order.orderNumber}`,
          Author: 'Perfumes Store',
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Register custom fonts for Unicode support
      doc.registerFont('Roboto', FONT_REGULAR)
      doc.registerFont('Roboto-Bold', FONT_BOLD)

      // Colors
      const primaryColor = '#1a1a1a'
      const secondaryColor = '#666666'
      const accentColor = '#4f46e5'
      const lightGray = '#f5f5f5'

      // ========== Header ==========
      doc
        .fontSize(24)
        .font('Roboto-Bold')
        .fillColor(primaryColor)
        .text('Perfumes Store', 50, 50)

      doc
        .fontSize(32)
        .fillColor(accentColor)
        .text(t.title, 400, 50, { align: 'right' })

      // Invoice info
      doc
        .fontSize(10)
        .font('Roboto')
        .fillColor(secondaryColor)
        .text(`${t.invoiceNumber}: ${order.orderNumber}`, 400, 90, { align: 'right' })
        .text(`${t.date}: ${formatDate(order.paidAt || order.createdAt, locale)}`, { align: 'right' })

      // Horizontal line
      doc
        .moveTo(50, 130)
        .lineTo(545, 130)
        .strokeColor('#e0e0e0')
        .stroke()

      // ========== Addresses ==========
      let y = 150

      // Ship To
      doc
        .fontSize(10)
        .font('Roboto-Bold')
        .fillColor(secondaryColor)
        .text(t.shipTo, 50, y)

      doc
        .font('Roboto')
        .fillColor(primaryColor)
        .fontSize(11)
        .text(order.customerName, 50, y + 18)
        .fontSize(10)
        .text(order.shippingAddressLine1, 50, y + 33)

      let addressY = y + 48
      if (order.shippingAddressLine2) {
        doc.text(order.shippingAddressLine2, 50, addressY)
        addressY += 15
      }
      doc.text(`${order.shippingCity}${order.shippingState ? `, ${order.shippingState}` : ''}`, 50, addressY)
      doc.text(order.shippingPostalCode, 50, addressY + 15)
      doc.text(order.shippingCountry, 50, addressY + 30)

      // Contact info
      if (order.customerPhone) {
        doc.text(order.customerPhone, 50, addressY + 50)
      }

      // ========== Items Table ==========
      y = 280

      // Table header background
      doc
        .rect(50, y, 495, 25)
        .fill(lightGray)

      // Table headers
      doc
        .font('Roboto-Bold')
        .fontSize(9)
        .fillColor(secondaryColor)
        .text(t.description, 55, y + 8, { width: 220 })
        .text(t.quantity, 280, y + 8, { width: 50, align: 'center' })
        .text(t.unitPrice, 340, y + 8, { width: 80, align: 'right' })
        .text(t.amount, 430, y + 8, { width: 110, align: 'right' })

      y += 30

      // Table items
      doc.font('Roboto').fillColor(primaryColor)

      for (const item of order.items) {
        // Check if we need a new page
        if (y > 700) {
          doc.addPage()
          y = 50
        }

        const itemName = `${item.productBrand} - ${item.productName}`
        const itemDetail = `${item.volumeMl}ml`

        doc
          .fontSize(10)
          .text(itemName, 55, y, { width: 220 })
          .fontSize(9)
          .fillColor(secondaryColor)
          .text(itemDetail, 55, y + 13, { width: 220 })
          .fillColor(primaryColor)
          .fontSize(10)
          .text(item.quantity.toString(), 280, y + 5, { width: 50, align: 'center' })
          .text(formatCurrency(item.unitPriceRON), 340, y + 5, { width: 80, align: 'right' })
          .text(formatCurrency(item.totalPriceRON), 430, y + 5, { width: 110, align: 'right' })

        // Row separator
        doc
          .moveTo(50, y + 30)
          .lineTo(545, y + 30)
          .strokeColor('#f0f0f0')
          .stroke()

        y += 35
      }

      // ========== Totals ==========
      y += 20

      // Totals background
      doc
        .rect(340, y, 205, order.discountRON.toNumber() > 0 ? 90 : 65)
        .fill(lightGray)

      // Subtotal
      doc
        .fontSize(10)
        .font('Roboto')
        .fillColor(secondaryColor)
        .text(t.subtotal, 350, y + 10)
        .fillColor(primaryColor)
        .text(formatCurrency(order.subtotalRON), 430, y + 10, { width: 110, align: 'right' })

      let totalsY = y + 28

      // Discount (if applicable)
      if (order.discountRON.toNumber() > 0) {
        doc
          .fillColor('#16a34a')
          .text(`${t.discount} (${order.discountPercent}%)`, 350, totalsY)
          .text(`-${formatCurrency(order.discountRON)}`, 430, totalsY, { width: 110, align: 'right' })
        totalsY += 18
      }

      // Total line
      doc
        .moveTo(340, totalsY + 5)
        .lineTo(545, totalsY + 5)
        .strokeColor('#e0e0e0')
        .stroke()

      // Total
      doc
        .fontSize(12)
        .font('Roboto-Bold')
        .fillColor(primaryColor)
        .text(t.total, 350, totalsY + 15)
        .text(formatCurrency(order.totalRON), 430, totalsY + 15, { width: 110, align: 'right' })

      // Paid amount in EUR (if available)
      if (order.paidAmountEUR) {
        y = totalsY + 50
        doc
          .fontSize(10)
          .font('Roboto')
          .fillColor(secondaryColor)
          .text(`${t.paidAmount}: ${order.paidAmountEUR.toNumber().toFixed(2)} EUR`, 350, y, { align: 'right', width: 195 })
      }

      // ========== Payment Info ==========
      y = totalsY + 80
      doc
        .fontSize(10)
        .font('Roboto-Bold')
        .fillColor(secondaryColor)
        .text(t.paymentMethod, 50, y)
        .font('Roboto')
        .fillColor(primaryColor)
        .text(t.creditCard, 50, y + 15)

      // ========== Footer ==========
      // Position footer at a safe distance from bottom (A4 height is 842pt)
      const footerY = 720

      doc
        .moveTo(50, footerY)
        .lineTo(545, footerY)
        .strokeColor('#e0e0e0')
        .stroke()

      // Draw all footer text elements with explicit Y coordinates
      // Using save/restore to prevent cursor movement from affecting subsequent elements
      doc.save()
      doc
        .fontSize(11)
        .font('Roboto-Bold')
        .fillColor(primaryColor)
        .text(t.thankYou, 50, footerY + 12, { align: 'center', width: 495 })
      doc.restore()

      doc.save()
      doc
        .fontSize(9)
        .font('Roboto')
        .fillColor(secondaryColor)
        .text(t.questions, 50, footerY + 30, { align: 'center', width: 495 })
      doc.restore()

      // Page number
      doc.save()
      doc
        .fontSize(8)
        .fillColor(secondaryColor)
        .text(`${t.page} 1 ${t.of} 1`, 50, footerY + 48, { align: 'center', width: 495 })
      doc.restore()

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
