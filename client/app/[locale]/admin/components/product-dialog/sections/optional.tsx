'use client'

import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { TextFormField, NumberFormField, TextareaFormField } from '@/components/form/fields'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ImageUploadField } from '@/components/ui/image-upload-field'
import { ProductFormData } from '@/lib/schemas/product'

interface OptionalSectionProps {
  form: UseFormReturn<ProductFormData>
  isLoading: boolean
}

export function OptionalSection({ form, isLoading }: OptionalSectionProps) {
  const t = useTranslations()

  return (
    <div className="space-y-4">
      <TextFormField
        form={form}
        name="perfumer"
        label={`${t('admin.productDialog.perfumer')} (${t('common.optional')})`}
        placeholder="Olivier Creed"
      />

      <NumberFormField
        form={form}
        name="rating"
        label={t('admin.productDialog.rating')}
        min={0}
        max={5}
        step="0.1"
      />

      <FormField
        control={form.control}
        name="imageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t('admin.productDialog.image')} ({t('common.optional')})
            </FormLabel>
            <FormControl>
              <ImageUploadField
                value={field.value || ''}
                onChange={field.onChange}
                disabled={isLoading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <TextareaFormField
        form={form}
        name="description"
        label={`${t('admin.productDialog.description')} (${t('common.optional')})`}
        placeholder="A sophisticated fruity chypre..."
      />
    </div>
  )
}
