import { Locale } from './translations'

// Import all templates
import * as orderConfirmation from './order-confirmation'
import * as newsletterWelcome from './newsletter-welcome'
import * as passwordReset from './password-reset'

// Import campaign templates
import * as campaignExamplePromo from './campaigns/example-promo'

// Re-export translations
export * from './translations'

// Re-export base utilities
export * from './base'

// Re-export campaign base utilities
export * from './campaign-base'

// Re-export template types
export type { OrderWithItems, OrderConfirmationData } from './order-confirmation'
export type { NewsletterWelcomeData } from './newsletter-welcome'
export type { PasswordResetData } from './password-reset'

// ============================================================================
// Template Registry
// ============================================================================

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  category: 'transactional' | 'marketing' | 'campaign'
  variables: string[]
}

export interface EmailTemplate<TData = unknown> {
  metadata: TemplateMetadata
  render: (data: TData, locale: Locale) => { subject: string; html: string; text: string }
  getSampleData: () => TData
}

// Registry of all available templates
const templateRegistry = new Map<string, EmailTemplate<unknown>>([
  ['order-confirmation', orderConfirmation as EmailTemplate<unknown>],
  ['newsletter-welcome', newsletterWelcome as EmailTemplate<unknown>],
  ['password-reset', passwordReset as EmailTemplate<unknown>],
  // Campaign templates (category: 'campaign')
  ['campaign-example-promo', campaignExamplePromo as EmailTemplate<unknown>],
])

// ============================================================================
// Registry Functions
// ============================================================================

/**
 * Get all available templates
 */
export function getAllTemplates(): TemplateMetadata[] {
  return Array.from(templateRegistry.values()).map(t => t.metadata)
}

/**
 * Get only campaign templates (for campaign creation dropdown)
 */
export function getCampaignTemplates(): TemplateMetadata[] {
  return Array.from(templateRegistry.values())
    .filter(t => t.metadata.category === 'campaign')
    .map(t => t.metadata)
}

/**
 * Get a template by ID
 */
export function getTemplate(id: string): EmailTemplate<unknown> | undefined {
  return templateRegistry.get(id)
}

/**
 * Check if a template exists
 */
export function hasTemplate(id: string): boolean {
  return templateRegistry.has(id)
}

/**
 * Render a template by ID
 */
export function renderTemplate(
  id: string,
  data: unknown,
  locale: Locale
): { subject: string; html: string; text: string } | null {
  const template = templateRegistry.get(id)
  if (!template) return null
  return template.render(data, locale)
}

/**
 * Get sample data for a template
 */
export function getTemplateSampleData(id: string): unknown | null {
  const template = templateRegistry.get(id)
  if (!template) return null
  return template.getSampleData()
}

/**
 * Render a template preview with sample data
 */
export function renderTemplatePreview(
  id: string,
  locale: Locale
): { subject: string; html: string; text: string } | null {
  const template = templateRegistry.get(id)
  if (!template) return null
  const sampleData = template.getSampleData()
  return template.render(sampleData, locale)
}

// ============================================================================
// Direct Template Exports (for typed usage)
// ============================================================================

export const templates = {
  orderConfirmation: {
    render: orderConfirmation.render,
    getSampleData: orderConfirmation.getSampleData,
    metadata: orderConfirmation.metadata,
  },
  newsletterWelcome: {
    render: newsletterWelcome.render,
    getSampleData: newsletterWelcome.getSampleData,
    metadata: newsletterWelcome.metadata,
  },
  passwordReset: {
    render: passwordReset.render,
    getSampleData: passwordReset.getSampleData,
    metadata: passwordReset.metadata,
  },
}
