import {
  renderCampaignEmail,
  renderCampaignBadge,
  renderSocialProof,
  renderBrowseLink,
  formatBodyContent,
  type CampaignContent,
} from '../campaign-base'

// Mock config
jest.mock('../../../../config', () => ({
  config: {
    CLIENT_URL: 'http://localhost:3000',
  },
}))

describe('campaign-base', () => {
  // ============================================================================
  // renderCampaignBadge
  // ============================================================================

  describe('renderCampaignBadge', () => {
    it('should render badge with default text', () => {
      const badge = renderCampaignBadge()

      expect(badge).toContain('Special Offer')
      expect(badge).toContain('table')
      expect(badge).toContain('span')
    })

    it('should render badge with custom text', () => {
      const badge = renderCampaignBadge('Limited Time!')

      expect(badge).toContain('Limited Time!')
    })
  })

  // ============================================================================
  // renderSocialProof
  // ============================================================================

  describe('renderSocialProof', () => {
    it('should render social proof with default text', () => {
      const proof = renderSocialProof()

      expect(proof).toContain('Trusted by thousands of fragrance lovers')
      expect(proof).toContain('&#9733;') // Stars (HTML entity)
    })

    it('should render social proof with custom text', () => {
      const proof = renderSocialProof('Join 10,000+ happy customers')

      expect(proof).toContain('Join 10,000+ happy customers')
    })
  })

  // ============================================================================
  // renderBrowseLink
  // ============================================================================

  describe('renderBrowseLink', () => {
    it('should render browse link with locale', () => {
      const link = renderBrowseLink('en')

      expect(link).toContain('http://localhost:3000/en/store')
      expect(link).toContain('Browse Our Full Collection')
    })

    it('should render browse link with custom text', () => {
      const link = renderBrowseLink('fr', 'Voir la collection')

      expect(link).toContain('http://localhost:3000/fr/store')
      expect(link).toContain('Voir la collection')
    })

    it('should work with different locales', () => {
      const deLink = renderBrowseLink('de')
      const roLink = renderBrowseLink('ro')

      expect(deLink).toContain('/de/store')
      expect(roLink).toContain('/ro/store')
    })
  })

  // ============================================================================
  // formatBodyContent
  // ============================================================================

  describe('formatBodyContent', () => {
    it('should add margins to paragraphs', () => {
      const input = '<p>Hello</p><p>World</p>'
      const formatted = formatBodyContent(input)

      expect(formatted).toContain('margin: 0 0')
      expect(formatted).toContain('Hello')
      expect(formatted).toContain('World')
    })

    it('should style strong tags', () => {
      const input = '<p><strong>Important</strong> message</p>'
      const formatted = formatBodyContent(input)

      expect(formatted).toContain('font-weight:')
      expect(formatted).toContain('Important')
    })

    it('should highlight discount percentages', () => {
      const input = '<p>Get 20% off on all items!</p>'
      const formatted = formatBodyContent(input)

      expect(formatted).toContain('20% off')
      expect(formatted).toContain('color:') // Accent color
    })

    it('should handle various discount formats', () => {
      const input1 = formatBodyContent('Save 50% off today')
      const input2 = formatBodyContent('15%off special')

      expect(input1).toContain('50% off')
      expect(input2).toContain('15%off')
    })
  })

  // ============================================================================
  // renderCampaignEmail
  // ============================================================================

  describe('renderCampaignEmail', () => {
    const sampleContent: CampaignContent = {
      subject: {
        en: 'Summer Sale!',
        ro: 'Reduceri de Vară!',
        fr: 'Soldes d\'Été!',
        de: 'Sommerschlussverkauf!',
        es: '¡Rebajas de Verano!',
      },
      heading: {
        en: 'Up to 50% Off',
        ro: 'Reduceri de până la 50%',
        fr: 'Jusqu\'à 50% de Réduction',
        de: 'Bis zu 50% Rabatt',
        es: 'Hasta 50% de Descuento',
      },
      body: {
        en: '<p>Shop our summer collection with amazing discounts!</p>',
        ro: '<p>Cumpără din colecția de vară cu reduceri uimitoare!</p>',
        fr: '<p>Découvrez notre collection d\'été avec des réductions incroyables!</p>',
        de: '<p>Entdecken Sie unsere Sommerkollektion mit tollen Rabatten!</p>',
        es: '<p>¡Compra nuestra colección de verano con descuentos increíbles!</p>',
      },
      ctaText: {
        en: 'Shop Now',
        ro: 'Cumpără Acum',
        fr: 'Acheter Maintenant',
        de: 'Jetzt Einkaufen',
        es: 'Comprar Ahora',
      },
      ctaUrl: 'http://localhost:3000/store',
    }

    it('should render campaign email for English locale', () => {
      const result = renderCampaignEmail(sampleContent, 'en')

      expect(result.subject).toBe('Summer Sale!')
      expect(result.html).toContain('Up to 50% Off')
      expect(result.html).toContain('Shop Now')
      expect(result.html).toContain('http://localhost:3000/store')
      expect(result.text).toContain('Up to 50% Off')
    })

    it('should render campaign email for Romanian locale', () => {
      const result = renderCampaignEmail(sampleContent, 'ro')

      expect(result.subject).toBe('Reduceri de Vară!')
      expect(result.html).toContain('Reduceri de până la 50%')
      expect(result.html).toContain('Cumpără Acum')
    })

    it('should render campaign email for French locale', () => {
      const result = renderCampaignEmail(sampleContent, 'fr')

      expect(result.subject).toBe("Soldes d'Été!")
      expect(result.html).toContain("Jusqu'à 50% de Réduction")
    })

    it('should render campaign email for German locale', () => {
      const result = renderCampaignEmail(sampleContent, 'de')

      expect(result.subject).toBe('Sommerschlussverkauf!')
      expect(result.html).toContain('Bis zu 50% Rabatt')
    })

    it('should render campaign email for Spanish locale', () => {
      const result = renderCampaignEmail(sampleContent, 'es')

      expect(result.subject).toBe('¡Rebajas de Verano!')
      expect(result.html).toContain('Hasta 50% de Descuento')
    })

    it('should fallback to English when locale translation missing', () => {
      const partialContent: CampaignContent = {
        subject: { en: 'English Only', ro: '', fr: '', de: '', es: '' },
        heading: { en: 'English Heading', ro: '', fr: '', de: '', es: '' },
        body: { en: '<p>English body</p>', ro: '', fr: '', de: '', es: '' },
      }

      const result = renderCampaignEmail(partialContent, 'ro')

      // Should fallback to English
      expect(result.subject).toBe('English Only')
      expect(result.html).toContain('English Heading')
    })

    it('should render without CTA when not provided', () => {
      const noCta: CampaignContent = {
        subject: { en: 'No CTA', ro: '', fr: '', de: '', es: '' },
        heading: { en: 'Heading', ro: '', fr: '', de: '', es: '' },
        body: { en: '<p>Body</p>', ro: '', fr: '', de: '', es: '' },
      }

      const result = renderCampaignEmail(noCta, 'en')

      expect(result.html).not.toContain('Shop Now')
      expect(result.text).not.toContain('Shop Now')
    })

    it('should include required email components', () => {
      const result = renderCampaignEmail(sampleContent, 'en')

      // Should have all standard campaign components
      expect(result.html).toContain('Special Offer') // Badge
      expect(result.html).toContain('Trusted by thousands') // Social proof
      expect(result.html).toContain('Browse Our Full Collection') // Browse link
      expect(result.html).toContain('/en/store') // Locale-specific store link
    })

    it('should generate plain text version', () => {
      const result = renderCampaignEmail(sampleContent, 'en')

      expect(result.text).toContain('PERFUMES STORE')
      expect(result.text).toContain('★ SPECIAL OFFER ★')
      expect(result.text).toContain('Up to 50% Off')
      expect(result.text).toContain('Shop Now')
      expect(result.text).toContain('http://localhost:3000/store')
      expect(result.text).toContain('★★★★★')
    })

    it('should strip HTML from plain text version', () => {
      const htmlContent: CampaignContent = {
        subject: { en: 'Test', ro: '', fr: '', de: '', es: '' },
        heading: { en: 'Test', ro: '', fr: '', de: '', es: '' },
        body: {
          en: '<p>First paragraph</p><p>Second <strong>bold</strong> paragraph</p>',
          ro: '',
          fr: '',
          de: '',
          es: '',
        },
      }

      const result = renderCampaignEmail(htmlContent, 'en')

      expect(result.text).not.toContain('<p>')
      expect(result.text).not.toContain('</p>')
      expect(result.text).not.toContain('<strong>')
      expect(result.text).toContain('First paragraph')
      expect(result.text).toContain('bold')
    })
  })
})
