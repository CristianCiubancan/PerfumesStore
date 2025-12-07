import {
  escapeHtml,
  stripHtmlTags,
  sanitizeString,
  sanitizeProductFields,
  sanitizeProducts,
} from '../sanitize'

describe('sanitize utilities', () => {
  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
    })

    it('should escape less than', () => {
      expect(escapeHtml('a < b')).toBe('a &lt; b')
    })

    it('should escape greater than', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b')
    })

    it('should escape double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
    })

    it('should escape single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#x27;s')
    })

    it('should escape forward slash', () => {
      expect(escapeHtml('a/b')).toBe('a&#x2F;b')
    })

    it('should escape backticks', () => {
      expect(escapeHtml('`code`')).toBe('&#x60;code&#x60;')
    })

    it('should escape equals sign', () => {
      expect(escapeHtml('a=b')).toBe('a&#x3D;b')
    })

    it('should escape multiple special characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      )
    })

    it('should return empty string unchanged', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('should return string with no special characters unchanged', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World')
    })
  })

  describe('stripHtmlTags', () => {
    it('should remove simple HTML tags', () => {
      expect(stripHtmlTags('<p>Hello</p>')).toBe('Hello')
    })

    it('should remove tags with attributes', () => {
      expect(stripHtmlTags('<a href="http://example.com">Link</a>')).toBe('Link')
    })

    it('should remove multiple tags', () => {
      expect(stripHtmlTags('<div><p>Hello</p><span>World</span></div>')).toBe(
        'HelloWorld'
      )
    })

    it('should remove self-closing tags', () => {
      expect(stripHtmlTags('Hello<br/>World')).toBe('HelloWorld')
    })

    it('should handle nested tags', () => {
      expect(stripHtmlTags('<div><b><i>text</i></b></div>')).toBe('text')
    })

    it('should return string with no tags unchanged', () => {
      expect(stripHtmlTags('Hello World')).toBe('Hello World')
    })

    it('should return empty string unchanged', () => {
      expect(stripHtmlTags('')).toBe('')
    })

    it('should remove script tags', () => {
      expect(stripHtmlTags('<script>alert("XSS")</script>')).toBe(
        'alert("XSS")'
      )
    })
  })

  describe('sanitizeString', () => {
    it('should strip HTML tags but not escape special characters', () => {
      expect(sanitizeString('<script>alert("XSS")</script>')).toBe(
        'alert("XSS")'
      )
    })

    it('should handle null', () => {
      expect(sanitizeString(null)).toBe('')
    })

    it('should handle undefined', () => {
      expect(sanitizeString(undefined)).toBe('')
    })

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('')
    })

    it('should handle normal text', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World')
    })

    it('should preserve ampersand without escaping', () => {
      expect(sanitizeString('Tom & Jerry')).toBe('Tom & Jerry')
    })

    it('should preserve apostrophes without escaping', () => {
      expect(sanitizeString("L'Imperatrice")).toBe("L'Imperatrice")
    })

    it('should handle complex XSS attempts by stripping tags', () => {
      const input = '<img src="x" onerror="alert(\'XSS\')"/>'
      expect(sanitizeString(input)).not.toContain('<img')
      expect(sanitizeString(input)).not.toContain('onerror')
    })
  })

  describe('sanitizeProductFields', () => {
    it('should strip HTML from name, brand, and description fields', () => {
      const product = {
        id: 1,
        name: '<script>alert("XSS")</script>',
        brand: 'Tom & Jerry',
        description: '<b>Bold</b> text',
        price: 100,
      }

      const sanitized = sanitizeProductFields(product)

      expect(sanitized.name).toBe('alert("XSS")')
      expect(sanitized.brand).toBe('Tom & Jerry')
      expect(sanitized.description).toBe('Bold text')
      expect(sanitized.price).toBe(100)
      expect(sanitized.id).toBe(1)
    })

    it('should not modify non-string fields', () => {
      const product = {
        id: 1,
        name: 'Test',
        brand: 'Brand',
        price: 100,
        stock: 50,
        rating: 4.5,
      }

      const sanitized = sanitizeProductFields(product)

      expect(sanitized.price).toBe(100)
      expect(sanitized.stock).toBe(50)
      expect(sanitized.rating).toBe(4.5)
    })

    it('should handle product without description', () => {
      const product = {
        id: 1,
        name: 'Test',
        brand: 'Brand',
      }

      const sanitized = sanitizeProductFields(product)

      expect(sanitized.name).toBe('Test')
      expect(sanitized.brand).toBe('Brand')
    })

    it('should handle empty object', () => {
      const product = {}
      const sanitized = sanitizeProductFields(product)
      expect(sanitized).toEqual({})
    })
  })

  describe('sanitizeProducts', () => {
    it('should sanitize an array of products', () => {
      const products = [
        { id: 1, name: '<b>Product 1</b>', brand: 'Brand A' },
        { id: 2, name: '<i>Product 2</i>', brand: 'Brand B & Co' },
      ]

      const sanitized = sanitizeProducts(products)

      expect(sanitized).toHaveLength(2)
      expect(sanitized[0].name).toBe('Product 1')
      expect(sanitized[1].name).toBe('Product 2')
      expect(sanitized[1].brand).toBe('Brand B & Co')
    })

    it('should handle empty array', () => {
      const sanitized = sanitizeProducts([])
      expect(sanitized).toEqual([])
    })

    it('should preserve array order', () => {
      const products = [
        { id: 1, name: 'First', brand: 'A' },
        { id: 2, name: 'Second', brand: 'B' },
        { id: 3, name: 'Third', brand: 'C' },
      ]

      const sanitized = sanitizeProducts(products)

      expect(sanitized[0].id).toBe(1)
      expect(sanitized[1].id).toBe(2)
      expect(sanitized[2].id).toBe(3)
    })
  })
})
