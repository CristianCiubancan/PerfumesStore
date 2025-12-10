import { stripe } from '../lib/stripe'
import { config } from '../config'
import { markOrderPaid, markOrderCancelled } from './order.service'
import { logger } from '../lib/logger'
import { AppError } from '../middleware/errorHandler'
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
        await markOrderPaid(
          session.id,
          session.payment_intent as string,
          session.amount_total || 0
        )
        logger.info(
          `Payment completed for session: ${session.id}`,
          'StripeWebhook'
        )
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
