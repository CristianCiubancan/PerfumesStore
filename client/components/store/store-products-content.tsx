'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/store/product-card'
import { ProductCardSkeleton } from '@/components/store/product-card-skeleton'
import { Pagination } from '@/components/store/pagination'
import { Product } from '@/types'

interface StoreProductsContentProps {
  products: Product[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
  isLoading: boolean
  error: string | null
  currentPage: number
  onPageChange: (page: number) => void
  onRetry: () => void
  onResetFilters: () => void
}

export function StoreProductsContent({
  products,
  pagination,
  isLoading,
  error,
  currentPage,
  onPageChange,
  onRetry,
  onResetFilters,
}: StoreProductsContentProps) {
  const t = useTranslations()

  // Error State
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          {t('store.retry')}
        </Button>
      </div>
    )
  }

  // Loading State - Skeleton grid to prevent layout shift
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty State
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium">{t('store.noProducts')}</p>
        <p className="text-muted-foreground mt-2">
          {t('store.noProductsDescription')}
        </p>
        <Button variant="outline" className="mt-4" onClick={onResetFilters}>
          {t('store.filters.clearAll')}
        </Button>
      </div>
    )
  }

  // Products Grid with Pagination
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} priority={index === 0} />
        ))}
      </div>

      <div className="mt-8 pb-6">
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </>
  )
}
