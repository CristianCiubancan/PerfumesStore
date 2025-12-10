'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Loader2, ArrowLeft, Package, MapPin, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/auth'
import { checkoutApi } from '@/lib/api/checkout'
import { useFormattedPrice } from '@/lib/currency'
import { getFullImageUrl } from '@/lib/api/upload'
import type { Order, OrderStatus } from '@/types'
import { Link } from '@/i18n/routing'

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  SHIPPED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

interface OrderDetailContentProps {
  orderId: number
}

export function OrderDetailContent({ orderId }: OrderDetailContentProps) {
  const t = useTranslations('orderDetail')
  const tOrders = useTranslations('orders')
  const locale = useLocale()
  const router = useRouter()
  const formatPrice = useFormattedPrice()
  const { isAuthenticated, isHydrating } = useAuthStore()

  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isHydrating && !isAuthenticated) {
      router.push(`/${locale}/login`)
    }
  }, [isHydrating, isAuthenticated, router, locale])

  // Fetch order
  useEffect(() => {
    if (isHydrating || !isAuthenticated) return

    const abortController = new AbortController()

    // Start loading asynchronously to avoid synchronous setState in effect
    queueMicrotask(() => {
      if (!abortController.signal.aborted) {
        setIsLoading(true)
      }
    })

    checkoutApi
      .getOrder(orderId)
      .then((data) => {
        if (!abortController.signal.aborted) {
          setOrder(data)
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
  }, [isHydrating, isAuthenticated, orderId])

  if (isHydrating) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

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
            <Link href="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToOrders')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToOrders')}
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {t('orderNumber', { number: order.orderNumber })}
            </h1>
            <p className="text-muted-foreground">
              {t('placedOn')}{' '}
              {new Date(order.createdAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <Badge className={STATUS_COLORS[order.status]} variant="secondary">
            {tOrders(`status.${order.status}`)}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Items */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('orderItems')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      {item.imageUrl && (
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic external URLs from order history */}
                          <img
                            src={getFullImageUrl(item.imageUrl)}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/product/${item.productSlug}`}
                          className="font-medium hover:underline"
                        >
                          {item.productBrand} - {item.productName}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {item.volumeMl}ml &times; {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.totalPriceRON)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.unitPriceRON)} {t('each')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('shippingAddress')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.customerName}</p>
                <p>{order.shippingAddressLine1}</p>
                {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
                <p>
                  {order.shippingCity}
                  {order.shippingState && `, ${order.shippingState}`}{' '}
                  {order.shippingPostalCode}
                </p>
                <p>{order.shippingCountry}</p>
                {order.customerPhone && (
                  <p className="text-muted-foreground mt-2">{order.customerPhone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('summary.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('summary.subtotal')}</span>
                <span>{formatPrice(order.subtotalRON)}</span>
              </div>

              {order.discountPercent && parseFloat(order.discountRON) > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>{t('summary.discount')} ({order.discountPercent}%)</span>
                  <span>-{formatPrice(order.discountRON)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-medium">
                <span>{t('summary.total')}</span>
                <span className="text-lg">{formatPrice(order.totalRON)}</span>
              </div>

              {order.paidAmountEUR && (
                <div className="text-xs text-muted-foreground text-right">
                  {t('summary.paidInEUR', { amount: order.paidAmountEUR })}
                </div>
              )}

              {order.paidAt && (
                <div className="text-xs text-muted-foreground">
                  {t('summary.paidAt')}{' '}
                  {new Date(order.paidAt).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
