import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface FormatDateTimeOptions {
  locale?: 'en' | 'ro' | 'fr' | 'de' | 'es'
  includeSeconds?: boolean
}

const localeMap: Record<string, string> = {
  en: 'en-US',
  ro: 'ro-RO',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
}

export function formatDateTime(dateStr: string, options?: FormatDateTimeOptions): string {
  const { locale = 'en', includeSeconds = false } = options ?? {}
  const date = new Date(dateStr)
  return date.toLocaleString(localeMap[locale] ?? 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  })
}

export function formatDateTimeLocal(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
