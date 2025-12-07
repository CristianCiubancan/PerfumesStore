'use client'

import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { MultiSelect } from '@/components/ui/multi-select'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  options: MultiSelectOption[]
  disabled?: boolean
}

export function MultiSelectFormField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  options,
  disabled,
}: MultiSelectFormFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <MultiSelect
              options={options}
              selected={(field.value || []).map(String)}
              onChange={(selected) =>
                field.onChange(selected.map((id) => parseInt(id, 10)))
              }
              placeholder={placeholder}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
