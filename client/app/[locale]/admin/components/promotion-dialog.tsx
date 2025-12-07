'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Promotion, CreatePromotionInput } from '@/types'
import { promotionsApi } from '@/lib/api/promotions'
import { ApiError } from '@/lib/api/client'
import { formatDateTimeLocal } from '@/lib/utils'

const promotionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  discountPercent: z.number().int().min(1).max(99),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean(),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
})

type PromotionFormData = z.infer<typeof promotionSchema>

interface PromotionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promotion: Promotion | null
  onSuccess: () => void
}

function getDefaultStartDate(): string {
  const now = new Date()
  return formatDateTimeLocal(now.toISOString())
}

function getDefaultEndDate(): string {
  const now = new Date()
  now.setDate(now.getDate() + 7)
  return formatDateTimeLocal(now.toISOString())
}

export function PromotionDialog({
  open,
  onOpenChange,
  promotion,
  onSuccess,
}: PromotionDialogProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!promotion

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: '',
      discountPercent: 15,
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate(),
      isActive: true,
    },
  })

  useEffect(() => {
    if (promotion) {
      form.reset({
        name: promotion.name,
        discountPercent: promotion.discountPercent,
        startDate: formatDateTimeLocal(promotion.startDate),
        endDate: formatDateTimeLocal(promotion.endDate),
        isActive: promotion.isActive,
      })
    } else {
      form.reset({
        name: '',
        discountPercent: 15,
        startDate: getDefaultStartDate(),
        endDate: getDefaultEndDate(),
        isActive: true,
      })
    }
  }, [promotion, form])

  async function onSubmit(data: PromotionFormData) {
    setIsLoading(true)

    const payload: CreatePromotionInput = {
      name: data.name,
      discountPercent: data.discountPercent,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      isActive: data.isActive,
    }

    try {
      if (isEditing && promotion) {
        await promotionsApi.update(promotion.id, payload)
        toast.success(t('admin.promotions.dialog.updateSuccess'))
      } else {
        await promotionsApi.create(payload)
        toast.success(t('admin.promotions.dialog.createSuccess'))
      }
      onSuccess()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.promotions.dialog.error'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('admin.promotions.dialog.editTitle') : t('admin.promotions.dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('admin.promotions.dialog.editDescription')
              : t('admin.promotions.dialog.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.promotions.dialog.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('admin.promotions.dialog.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discountPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.promotions.dialog.discountPercent')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.promotions.dialog.startDate')}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.promotions.dialog.endDate')}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="cursor-pointer">
                    {t('admin.promotions.dialog.isActive')}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isEditing
                    ? t('admin.promotions.dialog.updating')
                    : t('admin.promotions.dialog.creating')
                  : isEditing
                  ? t('admin.promotions.dialog.updateButton')
                  : t('admin.promotions.dialog.createButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
