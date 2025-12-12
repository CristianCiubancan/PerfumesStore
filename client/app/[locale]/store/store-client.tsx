'use client'

/**
 * Store page client component
 * Refactored to use extracted hooks and components for better maintainability:
 * - useStoreProducts: Product fetching, filtering, pagination
 * - useFilterParams: URL-synced filter state
 * - useFilterOptions: Filter dropdown options
 * - useFilterCounts: Dynamic filter counts
 * - MobileFilterSheet: Mobile filter UI
 * - StoreProductsContent: Product grid with states
 */

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { ProductFilters } from '@/components/store/product-filters'
import { MobileFilterSheet } from '@/components/store/mobile-filter-sheet'
import { StoreProductsContent } from '@/components/store/store-products-content'
import { ScrollToTopButton } from '@/components/ui/scroll-to-top-button'
import { useFilterParams, FilterValues } from '@/hooks/use-filter-params'
import { useFilterOptions } from '@/hooks/use-filter-options'
import { useFilterCounts } from '@/hooks/use-filter-counts'
import { useStoreProducts } from '@/hooks/use-store-products'
import { useCurrencyStore } from '@/store/currency'

// UI Layout Constants
const UI_DIMENSIONS = {
  CONTENT_MAX_WIDTH: 1280,
  MIN_SIDE_PADDING: 16,
  SIDEBAR_WIDTH: 288,
  SIDEBAR_GAP: 32,
  SCROLL_TOP: 0,
} as const

export function StorePageClient() {
  const t = useTranslations()
  const { filters, page, setFilters, setPage, resetFilters } = useFilterParams()
  const { currency, exchangeRates } = useCurrencyStore()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Filter options from API
  const { filterOptions, isLoadingOptions } = useFilterOptions()

  // Filter counts for dynamic filtering
  const { filterCounts } = useFilterCounts(filters, {
    currency,
    exchangeRates,
  })

  // Scroll to top of products container
  const scrollToTop = useCallback(() => {
    const container = document.getElementById('products-scroll-container')
    if (container) {
      container.scrollTo({ top: UI_DIMENSIONS.SCROLL_TOP, behavior: 'smooth' })
    }
  }, [])

  // Products data with filtering and pagination
  const { products, pagination, isLoading, error, refetch } = useStoreProducts({
    filters,
    page,
    onScrollToTop: scrollToTop,
  })

  // Handler callbacks
  const handleFiltersChange = useCallback(
    (newFilters: FilterValues) => {
      setFilters(newFilters)
    },
    [setFilters]
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage)
    },
    [setPage]
  )

  // CSS-based side padding for centering content (1280px max) with 16px minimum
  const sidePaddingCSS = `max(${UI_DIMENSIONS.MIN_SIDE_PADDING}px, calc((100vw - ${UI_DIMENSIONS.CONTENT_MAX_WIDTH}px) / 2))`

  const asideStyle = {
    width: `calc(${sidePaddingCSS} + ${UI_DIMENSIONS.SIDEBAR_WIDTH}px + ${UI_DIMENSIONS.SIDEBAR_GAP}px)`,
    paddingLeft: sidePaddingCSS,
  }

  const productsPanelStyle = {
    paddingRight: sidePaddingCSS,
  }

  return (
    <div className="fixed inset-0 top-14 overflow-hidden flex flex-col lg:flex-row bg-background">
      {/* Sidebar - Desktop only */}
      <aside
        className="hidden lg:block flex-shrink-0 overflow-y-auto"
        style={asideStyle}
      >
        <div className="w-72 pt-8 pb-6">
          <ProductFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={resetFilters}
            filterOptions={filterOptions}
            isLoadingOptions={isLoadingOptions}
            filterCounts={filterCounts}
          />
        </div>
      </aside>

      {/* Main Content - Scrollable */}
      <div
        id="products-scroll-container"
        className="flex-1 overflow-y-auto px-4 lg:px-0"
        style={productsPanelStyle}
      >
        <div className="lg:pl-4" style={{ maxWidth: 960 }}>
          {/* Page Header */}
          <div className="pt-8 pb-4">
            <h1 className="text-3xl font-bold">{t('store.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('store.subtitle')}</p>
          </div>

          {/* Results Count and Mobile Filter Button */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {t('store.resultsCount', { count: pagination.total })}
            </p>

            <MobileFilterSheet
              open={mobileFiltersOpen}
              onOpenChange={setMobileFiltersOpen}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={resetFilters}
              filterOptions={filterOptions}
              isLoadingOptions={isLoadingOptions}
              filterCounts={filterCounts}
            />
          </div>

          {/* Products Content (grid, loading, error, empty states) */}
          <StoreProductsContent
            products={products}
            pagination={pagination}
            isLoading={isLoading}
            error={error}
            currentPage={page}
            onPageChange={handlePageChange}
            onRetry={refetch}
            onResetFilters={resetFilters}
          />
        </div>
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTopButton scrollContainerId="products-scroll-container" />
    </div>
  )
}
