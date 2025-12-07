'use client'

import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { TextFormField, SelectFormField, LookupSelectField } from '@/components/form/fields'
import { ProductFormData, genderOptions, concentrationOptions } from '@/lib/schemas/product'
import { FilterOptions } from '@/types'

interface BasicInfoSectionProps {
  form: UseFormReturn<ProductFormData>
  filterOptions: FilterOptions | null
  isLoadingOptions: boolean
}

export function BasicInfoSection({
  form,
  filterOptions,
  isLoadingOptions,
}: BasicInfoSectionProps) {
  const t = useTranslations()

  const genderSelectOptions = genderOptions.map((option) => ({
    value: option,
    label: t(`product.gender.${option}`),
  }))

  const concentrationSelectOptions = concentrationOptions.map((option) => ({
    value: option,
    label: t(`product.concentration.${option}`),
  }))

  return (
    <div className="grid grid-cols-1 gap-4">
      <TextFormField
        form={form}
        name="name"
        label={t('admin.productDialog.name')}
        placeholder="Aventus"
      />

      <TextFormField
        form={form}
        name="brand"
        label={t('admin.productDialog.brand')}
        placeholder="Creed"
      />

      <SelectFormField
        form={form}
        name="concentration"
        label={t('admin.productDialog.concentration')}
        placeholder={t('admin.productDialog.selectConcentration')}
        options={concentrationSelectOptions}
      />

      <SelectFormField
        form={form}
        name="gender"
        label={t('admin.productDialog.gender')}
        placeholder={t('admin.productDialog.selectGender')}
        options={genderSelectOptions}
      />

      <LookupSelectField
        form={form}
        name="fragranceFamilyId"
        label={t('admin.productDialog.fragranceFamily')}
        placeholder={t('admin.productDialog.selectFragranceFamily')}
        options={filterOptions?.fragranceFamilies || []}
        getLabel={(option) => t(`product.fragranceFamily.${option.name}`)}
        disabled={isLoadingOptions}
      />
    </div>
  )
}
