'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AdminOrder } from '@/lib/api/admin-orders'
import { OrderStatus } from '@/types'
import { formatDateTime } from '@/lib/utils'

// Simple price formatter for admin view - always displays in RON
function formatRON(price: number): string {
  return `${price.toFixed(2)} RON`
}

// Format EUR prices with symbol
function formatEUR(price: number): string {
  return `€${price.toFixed(2)}`
}
import Image from 'next/image'
import { getFullImageUrl } from '@/lib/api/upload'

interface OrderDetailsDialogProps {
  order: AdminOrder | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus: () => void
}

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

export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
}: OrderDetailsDialogProps) {
  const t = useTranslations()

  if (!order) return null

  const canUpdateStatus = order.status !== 'CANCELLED' && order.status !== 'REFUNDED'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{t('admin.orders.orderDetails.title')}</span>
            <Badge variant={getStatusVariant(order.status)}>
              {t(`orders.status.${order.status}`)}
            </Badge>
          </DialogTitle>
          <DialogDescription className="font-mono">
            {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div>
            <h4 className="font-medium mb-2">{t('admin.orders.orderDetails.customer')}</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p><span className="text-foreground">{order.customerName}</span></p>
              <p>{order.user?.email || order.guestEmail}</p>
              {order.customerPhone && <p>{order.customerPhone}</p>}
              {order.user && (
                <p className="text-xs">
                  {t('admin.orders.orderDetails.registeredUser', { id: order.user.id })}
                </p>
              )}
              {!order.user && (
                <p className="text-xs italic">{t('admin.orders.orderDetails.guestOrder')}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Shipping Address */}
          <div>
            <h4 className="font-medium mb-2">{t('admin.orders.orderDetails.shippingAddress')}</h4>
            <div className="text-sm text-muted-foreground">
              <p>{order.shippingAddressLine1}</p>
              {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
              <p>
                {order.shippingCity}
                {order.shippingState && `, ${order.shippingState}`}
              </p>
              <p>{order.shippingPostalCode}, {order.shippingCountry}</p>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h4 className="font-medium mb-3">{t('admin.orders.orderDetails.items')}</h4>
            <div className="space-y-3">
              {order.items.map((item) => {
                const fullImageUrl = item.imageUrl ? getFullImageUrl(item.imageUrl) : null
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                      {fullImageUrl ? (
                        <Image
                          src={fullImageUrl}
                          alt={item.productName}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">{item.productBrand}</p>
                      <p className="text-sm text-muted-foreground">{item.volumeMl}ml</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{item.quantity} x {formatRON(parseFloat(item.unitPriceRON))}</p>
                      <p className="font-medium">{formatRON(parseFloat(item.totalPriceRON))}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Order Summary */}
          <div>
            <h4 className="font-medium mb-3">{t('admin.orders.orderDetails.summary')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('admin.orders.orderDetails.subtotal')}</span>
                <span>{formatRON(parseFloat(order.subtotalRON))}</span>
              </div>
              {order.discountPercent && parseFloat(order.discountRON) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('admin.orders.orderDetails.discount', { percent: order.discountPercent })}</span>
                  <span>-{formatRON(parseFloat(order.discountRON))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium text-base">
                <span>{t('admin.orders.orderDetails.total')}</span>
                <span>{formatRON(parseFloat(order.totalRON))}</span>
              </div>
              {order.paidAmountEUR && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('admin.orders.orderDetails.paidInEUR')}</span>
                  <span>{formatEUR(parseFloat(order.paidAmountEUR))}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">{t('admin.orders.orderDetails.createdAt')}: </span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            {order.paidAt && (
              <div>
                <span className="text-muted-foreground">{t('admin.orders.orderDetails.paidAt')}: </span>
                <span>{formatDateTime(order.paidAt)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {canUpdateStatus && (
            <div className="flex justify-end pt-2">
              <Button onClick={onUpdateStatus}>
                {t('admin.orders.updateStatus')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
