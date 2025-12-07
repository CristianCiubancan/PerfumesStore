import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { config } from '../config'
import { AUTH } from '../config/constants'

export interface TokenPayload {
  userId: number
  email: string
  role: string
  tokenVersion: number // For global token invalidation
}

export interface RefreshTokenPayload extends TokenPayload {
  jti: string // Unique token ID for revocation tracking
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: AUTH.ACCESS_TOKEN_EXPIRY })
}

export function generateRefreshToken(payload: TokenPayload): { token: string; jti: string } {
  const jti = crypto.randomUUID()
  const token = jwt.sign(
    { ...payload, jti },
    config.JWT_REFRESH_SECRET,
    { expiresIn: AUTH.REFRESH_TOKEN_EXPIRY }
  )
  return { token, jti }
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshTokenPayload
}

/**
 * Hash a token for secure storage (never store plain tokens)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Calculate refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
  const days = parseInt(AUTH.REFRESH_TOKEN_EXPIRY, 10) || 7
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}
