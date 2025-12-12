import { config } from '../../../config'
import { Locale, getTranslations } from './translations'
import {
  colors,
  spacing,
  typography,
  styles,
  baseLayout,
  formatCurrency,
  formatDate,
  interpolate,
  renderButton,
  renderSection,
  renderAlert,
  renderDivider,
  renderBadge,
  renderTwoColumns,
  renderInfoRow,
} from './base'
import type { Order, OrderItem } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

// ============================================================================
// Types
// ============================================================================

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

export interface OrderConfirmationData {
  order: OrderWithItems
}

// ============================================================================
// Template Metadata
// ============================================================================

export const metadata = {
  id: 'order-confirmation',
  name: 'Order Confirmation',
  description: 'Sent to customers after successful payment',
  category: 'transactional',
  variables: ['order'],
}

// ============================================================================
// Template Render Functions
// ============================================================================

/**
 * Generate order confirmation email
 */
export function render(
  data: OrderConfirmationData,
  locale: Locale
): { subject: string; html: string; text: string } {
  const { order } = data
  const t = getTranslations(locale)

  const subject = interpolate(t.orderConfirmation.subject, { orderNumber: order.orderNumber })

  const html = baseLayout(renderHtml(order, locale, t), {
    locale,
    previewText: `${t.orderConfirmation.title} - ${order.orderNumber}`,
  })

  const text = renderText(order, locale, t)

  return { subject, html, text }
}

/**
 * Render HTML content
 */
