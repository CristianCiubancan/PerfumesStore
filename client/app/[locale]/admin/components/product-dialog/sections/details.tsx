'use client'

import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { NumberFormField } from '@/components/form/fields'
import { ProductFormData } from '@/lib/schemas/product'

interface DetailsSectionProps {
  form: UseFormReturn<ProductFormData>
}

export function DetailsSection({ form }: DetailsSectionProps) {
  const t = useTranslations()

  return (
    <div className="grid grid-cols-1 gap-4">
      <NumberFormField
        form={form}
        name="volumeMl"
        label={t('admin.productDialog.volume')}
      />

      <NumberFormField
        form={form}
        name="priceRON"
        label={t('admin.productDialog.price')}
        step="0.01"
      />

      <NumberFormField
        form={form}
        name="launchYear"
        label={t('admin.productDialog.launchYear')}
      />

      <NumberFormField
        form={form}
        name="stock"
        label={t('admin.productDialog.stock')}
      />
    </div>
  )
}
