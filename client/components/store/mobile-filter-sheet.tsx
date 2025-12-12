'use client'

import { useTranslations } from 'next-intl'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ProductFilters, ProductFiltersProps } from '@/components/store/product-filters'

interface MobileFilterSheetProps extends ProductFiltersProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onReset,
  filterOptions,
  isLoadingOptions,
  filterCounts,
}: MobileFilterSheetProps) {
  const t = useTranslations()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <Filter className="mr-2 h-4 w-4" />
          {t('common.filter')}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] overflow-y-auto px-4">
        <SheetHeader>
          <SheetTitle>{t('store.filters.title')}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 pb-6">
          <ProductFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            onReset={onReset}
            filterOptions={filterOptions}
            isLoadingOptions={isLoadingOptions}
            filterCounts={filterCounts}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
