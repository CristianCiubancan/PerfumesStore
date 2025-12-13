'use client'

import { usePlausible } from 'next-plausible'
import { useCallback } from 'react'

/**
 * Custom event types for e-commerce tracking.
 * These events are tracked in Plausible for analytics.
 */
export type AnalyticsEvent =
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_product'
  | 'search'
  | 'filter_products'
  | 'begin_checkout'
  | 'purchase'
  | 'sign_up'
  | 'login'
  | 'newsletter_signup'

interface EventProps {
  add_to_cart: { productId: number; productName: string; price: number; quantity: number }
  remove_from_cart: { productId: number; productName: string }
  view_product: { productId: number; productName: string; brand: string }
  search: { query: string; resultCount: number }
  filter_products: { filterType: string; filterValue: string }
  begin_checkout: { itemCount: number; totalValue: number }
  purchase: { orderId: string; totalValue: number; itemCount: number }
  sign_up: { method: 'email' }
  login: { method: 'email' }
  newsletter_signup: { source: string }
}

/**
 * Hook for tracking analytics events.
 * Uses Plausible for privacy-focused analytics.
 *
 * @example
 * const { trackEvent } = useAnalytics()
 *
 * // Track add to cart
 * trackEvent('add_to_cart', {
 *   productId: 1,
 *   productName: 'Perfume XYZ',
 *   price: 99.99,
 *   quantity: 1
 * })
 *
 * // Track search
 * trackEvent('search', { query: 'rose perfume', resultCount: 15 })
 */
export function useAnalytics() {
  const plausible = usePlausible()

  const trackEvent = useCallback(
    <E extends AnalyticsEvent>(event: E, props: EventProps[E]) => {
      // Only track if Plausible is configured
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
        plausible(event, { props: props as Record<string, unknown> })
      }
    },
    [plausible]
  )

  /**
   * Track page view with custom properties.
   * Note: Plausible tracks page views automatically, but this can be used
   * for SPAs or custom page view tracking.
   */
  const trackPageView = useCallback(
    (url?: string) => {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
        plausible('pageview', { u: url || window.location.href })
      }
    },
    [plausible]
  )

  return {
    trackEvent,
    trackPageView,
  }
}

/**
 * Standalone function for tracking events outside of React components.
 * Uses the window.plausible function directly.
 */
export function trackAnalyticsEvent<E extends AnalyticsEvent>(
  event: E,
  props: EventProps[E]
) {
  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN &&
    'plausible' in window
  ) {
    ;(window as unknown as { plausible: (event: string, options?: { props: Record<string, unknown> }) => void }).plausible(event, { props: props as Record<string, unknown> })
  }
}
