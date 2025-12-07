'use client'

import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

interface BulkActionBarProps {
  selectedCount: number
  onBulkDelete: () => void
  onClearSelection: () => void
}

export function BulkActionBar({
  selectedCount,
  onBulkDelete,
  onClearSelection,
}: BulkActionBarProps) {
  const t = useTranslations()

  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-4 rounded-lg bg-muted px-4 py-2">
      <span className="text-sm font-medium">
        {t('admin.products.selectedCount', { count: selectedCount })}
      </span>
      <Button
        variant="destructive"
        size="sm"
        onClick={onBulkDelete}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {t('admin.products.deleteSelected')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
      >
        {t('admin.products.clearSelection')}
      </Button>
    </div>
  )
}
