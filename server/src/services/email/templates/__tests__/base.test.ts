import {
  styles,
  colors,
  formatCurrency,
  formatDate,
  interpolate,
  baseLayout,
  renderHeader,
  renderFooter,
  renderButton,
  renderSection,
  renderUnsubscribeNotice,
} from '../base'

// Mock config
jest.mock('../../../../config', () => ({
  config: {
    CLIENT_URL: 'https://example.com',
  },
}))

describe('Email Base Template', () => {
  describe('styles', () => {
    it('should have all required style properties', () => {
      expect(styles.body).toBeDefined()
      expect(styles.container).toBeDefined()
      expect(styles.header).toBeDefined()
      expect(styles.logo).toBeDefined()
      expect(styles.title).toBeDefined()
      expect(styles.subtitle).toBeDefined()
      expect(styles.paragraph).toBeDefined()
      expect(styles.card).toBeDefined()
      expect(styles.sectionTitle).toBeDefined()
      expect(styles.table).toBeDefined()
      expect(styles.tableHeader).toBeDefined()
      expect(styles.tableCell).toBeDefined()
      expect(styles.button).toBeDefined()
      expect(styles.buttonSecondary).toBeDefined()
      expect(styles.footer).toBeDefined()
      expect(styles.footerLink).toBeDefined()
    })

    it('should have color definitions', () => {
      expect(colors.primary).toBe('#1a1a1a')
      expect(colors.secondary).toBe('#6b7280')
      expect(colors.accent).toBe('#b8860b')
      expect(colors.success).toBe('#059669')
    })
  })

  describe('formatCurrency', () => {
    it('should format number amounts with RON currency', () => {
      expect(formatCurrency(100, 'en')).toBe('100.00 RON')
      expect(formatCurrency(99.99, 'ro')).toBe('99.99 RON')
      expect(formatCurrency(1000.5, 'fr')).toBe('1000.50 RON')
    })

    it('should handle Decimal-like objects', () => {
      const decimalLike = { toNumber: () => 250.75 }
      expect(formatCurrency(decimalLike, 'en')).toBe('250.75 RON')
    })

    it('should handle zero values', () => {
      expect(formatCurrency(0, 'en')).toBe('0.00 RON')
    })
  })

  describe('formatDate', () => {
    it('should format dates according to locale', () => {
      const date = new Date('2024-12-15')

      const enDate = formatDate(date, 'en')
      const roDate = formatDate(date, 'ro')
      const frDate = formatDate(date, 'fr')

      // All should contain the year
      expect(enDate).toContain('2024')
      expect(roDate).toContain('2024')
      expect(frDate).toContain('2024')

      // All should contain day 15
      expect(enDate).toContain('15')
      expect(roDate).toContain('15')
      expect(frDate).toContain('15')
    })
  })

  describe('interpolate', () => {
    it('should replace placeholders with values', () => {
      const template = 'Hello {name}, your order #{orderNumber} is confirmed!'
      const result = interpolate(template, { name: 'John', orderNumber: '12345' })

      expect(result).toBe('Hello John, your order #12345 is confirmed!')
    })

    it('should handle numeric values', () => {
      const template = 'You have {count} items totaling {total}'
      const result = interpolate(template, { count: 5, total: 99.99 })

      expect(result).toBe('You have 5 items totaling 99.99')
    })

    it('should preserve unmatched placeholders', () => {
      const template = 'Hello {name}, {unknown} placeholder'
      const result = interpolate(template, { name: 'John' })

      expect(result).toBe('Hello John, {unknown} placeholder')
    })

    it('should handle empty values object', () => {
      const template = 'Hello {name}'
      const result = interpolate(template, {})

      expect(result).toBe('Hello {name}')
    })

    it('should handle template without placeholders', () => {
      const template = 'No placeholders here'
      const result = interpolate(template, { name: 'John' })

      expect(result).toBe('No placeholders here')
    })
  })

  describe('baseLayout', () => {
    it('should render complete HTML structure', () => {
      const content = '<p>Test content</p>'
      const result = baseLayout(content, { locale: 'en' })

      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<html lang="en">')
      expect(result).toContain('<meta charset="utf-8">')
      expect(result).toContain('Test content')
      expect(result).toContain('Perfumes Store')
    })

    it('should include preview text when provided', () => {
      const result = baseLayout('<p>Content</p>', {
        locale: 'en',
        previewText: 'This is preview text',
      })

      expect(result).toContain('This is preview text')
      expect(result).toContain('display: none')
    })

    it('should set correct language attribute', () => {
      expect(baseLayout('<p>Test</p>', { locale: 'ro' })).toContain('<html lang="ro">')
      expect(baseLayout('<p>Test</p>', { locale: 'fr' })).toContain('<html lang="fr">')
      expect(baseLayout('<p>Test</p>', { locale: 'de' })).toContain('<html lang="de">')
    })

    it('should include header and footer', () => {
      const result = baseLayout('<p>Content</p>', { locale: 'en' })

      // Header
      expect(result).toContain('https://example.com')
      expect(result).toContain('PERFUMES STORE')

      // Footer
      expect(result).toContain('All rights reserved')
      expect(result).toContain(new Date().getFullYear().toString())
    })
  })

  describe('renderHeader', () => {
    it('should render header with logo link', () => {
      const header = renderHeader()

      expect(header).toContain('PERFUMES STORE')
      expect(header).toContain('https://example.com')
      expect(header).toContain('<a href=')
    })
  })

  describe('renderFooter', () => {
    it('should render footer with correct locale link', () => {
      const footer = renderFooter('en', 'Visit Store')

      expect(footer).toContain('https://example.com/en')
      expect(footer).toContain('Visit Store')
      expect(footer).toContain(new Date().getFullYear().toString())
    })

    it('should use provided visit store text', () => {
      const footer = renderFooter('ro', 'Vizitează Magazinul')

      expect(footer).toContain('Vizitează Magazinul')
      expect(footer).toContain('https://example.com/ro')
    })
  })

  describe('renderButton', () => {
    it('should render primary button by default', () => {
      const button = renderButton('Click Me', 'https://example.com/action')

      expect(button).toContain('Click Me')
      expect(button).toContain('href="https://example.com/action"')
      expect(button).toContain(styles.button)
    })

    it('should render secondary button when specified', () => {
      const button = renderButton('Secondary', 'https://example.com', 'secondary')

      expect(button).toContain('Secondary')
      expect(button).toContain(styles.buttonSecondary)
    })

    it('should render gold button when specified', () => {
      const button = renderButton('Gold CTA', 'https://example.com', 'gold')

      expect(button).toContain('Gold CTA')
      expect(button).toContain(styles.buttonGold)
    })
  })

  describe('renderSection', () => {
    it('should render section with title and content', () => {
      const section = renderSection('Section Title', '<p>Section content</p>')

      expect(section).toContain('Section Title')
      expect(section).toContain('Section content')
      expect(section).toContain(styles.card)
      expect(section).toContain(styles.sectionTitle)
    })
  })

  describe('renderUnsubscribeNotice', () => {
    it('should render unsubscribe notice', () => {
      const notice = renderUnsubscribeNotice('Click here to unsubscribe')

      expect(notice).toContain('Click here to unsubscribe')
      expect(notice).toContain('font-size:')
    })
  })
})
