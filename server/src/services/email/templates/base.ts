import { config } from '../../../config'
import { Locale, getTranslations, getDateLocale } from './translations'

// ============================================================================
// Design Tokens (Tailwind-inspired)
// ============================================================================

export const colors = {
  // Brand colors
  primary: '#1a1a1a',
  primaryLight: '#2d2d2d',
  secondary: '#6b7280',
  accent: '#b8860b', // Dark golden rod - luxury gold
  accentLight: '#daa520', // Golden rod
  accentSoft: '#f5e6c8', // Soft gold tint

  // Neutrals
  white: '#ffffff',
  gray50: '#fafafa',
  gray100: '#f4f4f5',
  gray200: '#e4e4e7',
  gray300: '#d4d4d8',
  gray400: '#a1a1aa',
  gray500: '#71717a',
  gray600: '#52525b',
  gray700: '#3f3f46',
  gray800: '#27272a',
  gray900: '#18181b',

  // Semantic
  success: '#059669',
  successLight: '#d1fae5',
  warning: '#d97706',
  warningLight: '#fef3c7',
  error: '#dc2626',
  errorLight: '#fee2e2',

  // Background
  bodyBg: '#f8f7f4', // Warm off-white
  cardBg: '#ffffff',
  cardBgAlt: '#fdfcfa',
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
}

export const typography = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontFamilySans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSizeXs: '12px',
  fontSizeSm: '14px',
  fontSizeBase: '16px',
  fontSizeLg: '18px',
  fontSizeXl: '20px',
  fontSize2xl: '24px',
  fontSize3xl: '30px',
  fontSize4xl: '36px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
  lineHeightTight: '1.25',
  lineHeightNormal: '1.5',
  lineHeightRelaxed: '1.75',
  letterSpacingTight: '-0.025em',
  letterSpacingWide: '0.05em',
  letterSpacingWidest: '0.15em',
}

// ============================================================================
// Shared Styles (Inline CSS strings)
// ============================================================================