function renderHtml(
  order: OrderWithItems,
  locale: Locale,
  t: ReturnType<typeof getTranslations>
): string {
  const greeting = interpolate(t.orderConfirmation.greeting, { name: order.customerName })
  const hasDiscount = order.discountRON.toNumber() > 0

  return `
    <!-- Success Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: ${spacing.lg};">
      <tr>
        <td align="center">
          ${renderBadge('Order Confirmed', 'success')}
        </td>
      </tr>
    </table>

    <!-- Title -->
    <h1 style="${styles.title}; text-align: center;">${t.orderConfirmation.title}</h1>
    <p style="${styles.subtitle}; text-align: center;">
      ${greeting.replace(',', '')}
    </p>

    <!-- Thank you message -->
    <p style="${styles.paragraph}; text-align: center;">
      ${t.orderConfirmation.thankYou}
    </p>

    ${renderDivider('gold')}

    <!-- Order Details Card -->
    <div style="${styles.cardAccent}">
      ${renderTwoColumns(
        renderInfoRow(t.orderConfirmation.orderNumber, order.orderNumber),
        renderInfoRow(t.orderConfirmation.orderDate, formatDate(order.createdAt, locale))
      )}
    </div>

    <!-- Shipping Address -->
    ${renderSection(t.orderConfirmation.shippingAddress, `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="${styles.address}">
            <strong style="color: ${colors.gray900};">${order.customerName}</strong><br>
            ${order.shippingAddressLine1}<br>
            ${order.shippingAddressLine2 ? `${order.shippingAddressLine2}<br>` : ''}
            ${order.shippingCity}${order.shippingState ? `, ${order.shippingState}` : ''}<br>
            ${order.shippingPostalCode}<br>
            <span style="color: ${colors.gray500};">${order.shippingCountry}</span>
          </td>
        </tr>
      </table>
    `)}

    <!-- Order Items -->
    ${renderSection(t.orderConfirmation.orderSummary, renderOrderTable(order, locale, t, hasDiscount))}

    <!-- Invoice Notice -->
    ${renderAlert(t.orderConfirmation.invoiceAttached, 'info')}

    <!-- CTA Button -->
    ${renderButton(t.common.viewOrder, `${config.CLIENT_URL}/${locale}/orders`, 'gold')}

    ${renderDivider()}

    <!-- Questions -->
    <p style="${styles.textMuted}; text-align: center;">
      ${t.orderConfirmation.questions}
    </p>

    <!-- Footer message -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: ${spacing.xl};">
      <tr>
        <td align="center">
          <p style="${styles.fontSerif}; font-size: ${typography.fontSizeLg}; color: ${colors.gray800}; margin: 0;">
            ${t.orderConfirmation.footer}
          </p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Render order items table
 */
function renderOrderTable(
  order: OrderWithItems,
  locale: Locale,
  t: ReturnType<typeof getTranslations>,
  hasDiscount: boolean
): string {
  const itemsHtml = order.items.map((item, index) => `
    <tr style="${index === 0 ? '' : `border-top: 1px solid ${colors.gray100};`}">
      <td style="${styles.tableCell}; padding-top: ${spacing.md}; padding-bottom: ${spacing.md};">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin: 0 0 ${spacing.xs} 0; font-weight: ${typography.fontWeightSemibold}; color: ${colors.gray900}; font-size: ${typography.fontSizeBase};">
                ${item.productBrand}
              </p>
              <p style="margin: 0; color: ${colors.gray500}; font-size: ${typography.fontSizeSm};">
                ${item.productName} &middot; ${item.volumeMl}ml
              </p>
            </td>
          </tr>
        </table>
      </td>
      <td style="${styles.tableCell}; text-align: center; vertical-align: middle;">
        <span style="${styles.badge}">&times;${item.quantity}</span>
      </td>
      <td style="${styles.tableCell}; text-align: right; vertical-align: middle;">
        <p style="margin: 0; font-weight: ${typography.fontWeightSemibold}; color: ${colors.gray900};">
          ${formatCurrency(item.totalPriceRON, locale)}
        </p>
        ${item.quantity > 1 ? `
        <p style="margin: ${spacing.xs} 0 0 0; color: ${colors.gray500}; font-size: ${typography.fontSizeXs};">
          ${formatCurrency(item.unitPriceRON, locale)} each
        </p>
        ` : ''}
      </td>
    </tr>
  `).join('')

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="${styles.table}">
      <thead>
        <tr>
          <th style="${styles.tableHeader}">${t.orderConfirmation.product}</th>
          <th style="${styles.tableHeader}; text-align: center;">${t.orderConfirmation.quantity}</th>
          <th style="${styles.tableHeader}; text-align: right;">${t.orderConfirmation.total}</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: ${spacing.lg}; border-top: 2px solid ${colors.gray200}; padding-top: ${spacing.md};">
      <tr>
        <td style="font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeSm}; color: ${colors.gray500}; padding: ${spacing.sm} 0;">
          ${t.orderConfirmation.subtotal}
        </td>
        <td style="font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeBase}; color: ${colors.gray700}; text-align: right; padding: ${spacing.sm} 0;">
          ${formatCurrency(order.subtotalRON, locale)}
        </td>
      </tr>
      ${hasDiscount ? `
      <tr>
        <td style="font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeSm}; color: ${colors.success}; padding: ${spacing.sm} 0;">
          ${t.orderConfirmation.discount} (${order.discountPercent}%)
        </td>
        <td style="font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeBase}; color: ${colors.success}; text-align: right; padding: ${spacing.sm} 0;">
          -${formatCurrency(order.discountRON, locale)}
        </td>
      </tr>
      ` : ''}
      <tr>
        <td colspan="2" style="padding-top: ${spacing.sm};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, ${colors.gray900} 0%, ${colors.gray800} 100%); border-radius: 8px;">
            <tr>
              <td style="padding: ${spacing.md} ${spacing.lg};">
                <span style="${styles.totalRow}; color: ${colors.white};">${t.orderConfirmation.total}</span>
              </td>
              <td style="padding: ${spacing.md} ${spacing.lg}; text-align: right;">
                <span style="${styles.totalRow}; color: ${colors.white};">${formatCurrency(order.totalRON, locale)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${order.paidAmountEUR ? `
      <tr>
        <td style="font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeXs}; color: ${colors.gray400}; padding: ${spacing.md} 0 0 0;">
          ${t.orderConfirmation.paidAmount}
        </td>
        <td style="font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeXs}; color: ${colors.gray400}; text-align: right; padding: ${spacing.md} 0 0 0;">
          ${order.paidAmountEUR.toNumber().toFixed(2)} EUR
        </td>
      </tr>
      ` : ''}
    </table>
  `
}

/**
 * Render plain text version
 */
