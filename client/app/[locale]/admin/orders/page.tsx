'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Search, ChevronLeft, ChevronRight, X, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { adminOrdersApi, AdminOrder } from '@/lib/api/admin-orders'
import { OrderStatus } from '@/types'
import { ApiError } from '@/lib/api/client'
import { formatDateTime, cn } from '@/lib/utils'

// Simple price formatter for admin view - always displays in RON
function formatRON(price: number): string {
  return `${price.toFixed(2)} RON`
}
import { useDebounce } from '@/hooks/use-debounce'
import { TIMING } from '@/lib/constants'
import { OrderDetailsDialog } from './components/order-details-dialog'
import { UpdateStatusDialog } from './components/update-status-dialog'

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]

function getStatusVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return 'default'
    case 'PROCESSING':
    case 'SHIPPED':
      return 'secondary'
    case 'CANCELLED':
    case 'REFUNDED':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default function AdminOrdersPage() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const debouncedSearch = useDebounce(searchQuery, TIMING.DEBOUNCE_SHORT_MS)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')

  // Dialogs
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)

  const pageParam = searchParams.get('page') || '1'

  const updateUrlParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const current = new URLSearchParams(window.location.search)
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          current.set(key, value)
        } else {
          current.delete(key)
        }
      })
      router.replace(`${pathname}?${current.toString()}`, { scroll: false })
    },
    [pathname, router]
  )

  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await adminOrdersApi.list({
        page: parseInt(pageParam, 10),
        limit: 20,
        status: statusFilter !== 'all' ? (statusFilter as OrderStatus) : undefined,
        search: debouncedSearch || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setOrders(result.orders)
      setPagination(result.pagination)
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.orders.failedToLoad'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [pageParam, statusFilter, debouncedSearch, t])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const prevDebouncedSearch = useRef(debouncedSearch)
  useEffect(() => {
    if (prevDebouncedSearch.current === debouncedSearch) return
    prevDebouncedSearch.current = debouncedSearch
    updateUrlParams({ search: debouncedSearch, page: '1' })
  }, [debouncedSearch, updateUrlParams])

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value)
    updateUrlParams({ status: value, page: '1' })
  }

  function handlePageChange(newPage: number) {
    updateUrlParams({ page: newPage.toString() })
  }

  function clearFilters() {
    setSearchQuery('')
    setStatusFilter('all')
    router.replace(pathname, { scroll: false })
  }

  function handleViewOrder(order: AdminOrder) {
    setSelectedOrder(order)
    setDetailsDialogOpen(true)
  }

  function handleUpdateStatus(order: AdminOrder) {
    setSelectedOrder(order)
    setStatusDialogOpen(true)
  }

  function handleStatusUpdated() {
    setStatusDialogOpen(false)
    setSelectedOrder(null)
    loadOrders()
  }

  const hasFilters = statusFilter !== 'all' || Boolean(searchQuery)

  function getCustomerEmail(order: AdminOrder): string {
    return order.user?.email || order.guestEmail || '-'
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 shrink-0" />
              <div>
                <CardTitle className="text-xl sm:text-2xl">{t('admin.orders.title')}</CardTitle>
                <CardDescription>
                  {t('admin.orders.description', { total: pagination.total })}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('admin.orders.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('admin.orders.filters.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.orders.filters.allStatuses')}</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`orders.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                <X className="h-4 w-4 mr-1" />
                {t('admin.orders.filters.clear')}
              </Button>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4 border-b">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t('admin.orders.noOrders')}</h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? t('admin.orders.noMatchingOrders')
                  : t('admin.orders.noOrdersDescription')}
              </p>
              {hasFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  {t('admin.orders.filters.clear')}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">{t('admin.orders.table.orderNumber')}</TableHead>
                      <TableHead className="min-w-[180px]">{t('admin.orders.table.customer')}</TableHead>
                      <TableHead className="min-w-[140px]">{t('admin.orders.table.date')}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{t('admin.orders.table.total')}</TableHead>
                      <TableHead className="text-center min-w-[120px]">{t('admin.orders.table.status')}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{t('admin.orders.table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.customerName}</span>
                            <span className="text-sm text-muted-foreground">
                              {getCustomerEmail(order)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(order.createdAt)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRON(parseFloat(order.totalRON))}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={getStatusVariant(order.status)}
                            className={cn(
                              'cursor-pointer hover:opacity-80 transition-opacity',
                              order.status === 'CANCELLED' || order.status === 'REFUNDED'
                                ? 'cursor-not-allowed opacity-60'
                                : ''
                            )}
                            onClick={() => {
                              if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
                                handleUpdateStatus(order)
                              }
                            }}
                          >
                            {t(`orders.status.${order.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewOrder(order)}
                            title={t('admin.orders.viewDetails')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {t('admin.orders.totalOrders', { count: pagination.total })}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common.previous')}</span>
                  </Button>
                  <span className="text-sm whitespace-nowrap">
                    {t('admin.orders.pageInfo', {
                      current: pagination.page,
                      total: pagination.totalPages,
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <span className="hidden sm:inline">{t('common.next')}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onUpdateStatus={() => {
          setDetailsDialogOpen(false)
          if (selectedOrder) handleUpdateStatus(selectedOrder)
        }}
      />

      {/* Update Status Dialog */}
      <UpdateStatusDialog
        order={selectedOrder}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onSuccess={handleStatusUpdated}
      />
    </div>
  )
}
