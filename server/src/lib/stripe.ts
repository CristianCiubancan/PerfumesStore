import Stripe from 'stripe'
import { config } from '../config'
import { stripeCircuitBreaker } from './circuit-breaker'

const stripeClient = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
})

export const stripe = stripeClient

/**
 * Execute a Stripe API call with circuit breaker protection
 * Use this for all Stripe operations to prevent cascading failures
 */
export async function withStripeCircuitBreaker<T>(fn: () => Promise<T>): Promise<T> {
  return stripeCircuitBreaker.execute(fn)
}

/**
 * Get Stripe circuit breaker status
 */
export function getStripeCircuitStatus() {
  return stripeCircuitBreaker.getStats()
}
