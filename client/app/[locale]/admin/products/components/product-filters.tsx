'use client'

import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'

interface ProductFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  concentration: string
  gender: string
  stockStatus: StockStatus
  onFilterChange: (key: string, value: string) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  concentration,
  gender,
  stockStatus,
  onFilterChange,
  hasActiveFilters,
  onClearFilters,
}: ProductFiltersProps) {
  const t = useTranslations()

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('admin.products.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={concentration} onValueChange={(v) => onFilterChange('concentration', v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('admin.products.concentration')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.products.allConcentrations')}</SelectItem>
            <SelectItem value="Eau_de_Cologne">{t('product.concentration.Eau_de_Cologne')}</SelectItem>
            <SelectItem value="Eau_de_Toilette">{t('product.concentration.Eau_de_Toilette')}</SelectItem>
            <SelectItem value="Eau_de_Parfum">{t('product.concentration.Eau_de_Parfum')}</SelectItem>
            <SelectItem value="Parfum">{t('product.concentration.Parfum')}</SelectItem>
            <SelectItem value="Extrait_de_Parfum">{t('product.concentration.Extrait_de_Parfum')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={gender} onValueChange={(v) => onFilterChange('gender', v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder={t('admin.products.gender')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.products.allGenders')}</SelectItem>
            <SelectItem value="Men">{t('product.gender.Men')}</SelectItem>
            <SelectItem value="Women">{t('product.gender.Women')}</SelectItem>
            <SelectItem value="Unisex">{t('product.gender.Unisex')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stockStatus} onValueChange={(v) => onFilterChange('stockStatus', v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t('admin.products.stockStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.products.allStock')}</SelectItem>
            <SelectItem value="in_stock">{t('admin.products.inStock')}</SelectItem>
            <SelectItem value="low_stock">{t('admin.products.lowStock')}</SelectItem>
            <SelectItem value="out_of_stock">{t('admin.products.outOfStock')}</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            {t('admin.products.clearFilters')}
          </Button>
        )}
      </div>
    </div>
  )
}
