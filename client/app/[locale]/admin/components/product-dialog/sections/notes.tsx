'use client'

import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { TextFormField } from '@/components/form/fields'
import { ProductFormData } from '@/lib/schemas/product'

interface NotesSectionProps {
  form: UseFormReturn<ProductFormData>
}

export function NotesSection({ form }: NotesSectionProps) {
  const t = useTranslations()

  return (
    <div className="grid grid-cols-1 gap-4">
      <TextFormField
        form={form}
        name="topNotes"
        label={t('admin.productDialog.topNotes')}
        placeholder="Pineapple, Bergamot"
      />

      <TextFormField
        form={form}
        name="heartNotes"
        label={t('admin.productDialog.heartNotes')}
        placeholder="Birch, Patchouli"
      />

      <TextFormField
        form={form}
        name="baseNotes"
        label={t('admin.productDialog.baseNotes')}
        placeholder="Musk, Oak Moss"
      />
    </div>
  )
}
