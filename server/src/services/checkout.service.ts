import { stripe } from '../lib/stripe'
import { config } from '../config'
import { AppError } from '../middleware/errorHandler'
import { calculateOrder, createOrder } from './order.service'
import { CreateCheckoutSessionInput } from '../schemas/checkout'
import { logger } from '../lib/logger'

// Map our locales to Stripe supported locales
const STRIPE_LOCALE_MAP: Record<string, string> = {
  en: 'en',
  ro: 'ro',
  fr: 'fr',
  de: 'de',
  es: 'es',
}

interface CreateSessionParams {
  input: CreateCheckoutSessionInput
  userId?: number
}

export async function createCheckoutSession({ input, userId }: CreateSessionParams) {
  const { items, shippingAddress, guestEmail, locale } = input

  // Validate guest email for non-authenticated users
  if (!userId && !guestEmail) {
    throw new AppError('Email required for guest checkout', 400, 'EMAIL_REQUIRED')
  }

  // Calculate order totals and validate stock
  const calculation = await calculateOrder(items)

  // Build Stripe line items (in EUR cents)
  const lineItems = calculation.orderItems.map((item) => {
    // Apply discount to each item proportionally if there's a promotion
    let itemPriceRON = item.unitPriceRON.toNumber()
    if (calculation.discountPercent) {
      itemPriceRON = itemPriceRON * (1 - calculation.discountPercent / 100)
    }

    // Convert to EUR with fee: priceEUR = priceRON / eurRate * (1 + feePercent/100)
    const priceEURCents = Math.round(
      (itemPriceRON / calculation.exchangeRate) *
        (1 + calculation.feePercent / 100) *
        100
    )

    // Build full image URL if imageUrl is a relative path
    let images: string[] | undefined
    if (item.imageUrl) {
      const fullImageUrl = item.imageUrl.startsWith('http')
        ? item.imageUrl
        : `${config.BACKEND_URL}${item.imageUrl}`
      images = [fullImageUrl]
    }

    return {
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${item.productBrand} - ${item.productName}`,
          description: `${item.volumeMl}ml`,
          ...(images && { images }),
        },
        unit_amount: priceEURCents,
      },
      quantity: item.quantity,
    }
  })

  // Map locale
  const stripeLocale = locale ? STRIPE_LOCALE_MAP[locale] || 'auto' : 'auto'

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    customer_email: userId ? undefined : guestEmail,
    locale: stripeLocale as 'auto' | 'en' | 'ro' | 'fr' | 'de' | 'es',
    success_url: `${config.CLIENT_URL}/${locale || 'en'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.CLIENT_URL}/${locale || 'en'}/cart`,
    metadata: {
      userId: userId?.toString() || '',
      guestEmail: guestEmail || '',
    },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  })

  // Create pending order in database
  const { order } = await createOrder({
    userId,
    guestEmail,
    shippingAddress,
    items,
    stripeSessionId: session.id,
    locale,
  })

  logger.info(
    `Checkout session created: ${session.id} for order ${order.orderNumber}`,
    'CheckoutService'
  )

  return {
    sessionId: session.id,
    url: session.url,
    orderNumber: order.orderNumber,
  }
}
