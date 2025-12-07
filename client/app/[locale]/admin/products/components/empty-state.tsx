'use client'

import { Package, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  hasActiveFilters: boolean
  onClearFilters: () => void
  onAddProduct: () => void
}

export function EmptyState({
  hasActiveFilters,
  onClearFilters,
  onAddProduct,
}: EmptyStateProps) {
  const t = useTranslations()

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">{t('admin.noProducts')}</h3>
      <p className="text-muted-foreground mb-4">
        {hasActiveFilters
          ? t('admin.products.noMatchingProducts')
          : t('admin.noProductsDescription')}
      </p>
      {hasActiveFilters ? (
        <Button variant="outline" onClick={onClearFilters}>
          {t('admin.products.clearFilters')}
        </Button>
      ) : (
        <Button onClick={onAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.addProduct')}
        </Button>
      )}
    </div>
  )
}
