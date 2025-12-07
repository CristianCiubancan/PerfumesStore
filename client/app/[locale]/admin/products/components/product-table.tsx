'use client'

import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useCurrencyStore } from '@/store/currency'
import { formatPrice } from '@/lib/currency'
import { Product } from '@/types'
import { cn } from '@/lib/utils'
import { STOCK } from '@/lib/constants'

type SortField = 'name' | 'price' | 'stock' | 'newest'
type SortOrder = 'asc' | 'desc'

function getStockBadgeVariant(stock: number): 'default' | 'secondary' | 'destructive' {
  if (stock === 0) return 'destructive'
  if (stock <= STOCK.LOW_STOCK_THRESHOLD) return 'secondary'
  return 'default'
}

interface ProductTableProps {
  products: Product[]
  selectedIds: Set<number>
  selectAll: boolean
  onSelectAll: (checked: boolean) => void
  onSelectProduct: (id: number, checked: boolean) => void
  sortBy: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

function SortIcon({ field, sortBy, sortOrder }: { field: SortField; sortBy: SortField; sortOrder: SortOrder }) {
  if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />
  return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
}

export function ProductTable({
  products,
  selectedIds,
  selectAll,
  onSelectAll,
  onSelectProduct,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const t = useTranslations()
  const { currency, exchangeRates } = useCurrencyStore()

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectAll}
                onCheckedChange={onSelectAll}
                aria-label={t('admin.products.selectAll')}
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8"
                onClick={() => onSort('name')}
              >
                {t('admin.table.product')}
                <SortIcon field="name" sortBy={sortBy} sortOrder={sortOrder} />
              </Button>
            </TableHead>
            <TableHead>{t('admin.table.brand')}</TableHead>
            <TableHead>{t('admin.table.concentration')}</TableHead>
            <TableHead>{t('admin.table.gender')}</TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="-mr-3 h-8"
                onClick={() => onSort('price')}
              >
                {t('admin.table.price')}
                <SortIcon field="price" sortBy={sortBy} sortOrder={sortOrder} />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                size="sm"
                className="-mr-3 h-8"
                onClick={() => onSort('stock')}
              >
                {t('admin.table.stock')}
                <SortIcon field="stock" sortBy={sortBy} sortOrder={sortOrder} />
              </Button>
            </TableHead>
            <TableHead className="text-right sticky right-0 bg-background">{t('admin.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className={cn(selectedIds.has(product.id) && 'bg-muted/50')}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(product.id)}
                  onCheckedChange={(checked: boolean) =>
                    onSelectProduct(product.id, checked)
                  }
                  aria-label={t('admin.products.selectProduct', { name: product.name })}
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.brand}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {t(`product.concentration.${product.concentration}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {t(`product.gender.${product.gender}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatPrice(product.priceRON, currency, exchangeRates)}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={getStockBadgeVariant(product.stock)}>
                  {product.stock}
                </Badge>
              </TableCell>
              <TableCell className="text-right sticky right-0 bg-background">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(product)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
