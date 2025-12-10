'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Loader2, Package, ShoppingBag, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { checkoutApi } from '@/lib/api/checkout'
import { useFormattedPrice } from '@/lib/currency'
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

export function OrdersPageContent() {
  const t = useTranslations('orders')
  const locale = useLocale()
  const router = useRouter()
  const formatPrice = useFormattedPrice()
  const { isAuthenticated, isHydrating } = useAuthStore()

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isHydrating && !isAuthenticated) {
      router.push(`/${locale}/login`)
    }
  }, [isHydrating, isAuthenticated, router, locale])

  // Fetch orders
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
      .getUserOrders(page, 10)
      .then((data) => {
        if (!abortController.signal.aborted) {
          setOrders(data.orders)
          setTotalPages(data.pagination.totalPages)
        }
      })
      .catch(() => {
        // Error handled silently - empty orders shown
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => {
      abortController.abort()
    }
  }, [isHydrating, isAuthenticated, page])

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

  return (
    <div className="flex-1">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t('empty.title')}</h2>
              <p className="text-muted-foreground mb-6">{t('empty.description')}</p>
              <Button asChild>
                <Link href="/store">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {t('empty.startShopping')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:bg-muted/50 transition-colors">
                <Link href={`/orders/${order.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{order.orderNumber}</span>
                          <Badge className={STATUS_COLORS[order.status]} variant="secondary">
                            {t(`status.${order.status}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('orderDate')}:{' '}
                          {new Date(order.createdAt).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('items', { count: order.items.length })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(order.totalRON)}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('pagination.previous')}
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  {t('pagination.page', { current: page, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
