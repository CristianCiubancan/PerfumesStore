import { metadata, render, getSampleData } from '../example-promo'

// Mock config
jest.mock('../../../../../config', () => ({
  config: {
    CLIENT_URL: 'http://localhost:3000',
  },
}))

describe('example-promo campaign template', () => {
  // ============================================================================
  // metadata
  // ============================================================================

  describe('metadata', () => {
    it('should have correct template id', () => {
      expect(metadata.id).toBe('campaign-example-promo')
    })

    it('should have category as campaign', () => {
      expect(metadata.category).toBe('campaign')
    })

    it('should have a name and description', () => {
      expect(metadata.name).toBe('Example Promotion')
      expect(metadata.description).toBeDefined()
    })

    it('should have empty variables array', () => {
      expect(metadata.variables).toEqual([])
    })
  })

  // ============================================================================
  // render
  // ============================================================================

  describe('render', () => {
    it('should render English version correctly', () => {
      const result = render({}, 'en')

      expect(result.subject).toBe('Exclusive Offer Just for You!')
      expect(result.html).toContain('Discover Our Latest Collection')
      expect(result.html).toContain('Shop Now')
      expect(result.html).toContain('http://localhost:3000/store')
      expect(result.text).toContain('Discover Our Latest Collection')
    })

    it('should render Romanian version correctly', () => {
      const result = render({}, 'ro')

      expect(result.subject).toBe('Ofertă Exclusivă Doar Pentru Tine!')
      expect(result.html).toContain('Descoperă Ultima Noastră Colecție')
      expect(result.html).toContain('Cumpără Acum')
    })

    it('should render French version correctly', () => {
      const result = render({}, 'fr')

      expect(result.subject).toBe('Offre Exclusive Rien Que Pour Vous!')
      expect(result.html).toContain('Découvrez Notre Dernière Collection')
      expect(result.html).toContain('Acheter Maintenant')
    })

    it('should render German version correctly', () => {
      const result = render({}, 'de')

      expect(result.subject).toBe('Exklusives Angebot Nur Für Sie!')
      expect(result.html).toContain('Entdecken Sie Unsere Neueste Kollektion')
      expect(result.html).toContain('Jetzt Einkaufen')
    })

    it('should render Spanish version correctly', () => {
      const result = render({}, 'es')

      expect(result.subject).toBe('¡Oferta Exclusiva Solo Para Ti!')
      expect(result.html).toContain('Descubre Nuestra Última Colección')
      expect(result.html).toContain('Comprar Ahora')
    })

    it('should return subject, html, and text', () => {
      const result = render({}, 'en')

      expect(result).toHaveProperty('subject')
      expect(result).toHaveProperty('html')
      expect(result).toHaveProperty('text')
      expect(typeof result.subject).toBe('string')
      expect(typeof result.html).toBe('string')
      expect(typeof result.text).toBe('string')
    })

    it('should include CTA URL in all locales', () => {
      const locales: Array<'en' | 'ro' | 'fr' | 'de' | 'es'> = ['en', 'ro', 'fr', 'de', 'es']

      for (const locale of locales) {
        const result = render({}, locale)
        expect(result.html).toContain('http://localhost:3000/store')
      }
    })
  })

  // ============================================================================
  // getSampleData
  // ============================================================================

  describe('getSampleData', () => {
    it('should return empty object', () => {
      const data = getSampleData()

      expect(data).toEqual({})
    })
  })
})
