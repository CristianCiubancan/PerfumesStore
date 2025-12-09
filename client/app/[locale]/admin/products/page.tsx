'use client'

// TODO: REFACTORING OPPORTUNITY (Code Quality)
// This component has grown to 377+ lines with multiple responsibilities:
// - State management for filters, pagination, sorting
// - Product CRUD operations
// - Bulk selection and actions
// - URL sync logic
// Consider splitting into:
// 1. useProductsManager hook (data fetching, state, mutations)
// 2. useProductFilters hook (filter state and URL sync)
// 3. useProductSelection hook (bulk selection logic)
// 4. Smaller sub-components for each section
// This would improve maintainability and testability.

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { productsApi, ListProductsParams } from '@/lib/api/products'
import { Product } from '@/types'
import { ApiError } from '@/lib/api/client'
import { ProductDialog } from '../components/product-dialog'
import { useDebounce } from '@/hooks/use-debounce'
import { PAGINATION, TIMING } from '@/lib/constants'
import { ProductFilters } from './components/product-filters'
import { ProductTable } from './components/product-table'
import { ProductPagination } from './components/product-pagination'
import { BulkActionBar } from './components/bulk-action-bar'
import { DeleteDialog, BulkDeleteDialog } from './components/delete-dialogs'
import { EmptyState } from './components/empty-state'

type SortField = 'name' | 'price' | 'stock' | 'newest'
type SortOrder = 'asc' | 'desc'
type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

export default function ProductsPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  }>({
    page: 1,
    limit: PAGINATION.ADMIN_DEFAULT_LIMIT,
    total: 0,
    totalPages: 0,
  })

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchQuery, TIMING.DEBOUNCE_SHORT_MS)
  const [concentration, setConcentration] = useState(searchParams.get('concentration') || 'all')
  const [gender, setGender] = useState(searchParams.get('gender') || 'all')
  const [stockStatus, setStockStatus] = useState<StockStatus>(
    (searchParams.get('stockStatus') as StockStatus) || 'all'
  )
  const [sortBy, setSortBy] = useState<SortField>(
    (searchParams.get('sortBy') as SortField) || 'newest'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sortOrder') as SortOrder) || 'desc'
  )

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const pageParam = searchParams.get('page') || '1'
  const limitParam = searchParams.get('limit') || String(PAGINATION.ADMIN_DEFAULT_LIMIT)

  const updateUrlParams = useCallback((params: Record<string, string | undefined>) => {
    const current = new URLSearchParams(window.location.search)
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        current.set(key, value)
      } else {
        current.delete(key)
      }
    })
    router.replace(`${pathname}?${current.toString()}`, { scroll: false })
  }, [pathname, router])

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: ListProductsParams = {
        page: parseInt(pageParam, 10),
        limit: parseInt(limitParam, 10),
        search: debouncedSearch || undefined,
        concentration: concentration !== 'all' ? concentration : undefined,
        gender: gender !== 'all' ? gender : undefined,
        stockStatus: stockStatus !== 'all' ? stockStatus : undefined,
        sortBy,
        sortOrder,
      }
      const response = await productsApi.list(params)
      setProducts(response.products)
      setPagination(response.pagination)
      setSelectedIds(new Set())
      setSelectAll(false)
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.failedToLoad'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [pageParam, limitParam, debouncedSearch, concentration, gender, stockStatus, sortBy, sortOrder, t])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const prevDebouncedSearch = useRef(debouncedSearch)
  useEffect(() => {
    if (prevDebouncedSearch.current === debouncedSearch) {
      return
    }
    prevDebouncedSearch.current = debouncedSearch
    updateUrlParams({ search: debouncedSearch, page: '1' })
  }, [debouncedSearch, updateUrlParams])

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'concentration':
        setConcentration(value)
        break
      case 'gender':
        setGender(value)
        break
      case 'stockStatus':
        setStockStatus(value as StockStatus)
        break
    }
    updateUrlParams({ [key]: value, page: '1' })
  }

  const handleSort = (field: SortField) => {
    let newOrder: SortOrder = 'asc'
    if (sortBy === field) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    }
    setSortBy(field)
    setSortOrder(newOrder)
    updateUrlParams({ sortBy: field, sortOrder: newOrder, page: '1' })
  }

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage.toString() })
  }

  const handlePageSizeChange = (newSize: string) => {
    updateUrlParams({ limit: newSize, page: '1' })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setSelectedIds(checked ? new Set(products.map((p) => p.id)) : new Set())
  }

  const handleSelectProduct = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
    setSelectAll(newSelected.size === products.length && products.length > 0)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    try {
      await productsApi.delete(productToDelete.id)
      toast.success(t('admin.deleteDialog.success'))
      loadProducts()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.deleteDialog.error'))
      }
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return

    setIsDeleting(true)
    try {
      const result = await productsApi.bulkDelete(Array.from(selectedIds))
      toast.success(t('admin.products.bulkDeleteSuccess', { count: result.deletedCount }))
      loadProducts()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.products.bulkDeleteError'))
      }
    } finally {
      setIsDeleting(false)
      setBulkDeleteDialogOpen(false)
    }
  }

  const handleDialogSuccess = () => {
    setDialogOpen(false)
    setEditingProduct(null)
    loadProducts()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setConcentration('all')
    setGender('all')
    setStockStatus('all')
    setSortBy('newest')
    setSortOrder('desc')
    router.replace(pathname, { scroll: false })
  }

  const hasActiveFilters = Boolean(searchQuery) || concentration !== 'all' || gender !== 'all' || stockStatus !== 'all'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">{t('admin.products.title')}</CardTitle>
                <CardDescription>
                  {t('admin.products.description', { total: pagination.total })}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.addProduct')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            concentration={concentration}
            gender={gender}
            stockStatus={stockStatus}
            onFilterChange={handleFilterChange}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          <BulkActionBar
            selectedCount={selectedIds.size}
            onBulkDelete={() => setBulkDeleteDialogOpen(true)}
            onClearSelection={() => {
              setSelectedIds(new Set())
              setSelectAll(false)
            }}
          />

          {isLoading ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b">
                  <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                  <div className="h-12 w-12 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              onAddProduct={handleAddProduct}
            />
          ) : (
            <>
              <ProductTable
                products={products}
                selectedIds={selectedIds}
                selectAll={selectAll}
                onSelectAll={handleSelectAll}
                onSelectProduct={handleSelectProduct}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onEdit={handleEditProduct}
                onDelete={handleDeleteClick}
              />

              <ProductPagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSuccess={handleDialogSuccess}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={productToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        selectedCount={selectedIds.size}
        isDeleting={isDeleting}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  )
}
