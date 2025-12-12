import {
  getAllTemplates,
  getTemplate,
  renderTemplatePreview,
  hasTemplate,
  SUPPORTED_LOCALES,
  getLocaleDisplayName,
  type Locale,
  type TemplateMetadata,
} from './templates'

// ============================================================================
// Types
// ============================================================================

export interface TemplateListItem extends TemplateMetadata {
  previewUrl: string
}

export interface TemplatePreviewResponse {
  template: TemplateMetadata
  locale: Locale
  localeName: string
  subject: string
  html: string
  text: string
  availableLocales: Array<{ code: Locale; name: string }>
}

// ============================================================================
// Preview Service Functions
// ============================================================================

/**
 * List all available templates with preview URLs
 */
export function listTemplatesForPreview(baseUrl: string): TemplateListItem[] {
  return getAllTemplates().map(template => ({
    ...template,
    previewUrl: `${baseUrl}/api/admin/email/templates/${template.id}/preview`,
  }))
}

/**
 * Get template preview data
 */
export function getTemplatePreview(
  templateId: string,
  locale: Locale
): TemplatePreviewResponse | null {
  if (!hasTemplate(templateId)) return null

  const template = getTemplate(templateId)
  if (!template) return null

  const rendered = renderTemplatePreview(templateId, locale)
  if (!rendered) return null

  return {
    template: template.metadata,
    locale,
    localeName: getLocaleDisplayName(locale),
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    availableLocales: SUPPORTED_LOCALES.map(code => ({
      code,
      name: getLocaleDisplayName(code),
    })),
  }
}

/**
 * Render a template with custom data (for testing)
 */
export function renderTemplateWithData(
  templateId: string,
  data: unknown,
  locale: Locale
): { subject: string; html: string; text: string } | null {
  const template = getTemplate(templateId)
  if (!template) return null

  try {
    return template.render(data, locale)
  } catch {
    return null
  }
}

/**
 * Get sample data for a template (for admin UI form population)
 */
export function getTemplateSampleDataForPreview(templateId: string): unknown | null {
  const template = getTemplate(templateId)
  if (!template) return null
  return template.getSampleData()
}

/**
 * Get all supported locales
 */
export function getSupportedLocales(): Array<{ code: Locale; name: string }> {
  return SUPPORTED_LOCALES.map(code => ({
    code,
    name: getLocaleDisplayName(code),
  }))
}
