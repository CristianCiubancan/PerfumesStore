'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Loader2, Package, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cart'
import { useAuthStore } from '@/store/auth'
import { checkoutApi } from '@/lib/api/checkout'
import { useFormattedPrice } from '@/lib/currency'
import type { Order } from '@/types'
import { Link } from '@/i18n/routing'

export function CheckoutSuccessContent() {
  const t = useTranslations('orderSuccess')
  const searchParams = useSearchParams()
  const formatPrice = useFormattedPrice()
  const clearCart = useCartStore((state) => state.clearCart)
  const { isAuthenticated, isHydrating } = useAuthStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Handle missing sessionId - derive from state without synchronous setState
    if (!sessionId) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setError('No session ID provided')
        setIsLoading(false)
      })
      return
    }

    const abortController = new AbortController()

    checkoutApi
      .getOrderBySession(sessionId)
      .then((data) => {
        if (!abortController.signal.aborted) {
          setOrder(data)
          // Clear cart on successful order
          clearCart()
        }
      })
      .catch((err) => {
        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load order')
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => {
      abortController.abort()
    }
  }, [sessionId, clearCart])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('error.title')}</h1>
          <p className="text-muted-foreground mb-6">{error || t('error.notFound')}</p>
          <Button asChild>
            <Link href="/store">
              <ShoppingBag className="mr-2 h-4 w-4" />
              {t('continueShopping')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('thankYou')}</p>
        </div>

        {/* Order Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('orderNumber')}: {order.orderNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Items */}
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.productBrand} - {item.productName} ({item.volumeMl}ml) x
                    {item.quantity}
                  </span>
                  <span>{formatPrice(item.totalPriceRON)}</span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Pricing Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span>{formatPrice(order.subtotalRON)}</span>
              </div>

              {order.discountPercent && parseFloat(order.discountRON) > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>{t('discount', { percent: order.discountPercent })}</span>
                  <span>-{formatPrice(order.discountRON)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-medium">
                <span>{t('total')}</span>
                <span className="text-lg">{formatPrice(order.totalRON)}</span>
              </div>

              {order.paidAmountEUR && (
                <div className="text-xs text-muted-foreground text-right">
                  {t('paidInEUR', { amount: order.paidAmountEUR })}
                </div>
              )}
            </div>

            <Separator />

            {/* Shipping Address */}
            <div>
              <h3 className="font-medium mb-2">{t('shippingAddress')}</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{order.customerName}</p>
                <p>{order.shippingAddressLine1}</p>
                {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
                <p>
                  {order.shippingCity}
                  {order.shippingState && `, ${order.shippingState}`}{' '}
                  {order.shippingPostalCode}
                </p>
                <p>{order.shippingCountry}</p>
                {order.customerPhone && <p>{order.customerPhone}</p>}
              </div>
            </div>

            {/* Email notification */}
            {order.guestEmail && (
              <p className="text-sm text-muted-foreground">
                {t('emailSent', { email: order.guestEmail })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/store">
              <ShoppingBag className="mr-2 h-4 w-4" />
              {t('continueShopping')}
            </Link>
          </Button>

          {!isHydrating && isAuthenticated && (
            <Button variant="outline" asChild>
              <Link href="/orders">
                <Package className="mr-2 h-4 w-4" />
                {t('viewOrders')}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
