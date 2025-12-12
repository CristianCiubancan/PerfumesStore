import { api } from './client'
import { env } from '@/lib/env'

// ============================================================================
// Types
// ============================================================================

export interface EmailServiceStatus {
  enabled: boolean
  provider: string
  fromEmail: string | null
}

export interface SupportedLocale {
  code: string
  name: string
}

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  category: string
  previewUrl: string
}

export interface TemplateListResponse {
  templates: TemplateMetadata[]
  locales: SupportedLocale[]
}

export interface TemplatePreview {
  template: Omit<TemplateMetadata, 'previewUrl'>
  locale: string
  localeName: string
  subject: string
  html: string
  text: string
  availableLocales: SupportedLocale[]
}

// ============================================================================
// API
// ============================================================================

export const emailTemplatesApi = {
  /**
   * Get email service status
   */
  getStatus: () => api.get<EmailServiceStatus>('/api/admin/email/status'),

  /**
   * Get all supported locales
   */
  getLocales: () => api.get<SupportedLocale[]>('/api/admin/email/locales'),

  /**
   * List all available email templates
   */
  list: () => api.get<TemplateListResponse>('/api/admin/email/templates'),

  /**
   * Get template details and sample data
   */
  getTemplate: (id: string) =>
    api.get<{
      template: Omit<TemplateMetadata, 'previewUrl'>
      sampleData: unknown
      availableLocales: SupportedLocale[]
    }>(`/api/admin/email/templates/${id}`),

  /**
   * Get template preview (JSON response with subject, html, text)
   */
  getPreview: (id: string, locale: string = 'en') =>
    api.get<TemplatePreview>(`/api/admin/email/templates/${id}/preview?locale=${locale}`),

  /**
   * Get URL for iframe preview (returns raw HTML)
   */
  getPreviewHtmlUrl: (id: string, locale: string = 'en') =>
    `${env.apiUrl}/api/admin/email/templates/${id}/preview/html?locale=${locale}`,

  /**
   * Get URL for plain text preview
   */
  getPreviewTextUrl: (id: string, locale: string = 'en') =>
    `${env.apiUrl}/api/admin/email/templates/${id}/preview/text?locale=${locale}`,
}
