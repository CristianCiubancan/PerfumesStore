import { AppError } from '../../middleware/errorHandler'
import { handleStripeWebhook } from '../stripe-webhook.service'
import * as orderService from '../order.service'
import { stripe } from '../../lib/stripe'
import { config } from '../../config'

// Mock Stripe
jest.mock('../../lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}))

// Mock order service
jest.mock('../order.service', () => ({
  markOrderPaid: jest.fn(),
  markOrderCancelled: jest.fn(),
}))

// Mock config
jest.mock('../../config', () => ({
  config: {
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
  },
}))

describe('StripeWebhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleStripeWebhook', () => {
    describe('checkout.session.completed event', () => {
      const mockCompletedEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            payment_status: 'paid',
            payment_intent: 'pi_123',
            amount_total: 32640,
          },
        },
      }

      it('should mark order as paid when payment is completed', async () => {
        ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockCompletedEvent)
        ;(orderService.markOrderPaid as jest.Mock).mockResolvedValue({
          id: 1,
          status: 'PAID',
        })

        const result = await handleStripeWebhook(
          Buffer.from(JSON.stringify(mockCompletedEvent)),
          'sig_test'
        )

        expect(orderService.markOrderPaid).toHaveBeenCalledWith(
          'cs_test_123',
          'pi_123',
          32640
        )
        expect(result).toEqual({ received: true })
      })

      it('should not mark order as paid if payment_status is not paid', async () => {
        const unpaidEvent = {
          ...mockCompletedEvent,
          data: {
            object: {
              ...mockCompletedEvent.data.object,
              payment_status: 'unpaid',
            },
          },
        }
        ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(unpaidEvent)

        await handleStripeWebhook(
          Buffer.from(JSON.stringify(unpaidEvent)),
          'sig_test'
        )

        expect(orderService.markOrderPaid).not.toHaveBeenCalled()
      })

      it('should handle null amount_total', async () => {
        const eventWithNullAmount = {
          ...mockCompletedEvent,
          data: {
            object: {
              ...mockCompletedEvent.data.object,
              amount_total: null,
            },
          },
        }
        ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(eventWithNullAmount)

        await handleStripeWebhook(
          Buffer.from(JSON.stringify(eventWithNullAmount)),
          'sig_test'
        )

        expect(orderService.markOrderPaid).toHaveBeenCalledWith(
          'cs_test_123',
          'pi_123',
          0
        )
      })
    })

    describe('checkout.session.expired event', () => {
      const mockExpiredEvent = {
        type: 'checkout.session.expired',
        data: {
          object: {
            id: 'cs_test_expired',
          },
        },
      }

      it('should mark order as cancelled when session expires', async () => {
        ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockExpiredEvent)
        ;(orderService.markOrderCancelled as jest.Mock).mockResolvedValue({
          id: 1,
          status: 'CANCELLED',
        })

        const result = await handleStripeWebhook(
          Buffer.from(JSON.stringify(mockExpiredEvent)),
          'sig_test'
        )

        expect(orderService.markOrderCancelled).toHaveBeenCalledWith('cs_test_expired')
        expect(result).toEqual({ received: true })
      })
    })

    describe('payment_intent.payment_failed event', () => {
      const mockFailedEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failed',
          },
        },
      }

      it('should log warning for failed payment', async () => {
        ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockFailedEvent)

        const result = await handleStripeWebhook(
          Buffer.from(JSON.stringify(mockFailedEvent)),
          'sig_test'
        )

        expect(result).toEqual({ received: true })
        // Payment failed events are logged but don't affect order status yet
        expect(orderService.markOrderPaid).not.toHaveBeenCalled()
        expect(orderService.markOrderCancelled).not.toHaveBeenCalled()
      })
    })

    describe('unhandled event types', () => {
      it('should handle unrecognized event types gracefully', async () => {
        const unknownEvent = {
          type: 'unknown.event.type',
          data: {
            object: {},
          },
        }
        ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(unknownEvent)

        const result = await handleStripeWebhook(
          Buffer.from(JSON.stringify(unknownEvent)),
          'sig_test'
        )

        expect(result).toEqual({ received: true })
      })
    })

    describe('signature verification', () => {
      it('should throw error for invalid signature', async () => {
        ;(stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
          throw new Error('Invalid signature')
        })

        await expect(
          handleStripeWebhook(Buffer.from('{}'), 'invalid_sig')
        ).rejects.toThrow(AppError)
        await expect(
          handleStripeWebhook(Buffer.from('{}'), 'invalid_sig')
        ).rejects.toMatchObject({
          statusCode: 400,
          code: 'INVALID_SIGNATURE',
        })
      })

      it('should handle non-Error exceptions during signature verification', async () => {
        ;(stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
          throw 'string error' // Non-Error object
        })

        await expect(
          handleStripeWebhook(Buffer.from('{}'), 'invalid_sig')
        ).rejects.toThrow(AppError)
        await expect(
          handleStripeWebhook(Buffer.from('{}'), 'invalid_sig')
        ).rejects.toMatchObject({
          statusCode: 400,
          code: 'INVALID_SIGNATURE',
        })
      })

      it('should use signature from header', async () => {
        const event = { type: 'test.event', data: { object: {} } }
        ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(event)

        await handleStripeWebhook(Buffer.from('payload'), 'test_signature')

        expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
          Buffer.from('payload'),
          'test_signature',
          'whsec_test_secret'
        )
      })
    })

    describe('development mode (no webhook secret)', () => {
      beforeEach(() => {
        // Temporarily modify config for this test
        ;(config as { STRIPE_WEBHOOK_SECRET: string }).STRIPE_WEBHOOK_SECRET = ''
      })

      afterEach(() => {
        // Restore config
        ;(config as { STRIPE_WEBHOOK_SECRET: string }).STRIPE_WEBHOOK_SECRET =
          'whsec_test_secret'
      })

      it('should skip signature verification in development', async () => {
        const event = {
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_dev',
              payment_status: 'paid',
              payment_intent: 'pi_dev',
              amount_total: 10000,
            },
          },
        }

        const result = await handleStripeWebhook(
          Buffer.from(JSON.stringify(event)),
          ''
        )

        expect(stripe.webhooks.constructEvent).not.toHaveBeenCalled()
        expect(orderService.markOrderPaid).toHaveBeenCalledWith(
          'cs_test_dev',
          'pi_dev',
          10000
        )
        expect(result).toEqual({ received: true })
      })
    })
  })
})
