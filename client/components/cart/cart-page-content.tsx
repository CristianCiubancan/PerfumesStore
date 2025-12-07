'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CartItemRow } from '@/components/cart/cart-item-row'
import { CartSummary } from '@/components/cart/cart-summary'
import { CartEmpty } from '@/components/cart/cart-empty'
import { useCartStore } from '@/store/cart'
import { promotionsApi } from '@/lib/api/promotions'
import { Promotion } from '@/types'

export function CartPageContent() {
  const t = useTranslations('cart')
  const { items, removeItem, updateQuantity, clearCart, getTotalItems, getTotalPrice } = useCartStore()

  // Hydration fix - only render cart items on client
  const [isHydrated, setIsHydrated] = useState(false)
  const [promotion, setPromotion] = useState<Promotion | null>(null)

  useEffect(() => {
    // Mark as hydrated first, then fetch async
    queueMicrotask(() => setIsHydrated(true))

    // Fetch active promotion
    promotionsApi.getActive()
      .then((data) => {
        setPromotion(data.promotion)
      })
      .catch((error) => {
        // Promotion fetch failed - cart will work without discount
        // This is a graceful degradation, not a critical failure
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch active promotion:', error)
        }
      })
  }, [])

  const handleRemoveItem = (productId: number) => {
    const item = items.find(i => i.productId === productId)
    removeItem(productId)
    if (item) {
      toast.success(t('toast.removed', { name: item.name }))
    }
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    const result = updateQuantity(productId, quantity)
    if (!result.success) {
      if (result.message === 'STOCK_EXCEEDED') {
        const item = items.find(i => i.productId === productId)
        toast.error(t('toast.stockExceeded', { stock: item?.stock || 0 }))
      }
    }
  }

  const handleClearCart = () => {
    clearCart()
    toast.success(t('toast.cleared'))
  }

  // Show empty state during hydration to avoid mismatch
  if (!isHydrated) {
    return (
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
          <CartEmpty />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
          <CartEmpty />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

        <div className="grid lg:grid-cols-3 gap-8 pb-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('summary.items', { count: getTotalItems() })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.map((item) => (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    onRemove={handleRemoveItem}
                    onQuantityChange={handleQuantityChange}
                    discountPercent={promotion?.discountPercent || null}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Cart Summary */}
          <div>
            <div className="lg:sticky lg:top-20">
              <CartSummary
                totalItems={getTotalItems()}
                totalPrice={getTotalPrice()}
                onClearCart={handleClearCart}
                discountPercent={promotion?.discountPercent || null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
