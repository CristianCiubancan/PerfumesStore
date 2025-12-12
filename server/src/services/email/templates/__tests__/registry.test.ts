import {
  getAllTemplates,
  getTemplate,
  hasTemplate,
  renderTemplate,
  renderTemplatePreview,
  getTemplateSampleData,
  templates,
  SUPPORTED_LOCALES,
} from '../index'

// Mock config
jest.mock('../../../../config', () => ({
  config: {
    CLIENT_URL: 'https://example.com',
  },
}))

describe('Email Template Registry', () => {
  describe('getAllTemplates', () => {
    it('should return all registered templates', () => {
      const templateList = getAllTemplates()

      expect(templateList).toBeDefined()
      expect(Array.isArray(templateList)).toBe(true)
      expect(templateList.length).toBeGreaterThanOrEqual(2)
    })

    it('should include order-confirmation template', () => {
      const templateList = getAllTemplates()
      const orderTemplate = templateList.find(t => t.id === 'order-confirmation')

      expect(orderTemplate).toBeDefined()
      expect(orderTemplate?.name).toBe('Order Confirmation')
      expect(orderTemplate?.category).toBe('transactional')
    })

    it('should include newsletter-welcome template', () => {
      const templateList = getAllTemplates()
      const welcomeTemplate = templateList.find(t => t.id === 'newsletter-welcome')

      expect(welcomeTemplate).toBeDefined()
      expect(welcomeTemplate?.name).toBe('Newsletter Welcome')
    })

    it('should return metadata with required fields', () => {
      const templateList = getAllTemplates()

      templateList.forEach(template => {
        expect(template.id).toBeDefined()
        expect(template.name).toBeDefined()
        expect(template.description).toBeDefined()
        expect(template.category).toBeDefined()
        expect(template.variables).toBeDefined()
        expect(Array.isArray(template.variables)).toBe(true)
      })
    })
  })

  describe('getTemplate', () => {
    it('should return template by id', () => {
      const template = getTemplate('order-confirmation')

      expect(template).toBeDefined()
      expect(template?.metadata.id).toBe('order-confirmation')
    })

    it('should return undefined for non-existent template', () => {
      const template = getTemplate('non-existent')
      expect(template).toBeUndefined()
    })

    it('should return template with render function', () => {
      const template = getTemplate('newsletter-welcome')

      expect(template).toBeDefined()
      expect(typeof template?.render).toBe('function')
    })

    it('should return template with getSampleData function', () => {
      const template = getTemplate('newsletter-welcome')

      expect(template).toBeDefined()
      expect(typeof template?.getSampleData).toBe('function')
    })
  })

  describe('hasTemplate', () => {
    it('should return true for existing templates', () => {
      expect(hasTemplate('order-confirmation')).toBe(true)
      expect(hasTemplate('newsletter-welcome')).toBe(true)
    })

    it('should return false for non-existent templates', () => {
      expect(hasTemplate('non-existent')).toBe(false)
      expect(hasTemplate('')).toBe(false)
      expect(hasTemplate('invalid-id')).toBe(false)
    })
  })

  describe('renderTemplate', () => {
    it('should render order-confirmation template', () => {
      const sampleData = getTemplateSampleData('order-confirmation')
      const result = renderTemplate('order-confirmation', sampleData, 'en')

      expect(result).toBeDefined()
      expect(result?.subject).toBeDefined()
      expect(result?.html).toContain('<!DOCTYPE html>')
      expect(result?.text).toBeDefined()
    })

    it('should render newsletter-welcome template', () => {
      const result = renderTemplate('newsletter-welcome', { email: 'test@example.com' }, 'en')

      expect(result).toBeDefined()
      expect(result?.subject).toBeDefined()
      expect(result?.html).toContain('<!DOCTYPE html>')
    })

    it('should return null for non-existent template', () => {
      const result = renderTemplate('non-existent', {}, 'en')
      expect(result).toBeNull()
    })

    it.each(SUPPORTED_LOCALES)('should render template in locale %s', (locale) => {
      const result = renderTemplate('newsletter-welcome', {}, locale)

      expect(result).toBeDefined()
      expect(result?.html).toContain(`lang="${locale}"`)
    })
  })

  describe('renderTemplatePreview', () => {
    it('should render preview with sample data for order-confirmation', () => {
      const result = renderTemplatePreview('order-confirmation', 'en')

      expect(result).toBeDefined()
      expect(result?.subject).toBeDefined()
      expect(result?.html).toContain('<!DOCTYPE html>')
      expect(result?.html).toContain('ORD-') // Sample order number
    })

    it('should render preview with sample data for newsletter-welcome', () => {
      const result = renderTemplatePreview('newsletter-welcome', 'en')

      expect(result).toBeDefined()
      expect(result?.html).toContain('<!DOCTYPE html>')
    })

    it('should return null for non-existent template', () => {
      const result = renderTemplatePreview('non-existent', 'en')
      expect(result).toBeNull()
    })

    it.each(SUPPORTED_LOCALES)('should render preview in locale %s', (locale) => {
      const result = renderTemplatePreview('newsletter-welcome', locale)

      expect(result).toBeDefined()
      expect(result?.html).toContain(`lang="${locale}"`)
    })
  })

  describe('getTemplateSampleData', () => {
    it('should return sample data for order-confirmation', () => {
      const sampleData = getTemplateSampleData('order-confirmation') as any

      expect(sampleData).toBeDefined()
      expect(sampleData.order).toBeDefined()
      expect(sampleData.order.orderNumber).toBeDefined()
      expect(sampleData.order.items).toBeDefined()
    })

    it('should return sample data for newsletter-welcome', () => {
      const sampleData = getTemplateSampleData('newsletter-welcome') as any

      expect(sampleData).toBeDefined()
      expect(sampleData.email).toBeDefined()
    })

    it('should return null for non-existent template', () => {
      const sampleData = getTemplateSampleData('non-existent')
      expect(sampleData).toBeNull()
    })
  })

  describe('templates object (direct exports)', () => {
    it('should have orderConfirmation template', () => {
      expect(templates.orderConfirmation).toBeDefined()
      expect(typeof templates.orderConfirmation.render).toBe('function')
      expect(typeof templates.orderConfirmation.getSampleData).toBe('function')
      expect(templates.orderConfirmation.metadata).toBeDefined()
    })

    it('should have newsletterWelcome template', () => {
      expect(templates.newsletterWelcome).toBeDefined()
      expect(typeof templates.newsletterWelcome.render).toBe('function')
      expect(typeof templates.newsletterWelcome.getSampleData).toBe('function')
      expect(templates.newsletterWelcome.metadata).toBeDefined()
    })

    it('should render templates via direct exports', () => {
      const sampleData = templates.orderConfirmation.getSampleData()
      const result = templates.orderConfirmation.render(sampleData, 'en')

      expect(result.subject).toBeDefined()
      expect(result.html).toBeDefined()
      expect(result.text).toBeDefined()
    })
  })
})