function renderText(
  order: OrderWithItems,
  locale: Locale,
  t: ReturnType<typeof getTranslations>
): string {
  const greeting = interpolate(t.orderConfirmation.greeting, { name: order.customerName })
  const hasDiscount = order.discountRON.toNumber() > 0

  const itemsText = order.items.map(item =>
    `  - ${item.productBrand} ${item.productName} (${item.volumeMl}ml) x${item.quantity} - ${formatCurrency(item.totalPriceRON, locale)}`
  ).join('\n')

  return `
═══════════════════════════════════════════════════
                 PERFUMES STORE
              Luxury Fragrances
═══════════════════════════════════════════════════

${t.orderConfirmation.title}

${greeting}

${t.orderConfirmation.thankYou}

───────────────────────────────────────────────────
ORDER DETAILS
───────────────────────────────────────────────────

${t.orderConfirmation.orderNumber}: ${order.orderNumber}
${t.orderConfirmation.orderDate}: ${formatDate(order.createdAt, locale)}

───────────────────────────────────────────────────
${t.orderConfirmation.shippingAddress}
───────────────────────────────────────────────────

${order.customerName}
${order.shippingAddressLine1}
${order.shippingAddressLine2 || ''}
${order.shippingCity}${order.shippingState ? `, ${order.shippingState}` : ''}
${order.shippingPostalCode}
${order.shippingCountry}

───────────────────────────────────────────────────
${t.orderConfirmation.orderSummary}
───────────────────────────────────────────────────

${itemsText}

───────────────────────────────────────────────────

${t.orderConfirmation.subtotal}: ${formatCurrency(order.subtotalRON, locale)}
${hasDiscount ? `${t.orderConfirmation.discount} (${order.discountPercent}%): -${formatCurrency(order.discountRON, locale)}` : ''}
${t.orderConfirmation.total}: ${formatCurrency(order.totalRON, locale)}
${order.paidAmountEUR ? `${t.orderConfirmation.paidAmount}: ${order.paidAmountEUR.toNumber().toFixed(2)} EUR` : ''}

═══════════════════════════════════════════════════

${t.orderConfirmation.invoiceAttached}

${t.orderConfirmation.questions}

${t.orderConfirmation.footer}

───────────────────────────────────────────────────
View your order: ${config.CLIENT_URL}/${locale}/orders
───────────────────────────────────────────────────
  `.trim()
}

/**
 * Get sample data for preview
 */
export function getSampleData(): OrderConfirmationData {
  const now = new Date()
  return {
    order: {
      id: 1,
      orderNumber: 'ORD-20241212-000001',
      userId: null,
      guestEmail: 'customer@example.com',
      customerName: 'John Doe',
      customerPhone: '+40 712 345 678',
      orderLocale: 'en',
      shippingAddressLine1: '123 Main Street',
      shippingAddressLine2: 'Apt 4B',
      shippingCity: 'Bucharest',
      shippingState: 'Sector 1',
      shippingPostalCode: '010101',
      shippingCountry: 'Romania',
      subtotalRON: new Decimal(850.00),
      discountRON: new Decimal(85.00),
      discountPercent: 10,
      totalRON: new Decimal(765.00),
      stripeSessionId: 'cs_test_xxx',
      stripePaymentIntentId: 'pi_test_xxx',
      paidAmountEUR: new Decimal(153.00),
      exchangeRateUsed: new Decimal(4.97),
      exchangeFeePercent: new Decimal(2.00),
      status: 'PAID',
      createdAt: now,
      updatedAt: now,
      paidAt: now,
      items: [
        {
          id: 1,
          orderId: 1,
          productId: 1,
          productName: 'Sauvage Eau de Parfum',
          productBrand: 'Dior',
          productSlug: 'dior-sauvage-edp',
          volumeMl: 100,
          imageUrl: '/uploads/products/dior-sauvage.jpg',
          quantity: 1,
          unitPriceRON: new Decimal(650.00),
          totalPriceRON: new Decimal(650.00),
          createdAt: now,
        },
        {
          id: 2,
          orderId: 1,
          productId: 2,
          productName: 'Bleu de Chanel',
          productBrand: 'Chanel',
          productSlug: 'chanel-bleu',
          volumeMl: 50,
          imageUrl: '/uploads/products/chanel-bleu.jpg',
          quantity: 2,
          unitPriceRON: new Decimal(100.00),
          totalPriceRON: new Decimal(200.00),
          createdAt: now,
        },
      ],
    } as OrderWithItems,
  }
}
