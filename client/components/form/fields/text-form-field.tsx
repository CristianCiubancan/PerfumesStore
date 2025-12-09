'use client'

import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

interface TextFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  disabled?: boolean
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
}

export function TextFormField<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  disabled,
  type = 'text',
}: TextFormFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} disabled={disabled} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
