'use client'

import { memo } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Product } from '@/types'
import { useFormattedPrice } from '@/lib/currency'
import { AddToCartButton } from '@/components/store/add-to-cart-button'
import { Link } from '@/i18n/routing'
import { getFullImageUrl } from '@/lib/api/upload'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export const ProductCard = memo(function ProductCard({ product, priority = false }: ProductCardProps) {
  const t = useTranslations('product')
  const formatPrice = useFormattedPrice()

  const rating = parseFloat(product.rating)

  const imageUrl = product.imageUrl ? getFullImageUrl(product.imageUrl) : null
  // FE-017: Use URL parsing instead of string matching to check if local backend image
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

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized={isLocalImage}
              priority={priority}
              loading={priority ? undefined : 'lazy'}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-4xl">🧴</span>
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Badge variant="destructive">{t('outOfStock')}</Badge>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/product/${product.slug}`}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted-foreground" title={product.brand}>{product.brand}</p>
              <h3 className="truncate font-medium" title={product.name}>
                {product.name}
              </h3>
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="mb-3 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {t(`concentration.${product.concentration}`)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {t(`gender.${product.gender}`)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <p className="font-semibold text-lg">
              {formatPrice(product.priceRON)}
            </p>
            <p className="text-xs text-muted-foreground">
              {product.volumeMl}ml
            </p>
          </div>
        </Link>

        <div className="mt-3">
          <AddToCartButton product={product} variant="full" />
        </div>
      </CardContent>
    </Card>
  )
})

// Display name for debugging
ProductCard.displayName = 'ProductCard'
