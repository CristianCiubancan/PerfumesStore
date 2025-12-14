import { config } from '../../../config'
import { AUTH } from '../../../config/constants'
import { Locale, getTranslations } from './translations'
import {
  colors,
  spacing,
  typography,
  styles,
  baseLayout,
  renderButton,
  renderDivider,
  renderAlert,
} from './base'

// ============================================================================
// Types
// ============================================================================

export interface PasswordResetData {
  resetUrl: string
  expiryTime: string
}

// ============================================================================
// Template Metadata
// ============================================================================

export const metadata = {
  id: 'password-reset',
  name: 'Password Reset',
  description: 'Sent when a user requests a password reset',
  category: 'transactional',
  variables: ['resetUrl', 'expiryTime'],
}

// ============================================================================
// Template Render Functions
// ============================================================================

/**
 * Generate password reset email
 */
export function render(
  data: PasswordResetData,
  locale: Locale
): { subject: string; html: string; text: string } {
  const t = getTranslations(locale)

  const html = baseLayout(renderHtml(data, locale, t), {
    locale,
    previewText: t.passwordReset.previewText,
  })

  const text = renderText(data, locale, t)

  return { subject: t.passwordReset.subject, html, text }
}

/**
 * Render HTML content
 */
function renderHtml(
  data: PasswordResetData,
  _locale: Locale,
  t: ReturnType<typeof getTranslations>
): string {
  return `
    <!-- Lock Icon -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: ${spacing.lg};">
      <tr>
        <td align="center">
          <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, ${colors.warningLight} 0%, ${colors.white} 100%);
            border: 2px solid ${colors.warning};
            border-radius: 50%;
            display: inline-block;
            line-height: 76px;
            font-size: 36px;
          ">
            &#128274;
          </div>
        </td>
      </tr>
    </table>

    <!-- Title -->
    <h1 style="${styles.title}; text-align: center;">${t.passwordReset.title}</h1>

    <!-- Description -->
    <p style="${styles.paragraph}; text-align: center;">
      ${t.passwordReset.description}
    </p>

    ${renderDivider()}

    <!-- CTA Button -->
    ${renderButton(t.passwordReset.cta, data.resetUrl, 'primary')}

    <!-- Expiry Notice -->
    ${renderAlert(t.passwordReset.expiryNotice.replace('{time}', data.expiryTime), 'warning')}

    ${renderDivider()}

    <!-- Security Notice -->
    <p style="${styles.textMuted}; text-align: center;">
      ${t.passwordReset.securityNotice}
    </p>

    <!-- Link fallback -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: ${spacing.lg};">
      <tr>
        <td align="center">
          <p style="${styles.textMuted}; margin: 0 0 ${spacing.sm} 0;">
            ${t.passwordReset.linkFallback}
          </p>
          <p style="
            font-family: ${typography.fontFamilySans};
            font-size: ${typography.fontSizeXs};
            color: ${colors.accent};
            word-break: break-all;
            margin: 0;
          ">
            <a href="${data.resetUrl}" style="color: ${colors.accent};">${data.resetUrl}</a>
          </p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Render plain text version
 */
function renderText(
  data: PasswordResetData,
  _locale: Locale,
  t: ReturnType<typeof getTranslations>
): string {
  return `
═══════════════════════════════════════════════════
                 PERFUMES STORE
              Luxury Fragrances
═══════════════════════════════════════════════════

${t.passwordReset.title}

${t.passwordReset.description}

───────────────────────────────────────────────────
${t.passwordReset.cta}
───────────────────────────────────────────────────

${data.resetUrl}

───────────────────────────────────────────────────

${t.passwordReset.expiryNotice.replace('{time}', data.expiryTime)}

${t.passwordReset.securityNotice}

───────────────────────────────────────────────────
${t.passwordReset.linkFallback}
${data.resetUrl}
───────────────────────────────────────────────────
  `.trim()
}

/**
 * Get sample data for preview
 */
export function getSampleData(): PasswordResetData {
  return {
    resetUrl: `${config.CLIENT_URL}/en/reset-password?token=sample-token-abc123`,
    expiryTime: AUTH.PASSWORD_RESET_TOKEN_EXPIRY_DISPLAY,
  }
}
