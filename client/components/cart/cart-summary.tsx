'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2, Tag, Sparkles, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { useFormattedPrice } from '@/lib/currency'

interface CartSummaryProps {
  totalItems: number
  totalPrice: number
  onClearCart: () => void
  discountPercent: number | null
}

export function CartSummary({ totalItems, totalPrice, onClearCart, discountPercent }: CartSummaryProps) {
  const t = useTranslations('cart')
  const formatPrice = useFormattedPrice()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleClearCart = () => {
    onClearCart()
    setIsDialogOpen(false)
  }

  const discountAmount = discountPercent ? totalPrice * (discountPercent / 100) : 0
  const finalPrice = totalPrice - discountAmount

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('summary.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {t('summary.items', { count: totalItems })}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('summary.subtotal')}</span>
          <span className={discountPercent ? 'line-through text-muted-foreground' : ''}>
            {formatPrice(totalPrice.toString())}
          </span>
        </div>

        {discountPercent && (
          <>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Tag className="h-3.5 w-3.5" />
                {t('summary.discount', { percent: discountPercent })}
              </span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                -{formatPrice(discountAmount.toFixed(2))}
              </span>
            </div>

            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t('summary.youSave')} {formatPrice(discountAmount.toFixed(2))}!
                </span>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="flex justify-between">
          <span className="font-medium">{t('summary.total')}</span>
          <span className="font-bold text-lg">
            {formatPrice(finalPrice.toFixed(2))}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button className="w-full" size="lg" asChild>
          <Link href="/checkout">
            <CreditCard className="mr-2 h-4 w-4" />
            {t('summary.checkout')}
          </Link>
        </Button>
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('summary.clearCart')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('confirmClear.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirmClear.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('confirmClear.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearCart}>
                {t('confirmClear.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
