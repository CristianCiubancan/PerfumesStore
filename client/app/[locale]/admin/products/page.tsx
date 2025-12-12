'use client'

/**
 * Admin products page
 * Refactored to use extracted hooks for better maintainability:
 * - useAdminProductFilters: Filter state and URL sync
 * - useAdminProducts: Data fetching and mutations
 * - useProductSelection: Bulk selection logic
 */

import { useState, useCallback } from 'react'
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
import { Product } from '@/types'
import { ProductDialog } from '../components/product-dialog'
import { ProductFilters } from './components/product-filters'
import { ProductTable } from './components/product-table'
import { ProductPagination } from './components/product-pagination'
import { BulkActionBar } from './components/bulk-action-bar'
import { DeleteDialog, BulkDeleteDialog } from './components/delete-dialogs'
import { EmptyState } from './components/empty-state'
import { LoadingSkeleton } from './components/loading-skeleton'
import { useAdminProductFilters } from '@/hooks/use-admin-product-filters'
import { useAdminProducts } from '@/hooks/use-admin-products'
import { useProductSelection } from '@/hooks/use-product-selection'

export default function ProductsPage() {
  const t = useTranslations()

  // Filter state and URL sync
  const {
    filters,
    setSearchQuery,
    setConcentration,
    setGender,
    setStockStatus,
    handleSort,
    handlePageChange,
    handlePageSizeChange,
    clearFilters,
  } = useAdminProductFilters()

  // Selection state
  const { selectedIds, selectAll, handleSelectAll, handleSelectProduct, clearSelection } =
    useProductSelection()

  // Products data and mutations
  const { products, pagination, isLoading, loadProducts, deleteProduct, bulkDeleteProducts } =
    useAdminProducts({
      filters,
      onDataLoaded: clearSelection,
    })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Handlers
  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      switch (key) {
        case 'concentration':
          setConcentration(value)
          break
        case 'gender':
          setGender(value)
          break
        case 'stockStatus':
          setStockStatus(value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')
          break
      }
    },
    [setConcentration, setGender, setStockStatus]
  )

  const handleAddProduct = useCallback(() => {
    setEditingProduct(null)
    setDialogOpen(true)
  }, [])

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!productToDelete) return

    setIsDeleting(true)
    const success = await deleteProduct(productToDelete.id)
    setIsDeleting(false)
    if (success) {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }, [productToDelete, deleteProduct])

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return

    setIsDeleting(true)
    const success = await bulkDeleteProducts(Array.from(selectedIds))
    setIsDeleting(false)
    if (success) {
      setBulkDeleteDialogOpen(false)
    }
  }, [selectedIds, bulkDeleteProducts])

  const handleDialogSuccess = useCallback(() => {
    setDialogOpen(false)
    setEditingProduct(null)
    loadProducts()
  }, [loadProducts])

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
            searchQuery={filters.searchQuery}
            onSearchChange={setSearchQuery}
            concentration={filters.concentration}
            gender={filters.gender}
            stockStatus={filters.stockStatus}
            onFilterChange={handleFilterChange}
            hasActiveFilters={filters.hasActiveFilters}
            onClearFilters={clearFilters}
          />

          <BulkActionBar
            selectedCount={selectedIds.size}
            onBulkDelete={() => setBulkDeleteDialogOpen(true)}
            onClearSelection={clearSelection}
          />

          {isLoading ? (
            <LoadingSkeleton />
          ) : products.length === 0 ? (
            <EmptyState
              hasActiveFilters={filters.hasActiveFilters}
              onClearFilters={clearFilters}
              onAddProduct={handleAddProduct}
            />
          ) : (
            <>
              <ProductTable
                products={products}
                selectedIds={selectedIds}
                selectAll={selectAll}
                onSelectAll={(checked) =>
                  handleSelectAll(
                    checked,
                    products.map((p) => p.id)
                  )
                }
                onSelectProduct={(id, checked) =>
                  handleSelectProduct(id, checked, products.length)
                }
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
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
