'use client'

import { useTranslations } from 'next-intl'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/routing'

export function CartEmpty() {
  const t = useTranslations('cart')

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-6 mb-6">
        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{t('empty.title')}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t('empty.description')}
      </p>
      <Link href="/store">
        <Button>{t('empty.continueShopping')}</Button>
      </Link>
    </div>
  )
}
