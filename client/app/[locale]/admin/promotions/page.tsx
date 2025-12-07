'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { promotionsApi } from '@/lib/api/promotions'
import { Promotion } from '@/types'
import { ApiError } from '@/lib/api/client'
import { PromotionDialog } from '../components/promotion-dialog'
import { formatDateTime } from '@/lib/utils'

function getPromotionStatus(promotion: Promotion): 'active' | 'scheduled' | 'expired' | 'inactive' {
  if (!promotion.isActive) return 'inactive'

  const now = new Date()
  const startDate = new Date(promotion.startDate)
  const endDate = new Date(promotion.endDate)

  if (now < startDate) return 'scheduled'
  if (now > endDate) return 'expired'
  return 'active'
}

export default function PromotionsPage() {
  const t = useTranslations()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null)

  useEffect(() => {
    loadPromotions()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Load once on mount
  }, [])

  async function loadPromotions() {
    try {
      const data = await promotionsApi.list()
      setPromotions(data)
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.promotions.failedToLoad'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleAddPromotion() {
    setEditingPromotion(null)
    setDialogOpen(true)
  }

  function handleEditPromotion(promotion: Promotion) {
    setEditingPromotion(promotion)
    setDialogOpen(true)
  }

  function handleDeleteClick(promotion: Promotion) {
    setPromotionToDelete(promotion)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!promotionToDelete) return

    try {
      await promotionsApi.delete(promotionToDelete.id)
      toast.success(t('admin.promotions.deleteDialog.success'))
      setPromotions((prev) => prev.filter((p) => p.id !== promotionToDelete.id))
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.promotions.deleteDialog.error'))
      }
    } finally {
      setDeleteDialogOpen(false)
      setPromotionToDelete(null)
    }
  }

  function handleDialogSuccess() {
    setDialogOpen(false)
    setEditingPromotion(null)
    loadPromotions()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl">{t('admin.promotions.title')}</CardTitle>
                <CardDescription>
                  {t('admin.promotions.description')}
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleAddPromotion}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.promotions.addPromotion')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">{t('admin.promotions.loading')}</div>
            </div>
          ) : promotions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t('admin.promotions.noPromotions')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.promotions.noPromotionsDescription')}
              </p>
              <Button onClick={handleAddPromotion}>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.promotions.addPromotion')}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.promotions.table.name')}</TableHead>
                    <TableHead className="text-center">{t('admin.promotions.table.discount')}</TableHead>
                    <TableHead>{t('admin.promotions.table.startDate')}</TableHead>
                    <TableHead>{t('admin.promotions.table.endDate')}</TableHead>
                    <TableHead className="text-center">{t('admin.promotions.table.status')}</TableHead>
                    <TableHead className="text-right">{t('admin.promotions.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promotion) => {
                    const status = getPromotionStatus(promotion)
                    return (
                      <TableRow key={promotion.id}>
                        <TableCell className="font-medium">
                          {promotion.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-lg font-bold">
                            {promotion.discountPercent}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(promotion.startDate)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(promotion.endDate)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              status === 'active' ? 'default' :
                              status === 'scheduled' ? 'secondary' :
                              status === 'expired' ? 'outline' :
                              'destructive'
                            }
                          >
                            {t(`admin.promotions.status.${status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPromotion(promotion)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(promotion)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PromotionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        promotion={editingPromotion}
        onSuccess={handleDialogSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.promotions.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.promotions.deleteDialog.description', { name: promotionToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
