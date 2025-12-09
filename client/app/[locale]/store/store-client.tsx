'use client'

// TODO: REFACTORING OPPORTUNITY (Code Quality)
// This component has grown to 346+ lines with multiple responsibilities:
// - Product fetching and filtering
// - Currency conversion logic
// - Pagination state management
// - Filter state synchronization
// - Mobile/desktop filter UI
// Consider splitting into:
// 1. useStoreProducts hook (data fetching, filtering, pagination)
// 2. useCurrencyConversion hook (price conversion logic)
// 3. Separate FilterSheet component (mobile filters)
// 4. Extract currency conversion utilities to lib/currency-helpers.ts
// This would improve maintainability and make the component easier to test.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import { ProductCard } from '@/components/store/product-card'
import { ProductCardSkeleton } from '@/components/store/product-card-skeleton'
import { ProductFilters } from '@/components/store/product-filters'
import { Pagination } from '@/components/store/pagination'
import { productsApi } from '@/lib/api/products'
import { Product } from '@/types'
import { useFilterParams, FilterValues } from '@/hooks/use-filter-params'
import { useFilterOptions } from '@/hooks/use-filter-options'
import { useCurrencyStore } from '@/store/currency'
import { PAGINATION, TIMING } from '@/lib/constants'

// UI Layout Constants
const UI_DIMENSIONS = {
  DESKTOP_BREAKPOINT: 1024, // Matches Tailwind's lg breakpoint
  CONTENT_MAX_WIDTH: 1280, // Maximum content width in pixels
  MIN_SIDE_PADDING: 16, // Minimum padding on sides
  SIDEBAR_WIDTH: 288, // 18rem in pixels (from Tailwind w-72)
  SIDEBAR_GAP: 32, // 2rem in pixels (gap-8)
  SCROLL_TOP: 0, // Scroll position for top of page
} as const

// Convert price from selected currency to RON for API filtering
// This reverses the conversion done in formatPrice/convertPrice
function convertToRON(
  price: number,
  currency: 'RON' | 'EUR' | 'GBP',
  exchangeRates: { EUR: number; GBP: number; feePercent: number } | null
): number {
  if (currency === 'RON' || !exchangeRates) {
    return price
  }
  // BNR rates are: 1 EUR = X RON, so to convert to RON, multiply by X
  const priceInAdjustedRON = price * exchangeRates[currency]

  // Remove the fee that was applied when displaying prices
  // (formatPrice applies: priceRON * feeMultiplier / rate, so we reverse it)
  const feeMultiplier = 1 + (exchangeRates.feePercent / 100)
  return priceInAdjustedRON / feeMultiplier
}

