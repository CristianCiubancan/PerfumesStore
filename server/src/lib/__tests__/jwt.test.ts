// Unmock jwt module for this test file
jest.unmock('../jwt')

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  TokenPayload,
} from '../jwt'

describe('JWT utilities', () => {
  const mockPayload: TokenPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'ADMIN',
    tokenVersion: 0,
  }

  describe('generateAccessToken', () => {
    it('should generate a valid JWT access token', () => {
      const token = generateAccessToken(mockPayload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT format: header.payload.signature
    })

    it('should include payload in token', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = verifyAccessToken(token)
      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.role).toBe(mockPayload.role)
      expect(decoded.tokenVersion).toBe(mockPayload.tokenVersion)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT refresh token with jti', () => {
      const { token, jti } = generateRefreshToken(mockPayload)
      expect(token).toBeDefined()
      expect(jti).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should generate unique jti for each token', () => {
      const result1 = generateRefreshToken(mockPayload)
      const result2 = generateRefreshToken(mockPayload)
      expect(result1.jti).not.toBe(result2.jti)
    })

    it('should include jti in decoded token', () => {
      const { token, jti } = generateRefreshToken(mockPayload)
      const decoded = verifyRefreshToken(token)
      expect(decoded.jti).toBe(jti)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const token = generateAccessToken(mockPayload)
      const decoded = verifyAccessToken(token)
      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow()
    })

    it('should throw error for tampered token', () => {
      const token = generateAccessToken(mockPayload)
      const tamperedToken = token.slice(0, -5) + 'XXXXX'
      expect(() => verifyAccessToken(tamperedToken)).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const { token } = generateRefreshToken(mockPayload)
      const decoded = verifyRefreshToken(token)
      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.jti).toBeDefined()
    })

    it('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow()
    })

    it('should throw error when using access token secret', () => {
      const accessToken = generateAccessToken(mockPayload)
      expect(() => verifyRefreshToken(accessToken)).toThrow()
    })
  })

  describe('hashToken', () => {
    it('should hash a token consistently', () => {
      const token = 'test-token'
      const hash1 = hashToken(token)
      const hash2 = hashToken(token)
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different tokens', () => {
      const hash1 = hashToken('token1')
      const hash2 = hashToken('token2')
      expect(hash1).not.toBe(hash2)
    })

    it('should produce a 64-character hex string (SHA-256)', () => {
      const hash = hashToken('test-token')
      expect(hash).toHaveLength(64)
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true)
    })
  })

  describe('getRefreshTokenExpiry', () => {
    it('should return a future date', () => {
      const expiry = getRefreshTokenExpiry()
      expect(expiry.getTime()).toBeGreaterThan(Date.now())
    })

    it('should return a date approximately 7 days in the future', () => {
      const expiry = getRefreshTokenExpiry()
      const expectedMs = 7 * 24 * 60 * 60 * 1000
      const diff = expiry.getTime() - Date.now()
      // Allow 1 second tolerance
      expect(diff).toBeGreaterThan(expectedMs - 1000)
      expect(diff).toBeLessThan(expectedMs + 1000)
    })
  })
})
