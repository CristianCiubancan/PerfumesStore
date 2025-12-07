'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { ArrowLeft, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { AddToCartButton } from '@/components/store/add-to-cart-button'
import { QuantitySelector } from '@/components/ui/quantity-selector'
import { productsApi } from '@/lib/api/products'
import { useFormattedPrice } from '@/lib/currency'
import { Product } from '@/types'
import { Link } from '@/i18n/routing'
import { getFullImageUrl } from '@/lib/api/upload'

interface Props {
  slug: string
}

export function ProductDetailClient({ slug }: Props) {
  const t = useTranslations()
  const formatPrice = useFormattedPrice()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const abortController = new AbortController()

    const fetchProduct = async () => {
      if (!slug) {
        setError(t('productDetail.notFound'))
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await productsApi.getBySlug(slug, { signal: abortController.signal })
        if (!abortController.signal.aborted) {
          setProduct(data)
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          // Check if the error name is AbortError to avoid setting state on intentional cancellation
          if (err instanceof Error && err.name === 'AbortError') {
            return
          }
          setError(t('productDetail.notFound'))
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchProduct()

    return () => {
      abortController.abort()
    }
  }, [slug, t])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-lg font-medium text-destructive">
              {error || t('productDetail.notFound')}
            </p>
            <Link href="/store">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('productDetail.backToStore')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const rating = parseFloat(product.rating)
  const imageUrl = product.imageUrl ? getFullImageUrl(product.imageUrl) : null
  const isLocalImage = imageUrl?.includes('localhost:4000')
  const isOutOfStock = product.stock === 0

  return (
    <div className="flex-1">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/store">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('productDetail.backToStore')}
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized={isLocalImage}
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <span className="text-8xl">🧴</span>
              </div>
            )}
            {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  {t('productDetail.outOfStock')}
                </Badge>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-4">
              <p className="text-muted-foreground">{product.brand}</p>
              <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
            </div>

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{rating.toFixed(1)}</span>
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary">
                {t(`product.concentration.${product.concentration}`)}
              </Badge>
              <Badge variant="outline">
                {t(`product.gender.${product.gender}`)}
              </Badge>
              <Badge variant="outline">
                {t(`product.fragranceFamily.${product.fragranceFamily.name}`)}
              </Badge>
            </div>

            {/* Price */}
            <div className="mb-6">
              <p className="text-3xl font-bold">{formatPrice(product.priceRON)}</p>
              <p className="text-sm text-muted-foreground">{product.volumeMl}ml</p>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('productDetail.inStock', { count: product.stock })}
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  {t('productDetail.outOfStock')}
                </p>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4 mb-8">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('productDetail.quantity')}
                  </label>
                  <QuantitySelector
                    value={quantity}
                    min={1}
                    max={product.stock}
                    onChange={setQuantity}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block invisible">
                    {t('productDetail.quantity')}
                  </label>
                  <AddToCartButton
                    product={product}
                    quantity={quantity}
                    variant="full"
                    showQuantityInCart={false}
                  />
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h2 className="font-semibold mb-2">{t('productDetail.description')}</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {/* Fragrance Notes */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-1.5">{t('productDetail.topNotes')}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.topNotes.join(' · ')}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1.5">{t('productDetail.heartNotes')}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.heartNotes.join(' · ')}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1.5">{t('productDetail.baseNotes')}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.baseNotes.join(' · ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Characteristics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('productDetail.longevity')}</p>
                <p className="font-medium">{t(`product.longevity.${product.longevity.name}`)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('productDetail.sillage')}</p>
                <p className="font-medium">{t(`product.sillage.${product.sillage.name}`)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('productDetail.seasons')}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.seasons.map((season) => (
                    <Badge key={season.id} variant="secondary" className="text-xs">
                      {t(`product.season.${season.name}`)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('productDetail.occasions')}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.occasions.map((occasion) => (
                    <Badge key={occasion.id} variant="secondary" className="text-xs">
                      {t(`product.occasion.${occasion.name}`)}
                    </Badge>
                  ))}
                </div>
              </div>
              {product.perfumer && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('productDetail.perfumer')}</p>
                  <p className="font-medium">{product.perfumer}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">{t('productDetail.launchYear')}</p>
                <p className="font-medium">{product.launchYear}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
