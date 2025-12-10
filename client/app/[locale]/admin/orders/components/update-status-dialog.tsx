'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminOrder, adminOrdersApi } from '@/lib/api/admin-orders'
import { OrderStatus } from '@/types'
import { ApiError } from '@/lib/api/client'

interface UpdateStatusDialogProps {
  order: AdminOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// Valid status transitions matching backend
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}

export function UpdateStatusDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: UpdateStatusDialogProps) {
  const t = useTranslations()
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('')
  const [isUpdating, setIsUpdating] = useState(false)

  if (!order) return null

  const availableStatuses = VALID_TRANSITIONS[order.status] || []
  const isDestructive = newStatus === 'CANCELLED' || newStatus === 'REFUNDED'

  async function handleConfirm() {
    if (!newStatus || !order) return

    setIsUpdating(true)
    try {
      await adminOrdersApi.updateStatus(order.id, newStatus)
      toast.success(t('admin.orders.statusUpdateSuccess'))
      setNewStatus('')
      onSuccess()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.orders.statusUpdateError'))
      }
    } finally {
      setIsUpdating(false)
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setNewStatus('')
    }
    onOpenChange(isOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.orders.updateStatusDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.orders.updateStatusDialog.description', {
              orderNumber: order.orderNumber,
              currentStatus: t(`orders.status.${order.status}`),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
            <SelectTrigger>
              <SelectValue placeholder={t('admin.orders.updateStatusDialog.selectStatus')} />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`orders.status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isDestructive && (
            <p className="mt-3 text-sm text-destructive">
              {newStatus === 'CANCELLED'
                ? t('admin.orders.updateStatusDialog.cancelWarning')
                : t('admin.orders.updateStatusDialog.refundWarning')}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpdating}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!newStatus || isUpdating}
            className={isDestructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {isUpdating ? t('common.saving') : t('admin.orders.updateStatusDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
