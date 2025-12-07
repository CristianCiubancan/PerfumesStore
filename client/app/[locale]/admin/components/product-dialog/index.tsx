'use client'

import { useState, useEffect } from 'react'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { Product, CreateProductInput } from '@/types'
import { productsApi } from '@/lib/api/products'
import { ApiError } from '@/lib/api/client'
import { useFilterOptions } from '@/hooks/use-filter-options'
import { productSchema, ProductFormData } from '@/lib/schemas/product'
import { getProductFormDefaults } from './constants'
import {
  BasicInfoSection,
  NotesSection,
  DetailsSection,
  AttributesSection,
  OptionalSection,
} from './sections'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

function productToFormData(product: Product): ProductFormData {
  return {
    name: product.name,
    brand: product.brand,
    concentration: product.concentration,
    gender: product.gender,
    fragranceFamilyId: product.fragranceFamilyId,
    topNotes: product.topNotes.join(', '),
    heartNotes: product.heartNotes.join(', '),
    baseNotes: product.baseNotes.join(', '),
    volumeMl: product.volumeMl,
    priceRON: parseFloat(product.priceRON),
    launchYear: product.launchYear,
    perfumer: product.perfumer || '',
    longevityId: product.longevityId,
    sillageId: product.sillageId,
    seasonIds: product.seasons.map((s) => s.id),
    occasionIds: product.occasions.map((o) => o.id),
    rating: parseFloat(product.rating),
    stock: product.stock,
    imageUrl: product.imageUrl || '',
    description: product.description || '',
  }
}

function formDataToPayload(data: ProductFormData): CreateProductInput {
  return {
    ...data,
    topNotes: data.topNotes.split(',').map((s) => s.trim()).filter(Boolean),
    heartNotes: data.heartNotes.split(',').map((s) => s.trim()).filter(Boolean),
    baseNotes: data.baseNotes.split(',').map((s) => s.trim()).filter(Boolean),
    perfumer: data.perfumer || undefined,
    imageUrl: data.imageUrl || undefined,
    description: data.description || undefined,
  }
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductDialogProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const { filterOptions, isLoadingOptions } = useFilterOptions()
  const isEditing = !!product

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
    defaultValues: getProductFormDefaults(),
  })

  useEffect(() => {
    if (product) {
      form.reset(productToFormData(product))
    } else {
      form.reset(getProductFormDefaults())
    }
  }, [product, form])

  async function onSubmit(data: ProductFormData) {
    setIsLoading(true)
    const payload = formDataToPayload(data)

    try {
      if (isEditing && product) {
        await productsApi.update(product.id, payload)
        toast.success(t('admin.productDialog.updateSuccess'))
      } else {
        await productsApi.create(payload)
        toast.success(t('admin.productDialog.createSuccess'))
      }
      onSuccess()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message)
      } else {
        toast.error(t('admin.productDialog.error'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('admin.productDialog.editTitle')
              : t('admin.productDialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('admin.productDialog.editDescription')
              : t('admin.productDialog.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BasicInfoSection
              form={form}
              filterOptions={filterOptions}
              isLoadingOptions={isLoadingOptions}
            />

            <NotesSection form={form} />

            <DetailsSection form={form} />

            <AttributesSection
              form={form}
              filterOptions={filterOptions}
              isLoadingOptions={isLoadingOptions}
            />

            <OptionalSection form={form} isLoading={isLoading} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading || isLoadingOptions}>
                {isLoading
                  ? isEditing
                    ? t('admin.productDialog.updating')
                    : t('admin.productDialog.creating')
                  : isEditing
                    ? t('admin.productDialog.updateButton')
                    : t('admin.productDialog.createButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
