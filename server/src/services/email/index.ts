export {
  isEmailEnabled,
  normalizeLocale,
  sendOrderConfirmationEmail,
  sendNewsletterWelcomeEmail,
  sendNewsletterCampaignByTemplate,
  resendOrderEmail,
  type Locale,
  type OrderWithItems,
  type CampaignResult,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from './email.service'

export { generateInvoicePDF } from './invoice-pdf.service'

// Template registry and preview
export {
  templates,
  getAllTemplates,
  getTemplate,
  hasTemplate,
  renderTemplate,
  renderTemplatePreview,
  getTemplateSampleData,
  type TemplateMetadata,
  type EmailTemplate,
} from './templates'
