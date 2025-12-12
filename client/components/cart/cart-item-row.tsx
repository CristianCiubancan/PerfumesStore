'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuantitySelector } from '@/components/ui/quantity-selector'
import { CartItem } from '@/types'
import { useFormattedPrice, calculateLineTotal } from '@/lib/currency'
import { Link } from '@/i18n/routing'
import { getFullImageUrl } from '@/lib/api/upload'

interface CartItemRowProps {
  item: CartItem
  onRemove: (productId: number) => void
  onQuantityChange: (productId: number, quantity: number) => void
  discountPercent: number | null
}

export function CartItemRow({ item, onRemove, onQuantityChange, discountPercent }: CartItemRowProps) {
  const t = useTranslations('cart')
  const formatPrice = useFormattedPrice()

  const imageUrl = item.imageUrl ? getFullImageUrl(item.imageUrl) : null
  // Use URL parsing instead of string matching
  const isLocalImage = (() => {
    if (!imageUrl) return false
    try {
      const url = new URL(imageUrl)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      if (apiUrl) {
        const apiUrlParsed = new URL(apiUrl)
        return url.hostname === apiUrlParsed.hostname
      }
      return url.hostname === 'localhost'
    } catch {
      return false
    }
  })()
  const originalLineTotal = calculateLineTotal(item.priceRON, item.quantity)
  const discountAmount = discountPercent ? originalLineTotal * (discountPercent / 100) : 0
  const finalLineTotal = originalLineTotal - discountAmount

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      {/* Product Image */}
      <Link href={`/product/${item.slug}`} className="flex-shrink-0">
        <div className="relative h-24 w-24 bg-muted rounded-lg overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={isLocalImage}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-2xl">🧴</span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/product/${item.slug}`}>
          <p className="text-xs text-muted-foreground">{item.brand}</p>
          <h3 className="font-medium truncate">{item.name}</h3>
          <p className="text-sm text-muted-foreground">{item.volumeMl}ml</p>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2">
          <QuantitySelector
            value={item.quantity}
            min={1}
            max={item.stock}
            onChange={(qty) => onQuantityChange(item.productId, qty)}
            size="sm"
          />

          <div className="flex items-center justify-between sm:gap-4">
            {discountPercent ? (
              <div className="text-left sm:text-right">
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(originalLineTotal.toString())}
                </p>
                <p className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {formatPrice(finalLineTotal.toFixed(2))}
                </p>
              </div>
            ) : (
              <p className="font-semibold">
                {formatPrice(originalLineTotal.toString())}
              </p>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(item.productId)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{t('item.remove')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