export function StorePageClient() {
  const t = useTranslations()
  const { filters, page, setFilters, setPage, resetFilters } = useFilterParams()
  const { currency, exchangeRates } = useCurrencyStore()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Filter options from API
  const { filterOptions, isLoadingOptions } = useFilterOptions()

  // Memoize API params to prevent unnecessary re-fetches
  const apiParams = useMemo(() => {
    const minPriceRON = filters.minPrice
      ? convertToRON(parseFloat(filters.minPrice), currency, exchangeRates)
      : undefined
    const maxPriceRON = filters.maxPrice
      ? convertToRON(parseFloat(filters.maxPrice), currency, exchangeRates)
      : undefined

    return {
      page,
      limit: PAGINATION.PRODUCTS_PER_PAGE,
      search: filters.search || undefined,
      gender: filters.gender || undefined,
      concentration: filters.concentration || undefined,
      minPrice: minPriceRON,
      maxPrice: maxPriceRON,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      fragranceFamilyId: filters.fragranceFamilyId ?? undefined,
      longevityId: filters.longevityId ?? undefined,
      sillageId: filters.sillageId ?? undefined,
      seasonIds: filters.seasonIds.length > 0 ? filters.seasonIds : undefined,
      seasonMatchMode: filters.seasonMatchMode,
      occasionIds: filters.occasionIds.length > 0 ? filters.occasionIds : undefined,
      occasionMatchMode: filters.occasionMatchMode,
      minRating: filters.minRating ? parseFloat(filters.minRating) : undefined,
      maxRating: filters.maxRating ? parseFloat(filters.maxRating) : undefined,
    }
  }, [
    page,
    filters.search,
    filters.gender,
    filters.concentration,
    filters.minPrice,
    filters.maxPrice,
    filters.sortBy,
    filters.sortOrder,
    filters.fragranceFamilyId,
    filters.longevityId,
    filters.sillageId,
    filters.seasonIds,
    filters.seasonMatchMode,
    filters.occasionIds,
    filters.occasionMatchMode,
    filters.minRating,
    filters.maxRating,
    currency,
    exchangeRates,
  ])

  // Ref to track the current AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)
  // Track if this is the initial load (don't scroll on first load)
  const isInitialLoadRef = useRef(true)

  // Scroll to top of products - on desktop scroll the container, on mobile scroll the page
  const scrollToTop = useCallback(() => {
    const productsContainer = document.getElementById('products-scroll-container')
    if (productsContainer && window.innerWidth >= UI_DIMENSIONS.DESKTOP_BREAKPOINT) {
      productsContainer.scrollTo({ top: UI_DIMENSIONS.SCROLL_TOP, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: UI_DIMENSIONS.SCROLL_TOP, behavior: 'smooth' })
    }
  }, [])

  const fetchProducts = useCallback(async (signal?: AbortSignal, shouldScroll = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await productsApi.list(apiParams, { signal })

      setProducts(response.products)
      setPagination({
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total,
      })

      // Scroll to top after successful fetch (but not on initial load)
      if (shouldScroll) {
        scrollToTop()
      }
    } catch (err: unknown) {
      // Don't set error state for aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(t('store.errorLoading'))
    } finally {
      // Only clear loading if request wasn't aborted
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [apiParams, t, scrollToTop])

  // Debounced fetch when filters or page change
  useEffect(() => {
    const shouldScroll = !isInitialLoadRef.current

    const timeoutId = setTimeout(() => {
      // Abort any in-flight request before starting a new one
      abortControllerRef.current?.abort()

      const controller = new AbortController()
      abortControllerRef.current = controller

      fetchProducts(controller.signal, shouldScroll)

      // Mark initial load as complete after first fetch
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
      }
    }, TIMING.DEBOUNCE_SHORT_MS)

    return () => {
      clearTimeout(timeoutId)
      // Abort on cleanup (component unmount or deps change before debounce fires)
      abortControllerRef.current?.abort()
    }
  }, [fetchProducts])

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    resetFilters()
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const FilterSidebar = (
    <ProductFilters
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onReset={handleResetFilters}
      filterOptions={filterOptions}
      isLoadingOptions={isLoadingOptions}
    />
  )

  // CSS-based side padding for centering content (1280px max) with 16px minimum
  // Using CSS max() avoids layout shift that occurred with JS-based calculation
  const sidePaddingCSS = `max(${UI_DIMENSIONS.MIN_SIDE_PADDING}px, calc((100vw - ${UI_DIMENSIONS.CONTENT_MAX_WIDTH}px) / 2))`

  // Aside needs width = sidePadding + sidebarWidth + gap
  const asideStyle = {
    width: `calc(${sidePaddingCSS} + ${UI_DIMENSIONS.SIDEBAR_WIDTH}px + ${UI_DIMENSIONS.SIDEBAR_GAP}px)`,
    paddingLeft: sidePaddingCSS,
  }

  const productsPanelStyle = {
    paddingRight: sidePaddingCSS,
  }

  // Shared content components for mobile and desktop
  const PageHeader = (
    <div className="pt-8 pb-4">
      <h1 className="text-3xl font-bold">{t('store.title')}</h1>
      <p className="text-muted-foreground mt-2">{t('store.subtitle')}</p>
    </div>
  )

  const ProductsContent = (
    <>
      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {t('store.resultsCount', { count: pagination.total })}
        </p>

        {/* Mobile Filter Button */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
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
            <div className="mt-6 pb-6">{FilterSidebar}</div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => fetchProducts()}
          >
            {t('store.retry')}
          </Button>
        </div>
      )}

      {/* Loading State - Skeleton grid to prevent layout shift */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg font-medium">{t('store.noProducts')}</p>
          <p className="text-muted-foreground mt-2">
            {t('store.noProductsDescription')}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleResetFilters}
          >
            {t('store.filters.clearAll')}
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index === 0} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 pb-6">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </>
  )

  return (
    <div className="fixed inset-0 top-14 overflow-hidden flex flex-col lg:flex-row bg-background">
      {/* Sidebar - Desktop only */}
      <aside
        className="hidden lg:block flex-shrink-0 overflow-y-auto"
        style={asideStyle}
      >
        <div className="w-72 pt-8 pb-6">
          {FilterSidebar}
        </div>
      </aside>

      {/* Main Content - Scrollable */}
      <div
        id="products-scroll-container"
        className="flex-1 overflow-y-auto px-4 lg:px-0"
        style={productsPanelStyle}
      >
        <div className="lg:pl-4" style={{ maxWidth: 960 }}>
          {PageHeader}
          {ProductsContent}
        </div>
      </div>
    </div>
  )
}
