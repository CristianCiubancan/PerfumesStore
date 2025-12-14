import { Resend } from 'resend'
import { config } from '../../config'
import { AUTH, EMAIL } from '../../config/constants'
import { logger } from '../../lib/logger'
import { generateInvoicePDF } from './invoice-pdf.service'
import {
  templates,
  normalizeLocale,
  getTemplate,
  type Locale,
  type OrderWithItems,
} from './templates'

// Re-export types and utilities
export {
  normalizeLocale,
  type Locale,
  type OrderWithItems,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from './templates'

// Initialize Resend client (nullable if not configured)
const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null

/**
 * Check if email service is configured and available
 */
export function isEmailEnabled(): boolean {
  return Boolean(resend && config.RESEND_FROM_EMAIL)
}

/**
 * Send order confirmation email with PDF invoice attachment
 */
export async function sendOrderConfirmationEmail(
  order: OrderWithItems,
  customerEmail: string,
  locale: Locale = 'ro'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isEmailEnabled()) {
    logger.warn('Email service not configured - skipping order confirmation email', 'EmailService')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    // Generate invoice PDF
    const pdfBuffer = await generateInvoicePDF(order, locale)

    // Render email template
    const { subject, html, text } = templates.orderConfirmation.render({ order }, locale)

    const result = await resend!.emails.send({
      from: config.RESEND_FROM_EMAIL!,
      to: customerEmail,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `invoice-${order.orderNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    })

    if (result.error) {
      logger.error(
        `Failed to send order confirmation email: ${result.error.message}`,
        'EmailService'
      )
      return { success: false, error: result.error.message }
    }

    logger.info(
      `Order confirmation email sent for ${order.orderNumber} to ${customerEmail}`,
      'EmailService'
    )
    return { success: true, messageId: result.data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(`Failed to send order confirmation email: ${message}`, 'EmailService')
    return { success: false, error: message }
  }
}

/**
 * Send newsletter welcome email
 */
export async function sendNewsletterWelcomeEmail(
  email: string,
  locale: Locale = 'ro'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isEmailEnabled()) {
    logger.warn('Email service not configured - skipping welcome email', 'EmailService')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    // Render email template
    const { subject, html, text } = templates.newsletterWelcome.render({ email }, locale)

    const result = await resend!.emails.send({
      from: config.RESEND_FROM_EMAIL!,
      to: email,
      subject,
      html,
      text,
    })

    if (result.error) {
      logger.error(
        `Failed to send newsletter welcome email: ${result.error.message}`,
        'EmailService'
      )
      return { success: false, error: result.error.message }
    }

    logger.info(`Newsletter welcome email sent to ${email}`, 'EmailService')
    return { success: true, messageId: result.data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(`Failed to send newsletter welcome email: ${message}`, 'EmailService')
    return { success: false, error: message }
  }
}

/**
 * Send password reset email with reset link
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  locale: Locale = 'ro'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!isEmailEnabled()) {
    logger.warn('Email service not configured - skipping password reset email', 'EmailService')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    // Build reset URL with locale
    const resetUrl = `${config.CLIENT_URL}/${locale}/reset-password?token=${resetToken}`

    // Render email template
    const { subject, html, text } = templates.passwordReset.render(
      { resetUrl, expiryTime: AUTH.PASSWORD_RESET_TOKEN_EXPIRY_DISPLAY },
      locale
    )

    const result = await resend!.emails.send({
      from: config.RESEND_FROM_EMAIL!,
      to: email,
      subject,
      html,
      text,
    })

    if (result.error) {
      logger.error(
        `Failed to send password reset email: ${result.error.message}`,
        'EmailService'
      )
      return { success: false, error: result.error.message }
    }

    logger.info(`Password reset email sent to ${email}`, 'EmailService')
    return { success: true, messageId: result.data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(`Failed to send password reset email: ${message}`, 'EmailService')
    return { success: false, error: message }
  }
}

/**
 * Result of a campaign send operation
 */
export interface CampaignResult {
  total: number
  sent: number
  failed: number
  errors: Array<{ email: string; error: string }>
}

/**
 * Send newsletter campaign using a template ID
 * Each subscriber receives the email in their preferred language
 */
export async function sendNewsletterCampaignByTemplate(
  subscribers: Array<{ email: string; preferredLanguage: string }>,
  templateId: string
): Promise<CampaignResult> {
  if (!isEmailEnabled()) {
    logger.warn('Email service not configured - skipping campaign', 'EmailService')
    return { total: subscribers.length, sent: 0, failed: subscribers.length, errors: [] }
  }

  const template = getTemplate(templateId)
  if (!template) {
    logger.error(`Template '${templateId}' not found`, 'EmailService')
    return { total: subscribers.length, sent: 0, failed: subscribers.length, errors: [] }
  }

  const result: CampaignResult = {
    total: subscribers.length,
    sent: 0,
    failed: 0,
    errors: [],
  }

  // Process in batches to avoid rate limits (configurable via constants)
  for (let i = 0; i < subscribers.length; i += EMAIL.BATCH_SIZE) {
    const batch = subscribers.slice(i, i + EMAIL.BATCH_SIZE)

    await Promise.all(
      batch.map(async (subscriber) => {
        try {
          const locale = normalizeLocale(subscriber.preferredLanguage)
          // Template renders with empty data - content is baked into template
          const { subject, html, text } = template.render({}, locale)

          const sendResult = await resend!.emails.send({
            from: config.RESEND_FROM_EMAIL!,
            to: subscriber.email,
            subject,
            html,
            text,
          })

          if (sendResult.error) {
            result.failed++
            result.errors.push({ email: subscriber.email, error: sendResult.error.message })
          } else {
            result.sent++
          }
        } catch (err) {
          result.failed++
          result.errors.push({
            email: subscriber.email,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      })
    )

    // Delay between batches (except for last batch)
    if (i + EMAIL.BATCH_SIZE < subscribers.length) {
      await new Promise((resolve) => setTimeout(resolve, EMAIL.BATCH_DELAY_MS))
    }
  }

  logger.info(
    `Newsletter campaign (template: ${templateId}) completed: ${result.sent}/${result.total} sent, ${result.failed} failed`,
    'EmailService'
  )

  return result
}

/**
 * Resend order confirmation (for manual triggers)
 */
export async function resendOrderEmail(
  order: OrderWithItems,
  customerEmail: string
): Promise<{ success: boolean; error?: string }> {
  const locale = normalizeLocale(order.orderLocale)
  return sendOrderConfirmationEmail(order, customerEmail, locale)
}
