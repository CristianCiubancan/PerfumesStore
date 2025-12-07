'use client'

import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { LookupSelectField, MultiSelectFormField } from '@/components/form/fields'
import { ProductFormData } from '@/lib/schemas/product'
import { FilterOptions } from '@/types'

interface AttributesSectionProps {
  form: UseFormReturn<ProductFormData>
  filterOptions: FilterOptions | null
  isLoadingOptions: boolean
}

export function AttributesSection({
  form,
  filterOptions,
  isLoadingOptions,
}: AttributesSectionProps) {
  const t = useTranslations()

  const seasonOptions = (filterOptions?.seasons || []).map((s) => ({
    value: s.id.toString(),
    label: t(`product.season.${s.name}`),
  }))

  const occasionOptions = (filterOptions?.occasions || []).map((o) => ({
    value: o.id.toString(),
    label: t(`product.occasion.${o.name}`),
  }))

  return (
    <div className="grid grid-cols-1 gap-4">
      <LookupSelectField
        form={form}
        name="longevityId"
        label={t('admin.productDialog.longevity')}
        placeholder={t('admin.productDialog.selectLongevity')}
        options={filterOptions?.longevities || []}
        getLabel={(option) => t(`product.longevity.${option.name}`)}
        disabled={isLoadingOptions}
      />

      <LookupSelectField
        form={form}
        name="sillageId"
        label={t('admin.productDialog.sillage')}
        placeholder={t('admin.productDialog.selectSillage')}
        options={filterOptions?.sillages || []}
        getLabel={(option) => t(`product.sillage.${option.name}`)}
        disabled={isLoadingOptions}
      />

      <MultiSelectFormField
        form={form}
        name="seasonIds"
        label={t('admin.productDialog.season')}
        placeholder={t('admin.productDialog.selectSeasons')}
        options={seasonOptions}
        disabled={isLoadingOptions}
      />

      <MultiSelectFormField
        form={form}
        name="occasionIds"
        label={t('admin.productDialog.occasion')}
        placeholder={t('admin.productDialog.selectOccasions')}
        options={occasionOptions}
        disabled={isLoadingOptions}
      />
    </div>
  )
}
