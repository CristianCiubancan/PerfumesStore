import { stripe } from '../lib/stripe'
import { config } from '../config'
import { markOrderPaid, markOrderCancelled } from './order.service'
import { logger } from '../lib/logger'
import { AppError } from '../middleware/errorHandler'
import { sendOrderConfirmationEmail, normalizeLocale } from './email'
import { prisma } from '../lib/prisma'
import { withRetryResult } from '../lib/retry'
import { recordOrder } from '../lib/metrics'
import Stripe from 'stripe'

export async function handleStripeWebhook(
  payload: Buffer,
  signature: string
): Promise<{ received: true }> {
  // In development without webhook secret, skip signature verification
  if (!config.STRIPE_WEBHOOK_SECRET) {
    logger.warn(
      'STRIPE_WEBHOOK_SECRET not set - skipping signature verification (development only)',
      'StripeWebhook'
    )
    const event = JSON.parse(payload.toString()) as Stripe.Event
    await processWebhookEvent(event)
    return { received: true }
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    logger.error(
      `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'StripeWebhook'
    )
    throw new AppError('Webhook signature verification failed', 400, 'INVALID_SIGNATURE')
  }

  await processWebhookEvent(event)
  return { received: true }
}

async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  logger.info(`Processing webhook event: ${event.type}`, 'StripeWebhook')

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid') {
        const order = await markOrderPaid(
          session.id,
          session.payment_intent as string,
          session.amount_total || 0
        )
        logger.info(
          `Payment completed for session: ${session.id}`,
          'StripeWebhook'
        )

        // Record order metrics
        if (order) {
          // totalRON is stored in database as Decimal, convert to cents
          const valueInCents = Math.round(parseFloat(order.totalRON.toString()) * 100)
          recordOrder('PAID', 'stripe', valueInCents, 'RON')
        }

        // Send order confirmation email with invoice (fire and forget)
        if (order) {
          // Get customer email (from user or guest)
          let customerEmail: string | null = null
          if (order.userId) {
            const user = await prisma.user.findUnique({
              where: { id: order.userId },
              select: { email: true },
            })
            customerEmail = user?.email || null
          } else {
            customerEmail = order.guestEmail
          }

          if (customerEmail) {
            const locale = normalizeLocale(order.orderLocale)
            // Send email with retry (fire and forget, but with resilience)
            withRetryResult(
              async () => {
                const result = await sendOrderConfirmationEmail(order, customerEmail, locale)
                if (!result.success) {
                  throw new Error(result.error || 'Email send failed')
                }
                return result
              },
              {
                maxAttempts: 3,
                baseDelayMs: 2000,
                maxDelayMs: 30000,
                context: `OrderConfirmationEmail:${order.orderNumber}`,
              }
            ).then((result) => {
              if (!result.success) {
                logger.error(
                  `Failed to send order confirmation email for ${order.orderNumber} after ${result.attempts} attempts: ${result.error}`,
                  'StripeWebhook'
                )
              }
            })
          } else {
            logger.warn(
              `No email address found for order ${order.orderNumber}`,
              'StripeWebhook'
            )
          }
        }
      }
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      await markOrderCancelled(session.id)
      logger.info(`Session expired: ${session.id}`, 'StripeWebhook')
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      logger.warn(
        `Payment failed for intent: ${paymentIntent.id}`,
        'StripeWebhook'
      )
      break
    }

    default:
      logger.info(`Unhandled event type: ${event.type}`, 'StripeWebhook')
  }
}
