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
} from './base'

// ============================================================================
// Types
// ============================================================================

export interface CampaignContent {
  subject: Record<Locale, string>
  heading: Record<Locale, string>
  body: Record<Locale, string> // HTML content
  ctaText?: Record<Locale, string>
  ctaUrl?: string
}

// ============================================================================
// Campaign Layout Components
// ============================================================================

/**
 * Render the "Special Offer" badge at top of campaign emails
 */
export function renderCampaignBadge(text: string = '&#10024; Special Offer'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: ${spacing.md};">
      <tr>
        <td align="center">
          <span style="
            display: inline-block;
            padding: ${spacing.xs} ${spacing.md};
            background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%);
            color: ${colors.white};
            font-family: ${typography.fontFamilySans};
            font-size: ${typography.fontSizeXs};
            font-weight: ${typography.fontWeightSemibold};
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: ${typography.letterSpacingWidest};
          ">
            ${text}
          </span>
        </td>
      </tr>
    </table>
  `
}

/**
 * Render a gold star
 */
function renderStar(): string {
  return `
    <td style="padding: 0 2px;">
      <span style="color: ${colors.accent}; font-size: 16px;">&#9733;</span>
    </td>
  `
}

/**
 * Render social proof section with stars
 */
export function renderSocialProof(text: string = 'Trusted by thousands of fragrance lovers'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: ${spacing.lg} 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              ${renderStar()}${renderStar()}${renderStar()}${renderStar()}${renderStar()}
            </tr>
          </table>
          <p style="
            font-family: ${typography.fontFamily};
            font-size: ${typography.fontSizeSm};
            color: ${colors.gray500};
            margin: ${spacing.sm} 0 0 0;
            font-style: italic;
          ">
            ${text}
          </p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Render "Browse Collection" link
 */
export function renderBrowseLink(locale: Locale, text: string = 'Browse Our Full Collection'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="${config.CLIENT_URL}/${locale}/store" style="
            font-family: ${typography.fontFamilySans};
            font-size: ${typography.fontSizeSm};
            color: ${colors.accent};
            text-decoration: none;
            border-bottom: 1px solid ${colors.accent};
          ">
            ${text} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `
}

/**
 * Format body content with better styling
 */
export function formatBodyContent(body: string): string {
  let formatted = body

  // Wrap plain paragraphs
  formatted = formatted.replace(
    /<p>/g,
    `<p style="margin: 0 0 ${spacing.md} 0;">`
  )

  // Style strong tags
  formatted = formatted.replace(
    /<strong>/g,
    `<strong style="color: ${colors.gray900}; font-weight: ${typography.fontWeightSemibold};">`
  )

  // Style discount/sale highlights
  formatted = formatted.replace(
    /(\d+%\s*off)/gi,
    `<span style="color: ${colors.accent}; font-weight: ${typography.fontWeightBold};">$1</span>`
  )

  return formatted
}

// ============================================================================
// Main Campaign Render Function
// ============================================================================

/**
 * Render a campaign email with the standard layout
 * This is the main function campaign templates should use
 */
export function renderCampaignEmail(
  content: CampaignContent,
  locale: Locale
): { subject: string; html: string; text: string } {
  const t = getTranslations(locale)

  const subject = content.subject[locale] || content.subject.en
  const heading = content.heading[locale] || content.heading.en
  const body = content.body[locale] || content.body.en
  const ctaText = content.ctaText?.[locale] || content.ctaText?.en
  const ctaUrl = content.ctaUrl

  const htmlContent = renderCampaignHtml(heading, body, ctaText, ctaUrl, locale, t)
  const html = baseLayout(htmlContent, {
    locale,
    previewText: heading,
  })

  const text = renderCampaignText(heading, body, ctaText, ctaUrl, locale, t)

  return { subject, html, text }
}

/**
 * Render HTML content for campaign
 */
function renderCampaignHtml(
  heading: string,
  body: string,
  ctaText: string | undefined,
  ctaUrl: string | undefined,
  locale: Locale,
  t: ReturnType<typeof getTranslations>
): string {
  return `
    ${renderCampaignBadge()}

    <!-- Heading -->
    <h1 style="${styles.title}; text-align: center; font-size: ${typography.fontSize4xl};">${heading}</h1>

    ${renderDivider('gold')}

    <!-- Body Content -->
    <div style="
      font-family: ${typography.fontFamilySans};
      font-size: ${typography.fontSizeBase};
      color: ${colors.gray700};
      line-height: ${typography.lineHeightRelaxed};
    ">
      ${formatBodyContent(body)}
    </div>

    <!-- CTA Button -->
    ${ctaText && ctaUrl ? renderButton(ctaText, ctaUrl, 'gold') : ''}

    ${renderDivider()}

    ${renderSocialProof()}

    ${renderBrowseLink(locale)}

    ${renderUnsubscribeNotice(t.newsletterWelcome.unsubscribe)}
  `
}

/**
 * Render plain text version of campaign
 */
function renderCampaignText(
  heading: string,
  body: string,
  ctaText: string | undefined,
  ctaUrl: string | undefined,
  locale: Locale,
  t: ReturnType<typeof getTranslations>
): string {
  // Strip HTML for plain text version
  const plainBody = body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\n +/g, '\n')
    .trim()

  return `
═══════════════════════════════════════════════════
                 PERFUMES STORE
              Luxury Fragrances
═══════════════════════════════════════════════════

★ SPECIAL OFFER ★

${heading}

───────────────────────────────────────────────────

${plainBody}

${ctaText && ctaUrl ? `
═══════════════════════════════════════════════════
${ctaText}: ${ctaUrl}
═══════════════════════════════════════════════════
` : ''}

★★★★★ Trusted by thousands of fragrance lovers

───────────────────────────────────────────────────
Browse Our Full Collection: ${config.CLIENT_URL}/${locale}/store
───────────────────────────────────────────────────

${t.newsletterWelcome.unsubscribe}
  `.trim()
}