export const styles = {
  // Body & Container
  body: `margin: 0; padding: 0; background-color: ${colors.bodyBg}; -webkit-font-smoothing: antialiased;`,

  wrapper: `width: 100%; background-color: ${colors.bodyBg}; padding: ${spacing['2xl']} ${spacing.md};`,

  container: `
    font-family: ${typography.fontFamilySans};
    max-width: 600px;
    margin: 0 auto;
    background-color: ${colors.cardBg};
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  `.replace(/\s+/g, ' ').trim(),

  // Header
  header: `
    background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%);
    padding: ${spacing.xl} ${spacing.lg};
    text-align: center;
  `.replace(/\s+/g, ' ').trim(),

  headerInner: `
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: ${spacing.lg};
  `.replace(/\s+/g, ' ').trim(),

  logo: `
    font-family: ${typography.fontFamily};
    font-size: ${typography.fontSize2xl};
    font-weight: ${typography.fontWeightBold};
    color: ${colors.white};
    text-decoration: none;
    letter-spacing: ${typography.letterSpacingWide};
  `.replace(/\s+/g, ' ').trim(),

  logoSubtext: `
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeXs};
    color: ${colors.accent};
    text-transform: uppercase;
    letter-spacing: ${typography.letterSpacingWidest};
    margin-top: ${spacing.sm};
    display: block;
  `.replace(/\s+/g, ' ').trim(),

  // Content
  content: `
    padding: ${spacing['2xl']} ${spacing.xl};
  `.replace(/\s+/g, ' ').trim(),

  // Typography
  title: `
    font-family: ${typography.fontFamily};
    font-size: ${typography.fontSize3xl};
    font-weight: ${typography.fontWeightBold};
    color: ${colors.gray900};
    margin: 0 0 ${spacing.sm} 0;
    line-height: ${typography.lineHeightTight};
    letter-spacing: ${typography.letterSpacingTight};
  `.replace(/\s+/g, ' ').trim(),

  subtitle: `
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeLg};
    color: ${colors.gray500};
    margin: 0 0 ${spacing.xl} 0;
    line-height: ${typography.lineHeightNormal};
  `.replace(/\s+/g, ' ').trim(),

  paragraph: `
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeBase};
    color: ${colors.gray700};
    line-height: ${typography.lineHeightRelaxed};
    margin: 0 0 ${spacing.lg} 0;
  `.replace(/\s+/g, ' ').trim(),

  heading2: `
    font-family: ${typography.fontFamily};
    font-size: ${typography.fontSizeXl};
    font-weight: ${typography.fontWeightSemibold};
    color: ${colors.gray900};
    margin: 0 0 ${spacing.md} 0;
  `.replace(/\s+/g, ' ').trim(),

  heading3: `
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeLg};
    font-weight: ${typography.fontWeightSemibold};
    color: ${colors.gray800};
    margin: 0 0 ${spacing.md} 0;
  `.replace(/\s+/g, ' ').trim(),

  // Cards & Sections
  card: `
    background-color: ${colors.gray50};
    border: 1px solid ${colors.gray200};
    border-radius: 12px;
    padding: ${spacing.lg};
    margin: ${spacing.lg} 0;
  `.replace(/\s+/g, ' ').trim(),

  cardAccent: `
    background: linear-gradient(135deg, ${colors.accentSoft} 0%, ${colors.white} 100%);
    border: 1px solid ${colors.accent};
    border-radius: 12px;
    padding: ${spacing.lg};
    margin: ${spacing.lg} 0;
  `.replace(/\s+/g, ' ').trim(),

  cardDark: `
    background: linear-gradient(135deg, ${colors.gray900} 0%, ${colors.gray800} 100%);
    border-radius: 12px;
    padding: ${spacing.lg};
    margin: ${spacing.lg} 0;
    color: ${colors.white};
  `.replace(/\s+/g, ' ').trim(),

  sectionTitle: `
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeSm};
    font-weight: ${typography.fontWeightSemibold};
    color: ${colors.gray500};
    text-transform: uppercase;
    letter-spacing: ${typography.letterSpacingWide};
    margin: 0 0 ${spacing.md} 0;
    padding-bottom: ${spacing.sm};
    border-bottom: 2px solid ${colors.accent};
    display: inline-block;
  `.replace(/\s+/g, ' ').trim(),

  // Dividers
  divider: `
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, ${colors.gray300} 50%, transparent 100%);
    margin: ${spacing.xl} 0;
    border: none;
  `.replace(/\s+/g, ' ').trim(),

  dividerGold: `
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, ${colors.accent} 50%, transparent 100%);
    margin: ${spacing.xl} 0;
    border: none;
  `.replace(/\s+/g, ' ').trim(),

  // Tables
  table: `width: 100%; border-collapse: collapse;`,

  tableHeader: `
    text-align: left;
    padding: ${spacing.md} ${spacing.sm};
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeSm};
    font-weight: ${typography.fontWeightSemibold};
    color: ${colors.gray500};
    text-transform: uppercase;
    letter-spacing: ${typography.letterSpacingWide};
    border-bottom: 2px solid ${colors.gray200};
  `.replace(/\s+/g, ' ').trim(),

  tableCell: `
    padding: ${spacing.md} ${spacing.sm};
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeBase};
    color: ${colors.gray700};
    border-bottom: 1px solid ${colors.gray100};
    vertical-align: top;
  `.replace(/\s+/g, ' ').trim(),

  tableCellBold: `
    padding: ${spacing.md} ${spacing.sm};
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeBase};
    font-weight: ${typography.fontWeightSemibold};
    color: ${colors.gray900};
    border-bottom: 1px solid ${colors.gray100};
    vertical-align: top;
  `.replace(/\s+/g, ' ').trim(),

  totalRow: `
    font-family: ${typography.fontFamily};
    font-weight: ${typography.fontWeightBold};
    font-size: ${typography.fontSizeLg};
    color: ${colors.gray900};
  `.replace(/\s+/g, ' ').trim(),

  // Buttons
  button: `
    display: inline-block;
    padding: ${spacing.md} ${spacing.xl};
    background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%);
    color: ${colors.white};
    text-decoration: none;
    border-radius: 8px;
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeBase};
    font-weight: ${typography.fontWeightSemibold};
    letter-spacing: ${typography.letterSpacingWide};
    text-align: center;
    box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.2);
  `.replace(/\s+/g, ' ').trim(),

  buttonGold: `
    display: inline-block;
    padding: ${spacing.md} ${spacing.xl};
    background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%);
    color: ${colors.white};
    text-decoration: none;
    border-radius: 8px;
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeBase};
    font-weight: ${typography.fontWeightSemibold};
    letter-spacing: ${typography.letterSpacingWide};
    text-align: center;
    box-shadow: 0 4px 14px 0 rgba(184, 134, 11, 0.3);
  `.replace(/\s+/g, ' ').trim(),

  buttonSecondary: `
    display: inline-block;
    padding: ${spacing.md} ${spacing.xl};
    background-color: ${colors.white};
    color: ${colors.gray800};
    text-decoration: none;
    border-radius: 8px;
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeBase};
    font-weight: ${typography.fontWeightSemibold};
    letter-spacing: ${typography.letterSpacingWide};
    text-align: center;
    border: 2px solid ${colors.gray300};
  `.replace(/\s+/g, ' ').trim(),

  buttonOutline: `
    display: inline-block;
    padding: ${spacing.md} ${spacing.xl};
    background-color: transparent;
    color: ${colors.accent};
    text-decoration: none;
    border-radius: 8px;
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeBase};
    font-weight: ${typography.fontWeightSemibold};
    letter-spacing: ${typography.letterSpacingWide};
    text-align: center;
    border: 2px solid ${colors.accent};
  `.replace(/\s+/g, ' ').trim(),

  // Footer
  footer: `
    background-color: ${colors.gray900};
    padding: ${spacing['2xl']} ${spacing.xl};
    text-align: center;
  `.replace(/\s+/g, ' ').trim(),

  footerText: `
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeSm};
    color: ${colors.gray400};
    margin: 0;
    line-height: ${typography.lineHeightRelaxed};
  `.replace(/\s+/g, ' ').trim(),

  footerLink: `
    color: ${colors.accent};
    text-decoration: none;
  `.replace(/\s+/g, ' ').trim(),

  footerLinkSubtle: `
    color: ${colors.gray400};
    text-decoration: underline;
  `.replace(/\s+/g, ' ').trim(),

  // Utility classes
  textCenter: 'text-align: center;',
  textRight: 'text-align: right;',
  textLeft: 'text-align: left;',

  textMuted: `color: ${colors.gray500}; font-size: ${typography.fontSizeSm};`,
  textSuccess: `color: ${colors.success};`,
  textWarning: `color: ${colors.warning};`,
  textError: `color: ${colors.error};`,
  textAccent: `color: ${colors.accent};`,

  fontSerif: `font-family: ${typography.fontFamily};`,
  fontSans: `font-family: ${typography.fontFamilySans};`,

  // Alerts & Notices
  alertInfo: `
    background-color: ${colors.gray100};
    border-left: 4px solid ${colors.accent};
    padding: ${spacing.md} ${spacing.lg};
    border-radius: 0 8px 8px 0;
    margin: ${spacing.lg} 0;
  `.replace(/\s+/g, ' ').trim(),

  alertSuccess: `
    background-color: ${colors.successLight};
    border-left: 4px solid ${colors.success};
    padding: ${spacing.md} ${spacing.lg};
    border-radius: 0 8px 8px 0;
    margin: ${spacing.lg} 0;
  `.replace(/\s+/g, ' ').trim(),

  alertWarning: `
    background-color: ${colors.warningLight};
    border-left: 4px solid ${colors.warning};
    padding: ${spacing.md} ${spacing.lg};
    border-radius: 0 8px 8px 0;
    margin: ${spacing.lg} 0;
  `.replace(/\s+/g, ' ').trim(),

  // Address block
  address: `
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeBase};
    color: ${colors.gray700};
    line-height: ${typography.lineHeightRelaxed};
    font-style: normal;
  `.replace(/\s+/g, ' ').trim(),

  // Badge styles
  badge: `
    display: inline-block;
    padding: ${spacing.xs} ${spacing.sm};
    background-color: ${colors.gray100};
    color: ${colors.gray700};
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeXs};
    font-weight: ${typography.fontWeightSemibold};
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: ${typography.letterSpacingWide};
  `.replace(/\s+/g, ' ').trim(),

  badgeGold: `
    display: inline-block;
    padding: ${spacing.xs} ${spacing.sm};
    background-color: ${colors.accentSoft};
    color: ${colors.accent};
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeXs};
    font-weight: ${typography.fontWeightSemibold};
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: ${typography.letterSpacingWide};
  `.replace(/\s+/g, ' ').trim(),

  badgeSuccess: `
    display: inline-block;
    padding: ${spacing.xs} ${spacing.sm};
    background-color: ${colors.successLight};
    color: ${colors.success};
    font-family: ${typography.fontFamilySans};
    font-size: ${typography.fontSizeXs};
    font-weight: ${typography.fontWeightSemibold};
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: ${typography.letterSpacingWide};
  `.replace(/\s+/g, ' ').trim(),
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format currency amount
 */
export function formatCurrency(amount: number | { toNumber: () => number }, locale: Locale): string {
  const value = typeof amount === 'number' ? amount : amount.toNumber()
  const t = getTranslations(locale)
  return `${value.toFixed(2)} ${t.common.currency}`
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(getDateLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Replace placeholders in string (e.g., {name} -> John)
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`))
}

// ============================================================================
// Base Layout Components
// ============================================================================

export interface BaseLayoutOptions {
  locale: Locale
  previewText?: string
}

/**
 * Wrap content in the base email layout
 */
export function baseLayout(content: string, options: BaseLayoutOptions): string {
  const { locale, previewText } = options
  const t = getTranslations(locale)

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <meta name="x-apple-disable-message-reformatting">
  <title>Perfumes Store</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style type="text/css">
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
  </style>
  <![endif]-->
  <style type="text/css">
    /* Reset styles */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }

    /* iOS blue links */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    /* Gmail blue links */
    u + #body a {
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      line-height: inherit;
    }

    /* Mobile styles */
    @media only screen and (max-width: 620px) {
      .wrapper { padding: 16px 8px !important; }
      .container { border-radius: 8px !important; }
      .content { padding: 24px 16px !important; }
      .footer { padding: 24px 16px !important; }
      .mobile-full { width: 100% !important; display: block !important; }
      .mobile-center { text-align: center !important; }
      .mobile-padding { padding-left: 8px !important; padding-right: 8px !important; }
    }
  </style>
</head>
<body id="body" style="${styles.body}">
  ${previewText ? `
  <!-- Preview text -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${previewText}
    ${'&nbsp;'.repeat(100)}
  </div>
  ` : ''}

  <!-- Email wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="${styles.wrapper}" class="wrapper">
    <tr>
      <td align="center">
        <!-- Email container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="${styles.container}" class="container">
          ${renderHeader()}
          <tr>
            <td style="${styles.content}" class="content">
              ${content}
            </td>
          </tr>
          ${renderFooter(locale, t.common.visitStore)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Render email header with logo
 */
export function renderHeader(): string {
  return `
          <tr>
            <td style="${styles.header}">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${config.CLIENT_URL}" style="${styles.logo}">
                      PERFUMES STORE
                    </a>
                    <span style="${styles.logoSubtext}">Luxury Fragrances</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  `
}

/**
 * Render email footer
 */
export function renderFooter(locale: Locale, visitStoreText: string): string {
  return `
          <tr>
            <td style="${styles.footer}" class="footer">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Footer logo -->
                    <p style="font-family: ${typography.fontFamily}; font-size: ${typography.fontSizeLg}; color: ${colors.white}; margin: 0 0 ${spacing.md} 0; letter-spacing: ${typography.letterSpacingWide};">
                      PERFUMES STORE
                    </p>

                    <!-- Visit store link -->
                    <p style="${styles.footerText}; margin-bottom: ${spacing.lg};">
                      <a href="${config.CLIENT_URL}/${locale}" style="${styles.footerLink}">${visitStoreText} &rarr;</a>
                    </p>

                    <!-- Divider -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100" style="margin: 0 auto ${spacing.lg} auto;">
                      <tr>
                        <td style="height: 1px; background: linear-gradient(90deg, transparent, ${colors.gray600}, transparent);"></td>
                      </tr>
                    </table>

                    <!-- Copyright -->
                    <p style="${styles.footerText}">
                      &copy; ${new Date().getFullYear()} Perfumes Store. All rights reserved.
                    </p>

                    <!-- Address -->
                    <p style="${styles.footerText}; margin-top: ${spacing.sm}; font-size: ${typography.fontSizeXs};">
                      Premium Fragrances for Discerning Tastes
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  `
}

/**
 * Render a CTA button
 */
export function renderButton(text: string, url: string, variant: 'primary' | 'gold' | 'secondary' | 'outline' = 'primary'): string {
  const styleMap = {
    primary: styles.button,
    gold: styles.buttonGold,
    secondary: styles.buttonSecondary,
    outline: styles.buttonOutline,
  }
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: ${spacing.xl} 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="${styleMap[variant]}" target="_blank">${text}</a>
        </td>
      </tr>
    </table>
  `
}

/**
 * Render a section with title
 */
export function renderSection(title: string, content: string): string {
  return `
    <div style="${styles.card}">
      ${title ? `<p style="${styles.sectionTitle}">${title}</p>` : ''}
      ${content}
    </div>
  `
}

/**
 * Render an accent section
 */
export function renderAccentSection(title: string, content: string): string {
  return `
    <div style="${styles.cardAccent}">
      ${title ? `<p style="${styles.sectionTitle}">${title}</p>` : ''}
      ${content}
    </div>
  `
}

/**
 * Render a dark section
 */
export function renderDarkSection(content: string): string {
  return `
    <div style="${styles.cardDark}">
      ${content}
    </div>
  `
}

/**
 * Render an alert/notice
 */
export function renderAlert(content: string, variant: 'info' | 'success' | 'warning' = 'info'): string {
  const styleMap = {
    info: styles.alertInfo,
    success: styles.alertSuccess,
    warning: styles.alertWarning,
  }
  return `
    <div style="${styleMap[variant]}">
      <p style="margin: 0; font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeSm}; color: ${colors.gray700};">
        ${content}
      </p>
    </div>
  `
}

/**
 * Render a divider
 */
export function renderDivider(variant: 'default' | 'gold' = 'default'): string {
  return `<hr style="${variant === 'gold' ? styles.dividerGold : styles.divider}">`
}

/**
 * Render a badge
 */
export function renderBadge(text: string, variant: 'default' | 'gold' | 'success' = 'default'): string {
  const styleMap = {
    default: styles.badge,
    gold: styles.badgeGold,
    success: styles.badgeSuccess,
  }
  return `<span style="${styleMap[variant]}">${text}</span>`
}

/**
 * Render unsubscribe notice for newsletters
 */
export function renderUnsubscribeNotice(text: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: ${spacing.xl};">
      <tr>
        <td align="center">
          <p style="font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeXs}; color: ${colors.gray400}; margin: 0;">
            ${text}
          </p>
        </td>
      </tr>
    </table>
  `
}

/**
 * Render two column layout
 */
export function renderTwoColumns(left: string, right: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: ${spacing.md} 0;">
      <tr>
        <td width="50%" valign="top" style="padding-right: ${spacing.sm};" class="mobile-full mobile-padding">
          ${left}
        </td>
        <td width="50%" valign="top" style="padding-left: ${spacing.sm};" class="mobile-full mobile-padding">
          ${right}
        </td>
      </tr>
    </table>
  `
}

/**
 * Render info row (label: value)
 */
export function renderInfoRow(label: string, value: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: ${spacing.sm};">
      <tr>
        <td style="font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeSm}; color: ${colors.gray500};">
          ${label}
        </td>
      </tr>
      <tr>
        <td style="font-family: ${typography.fontFamilySans}; font-size: ${typography.fontSizeLg}; font-weight: ${typography.fontWeightSemibold}; color: ${colors.gray900};">
          ${value}
        </td>
      </tr>
    </table>
  `
}
