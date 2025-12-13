'use client'

import { useTranslations } from 'next-intl'
import { Loader2, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useFormattedPrice } from '@/lib/currency'
import type { CartItem, Promotion } from '@/types'

interface OrderSummaryProps {
  items: CartItem[]
  totalPrice: number
  promotion: Promotion | null
  isSubmitting: boolean
}

export function OrderSummary({
  items,
  totalPrice,
  promotion,
  isSubmitting,
}: OrderSummaryProps) {
  const t = useTranslations('checkout')
  const formatPrice = useFormattedPrice()

  const discountAmount = promotion?.discountPercent
    ? totalPrice * (promotion.discountPercent / 100)
    : 0
  const finalPrice = totalPrice - discountAmount

  return (
    <div className="lg:sticky lg:top-20">
      <Card>
        <CardHeader>
          <CardTitle>{t('summary.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {item.brand} - {item.name} x{item.quantity}
                </span>
                <span>
                  {formatPrice(
                    (parseFloat(item.priceRON) * item.quantity).toFixed(2)
                  )}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('summary.subtotal')}
            </span>
            <span>{formatPrice(totalPrice.toFixed(2))}</span>
          </div>

          {/* Discount */}
          {promotion && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>
                {t('summary.discount', {
                  percent: promotion.discountPercent,
                })}
              </span>
              <span>-{formatPrice(discountAmount.toFixed(2))}</span>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between">
            <span className="font-medium">{t('summary.total')}</span>
            <span className="font-bold text-lg">
              {formatPrice(finalPrice.toFixed(2))}
            </span>
          </div>

          {/* Payment Note */}
          <p className="text-xs text-muted-foreground text-center">
            {t('summary.paymentNote')}
          </p>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('processing')}
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {t('proceedToPayment')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
