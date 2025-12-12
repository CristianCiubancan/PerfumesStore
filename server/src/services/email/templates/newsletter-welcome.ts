import { config } from '../../../config'
import { Locale, getTranslations } from './translations'
import {
  colors,
  spacing,
  typography,
  styles,
  baseLayout,
  renderButton,
  renderDivider,
  renderUnsubscribeNotice,
  renderDarkSection,
} from './base'

// ============================================================================
// Types
// ============================================================================

export interface NewsletterWelcomeData {
  email?: string
}

// ============================================================================
// Template Metadata
// ============================================================================

export const metadata = {
  id: 'newsletter-welcome',
  name: 'Newsletter Welcome',
  description: 'Sent to new newsletter subscribers',
  category: 'transactional',
  variables: ['email'],
}

// ============================================================================
// Template Render Functions
// ============================================================================

/**
 * Generate newsletter welcome email
 */
export function render(
  _data: NewsletterWelcomeData,
  locale: Locale
): { subject: string; html: string; text: string } {
  const t = getTranslations(locale)

  const html = baseLayout(renderHtml(locale, t), {
    locale,
    previewText: t.newsletterWelcome.thankYou,
  })

  const text = renderText(locale, t)

  return { subject: t.newsletterWelcome.subject, html, text }
}

/**
 * Render HTML content
 */
function renderHtml(
  locale: Locale,
  t: ReturnType<typeof getTranslations>
): string {
  return `
    <!-- Welcome Icon -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: ${spacing.lg};">
      <tr>
        <td align="center">
          <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, ${colors.accentSoft} 0%, ${colors.white} 100%);
            border: 2px solid ${colors.accent};
            border-radius: 50%;
            display: inline-block;
            line-height: 76px;
            font-size: 36px;
          ">
            &#10024;
          </div>
        </td>
      </tr>
    </table>

    <!-- Title -->
    <h1 style="${styles.title}; text-align: center;">${t.newsletterWelcome.title}</h1>

    <!-- Greeting -->
    <p style="${styles.paragraph}; text-align: center;">
      ${t.newsletterWelcome.greeting}
    </p>

    <!-- Thank you message -->
    <p style="${styles.paragraph}; text-align: center;">
      ${t.newsletterWelcome.thankYou}
    </p>

    ${renderDivider('gold')}

    <!-- What to expect section -->
    ${renderDarkSection(`
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center">
            <p style="
              font-family: ${typography.fontFamilySans};
              font-size: ${typography.fontSizeSm};
              font-weight: ${typography.fontWeightSemibold};
              color: ${colors.accent};
              text-transform: uppercase;
              letter-spacing: ${typography.letterSpacingWidest};
              margin: 0 0 ${spacing.lg} 0;
            ">
              ${t.newsletterWelcome.whatToExpect}
            </p>
          </td>
        </tr>
      </table>

      <!-- Benefits list -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${renderBenefitRow('&#127873;', t.newsletterWelcome.exclusiveOffers)}
        ${renderBenefitRow('&#10024;', t.newsletterWelcome.newArrivals)}
        ${renderBenefitRow('&#128161;', t.newsletterWelcome.fragranceTips)}
      </table>
    `)}

    <!-- CTA Button -->
    ${renderButton(t.newsletterWelcome.cta, `${config.CLIENT_URL}/${locale}/store`, 'gold')}

    ${renderDivider()}

    <!-- Footer message -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <p style="${styles.fontSerif}; font-size: ${typography.fontSize2xl}; color: ${colors.gray800}; margin: 0 0 ${spacing.sm} 0; font-style: italic;">
            "${t.newsletterWelcome.footer}"
          </p>
          <p style="
            font-family: ${typography.fontFamilySans};
            font-size: ${typography.fontSizeSm};
            color: ${colors.accent};
            text-transform: uppercase;
            letter-spacing: ${typography.letterSpacingWide};
            margin: 0;
          ">
            &mdash; The Perfumes Store Team
          </p>
        </td>
      </tr>
    </table>

    ${renderUnsubscribeNotice(t.newsletterWelcome.unsubscribe)}
  `
}

/**
 * Render a benefit row with icon
 */
function renderBenefitRow(icon: string, text: string): string {
  return `
    <tr>
      <td style="padding: ${spacing.sm} 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="50" align="center" valign="top">
              <span style="
                display: inline-block;
                width: 40px;
                height: 40px;
                background-color: rgba(184, 134, 11, 0.2);
                border-radius: 50%;
                line-height: 40px;
                font-size: 18px;
                text-align: center;
              ">${icon}</span>
            </td>
            <td style="
              font-family: ${typography.fontFamilySans};
              font-size: ${typography.fontSizeBase};
              color: ${colors.white};
              padding-left: ${spacing.md};
              line-height: ${typography.lineHeightRelaxed};
            ">
              ${text}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

/**
 * Render plain text version
 */
function renderText(
  locale: Locale,
  t: ReturnType<typeof getTranslations>
): string {
  return `
═══════════════════════════════════════════════════
                 PERFUMES STORE
              Luxury Fragrances
═══════════════════════════════════════════════════

${t.newsletterWelcome.title}

${t.newsletterWelcome.greeting}

${t.newsletterWelcome.thankYou}

───────────────────────────────────────────────────
${t.newsletterWelcome.whatToExpect}
───────────────────────────────────────────────────

  * ${t.newsletterWelcome.exclusiveOffers}
  * ${t.newsletterWelcome.newArrivals}
  * ${t.newsletterWelcome.fragranceTips}

═══════════════════════════════════════════════════

${t.newsletterWelcome.cta}: ${config.CLIENT_URL}/${locale}/store

───────────────────────────────────────────────────

"${t.newsletterWelcome.footer}"
— The Perfumes Store Team

───────────────────────────────────────────────────
${t.newsletterWelcome.unsubscribe}
───────────────────────────────────────────────────
  `.trim()
}

/**
 * Get sample data for preview
 */
export function getSampleData(): NewsletterWelcomeData {
  return {
    email: 'subscriber@example.com',
  }
}
