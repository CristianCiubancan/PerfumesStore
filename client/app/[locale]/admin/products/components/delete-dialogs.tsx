'use client'

import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Product } from '@/types'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  isDeleting: boolean
  onConfirm: () => void
}

export function DeleteDialog({
  open,
  onOpenChange,
  product,
  isDeleting,
  onConfirm,
}: DeleteDialogProps) {
  const t = useTranslations()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.deleteDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.deleteDialog.description', { name: product?.name || '' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? t('common.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface BulkDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  isDeleting: boolean
  onConfirm: () => void
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  selectedCount,
  isDeleting,
  onConfirm,
}: BulkDeleteDialogProps) {
  const t = useTranslations()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.products.bulkDeleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.products.bulkDeleteDescription', { count: selectedCount })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? t('common.deleting') : t('admin.products.deleteSelected')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
