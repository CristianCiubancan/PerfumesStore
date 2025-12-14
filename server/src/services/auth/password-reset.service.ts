import crypto from 'crypto'
import { prisma } from '../../lib/prisma'
import { hashToken } from '../../lib/jwt'
import { hashPassword } from './password.service'
import { revokeAllUserTokens } from './token.service'
import { AUTH } from '../../config/constants'
import { logger } from '../../lib/logger'
import { AppError } from '../../middleware/errorHandler'

/**
 * Generate a secure random token for password reset
 * 32 bytes = 256 bits of entropy, hex-encoded to 64 characters
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Request password reset - creates token and returns it
 * Returns null if user doesn't exist (for timing-safe responses)
 * SEC: Always performs hash operation to maintain constant timing
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  })

  if (!user) {
    // Return null but still perform hash to maintain timing consistency
    const dummyToken = generateResetToken()
    hashToken(dummyToken) // Timing-safe: always perform hash operation
    return null
  }

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
    data: {
      usedAt: new Date(), // Mark as used to invalidate
    },
  })

  // Generate new token
  const token = generateResetToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + AUTH.PASSWORD_RESET_TOKEN_EXPIRY_MS)

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  })

  logger.info(`Password reset token created for user ${user.id}`, 'PasswordResetService')

  return token
}

/**
 * Verify reset token and return user ID if valid
 */
export async function verifyResetToken(token: string): Promise<{ userId: number } | null> {
  const tokenHash = hashToken(token)

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { userId: true },
  })

  return resetToken ? { userId: resetToken.userId } : null
}

/**
 * Reset password using token
 * Validates token, updates password, marks token as used, and revokes all sessions
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token)

  // Find and validate token, then reset password in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const resetToken = await tx.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    })

    if (!resetToken) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN')
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update user password
    await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: newPasswordHash },
    })

    // Mark token as used
    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    logger.info(`Password reset completed for user ${resetToken.userId}`, 'PasswordResetService')

    return { userId: resetToken.userId }
  })

  // Revoke all user sessions after transaction completes
  // This ensures the user must log in again with their new password
  await revokeAllUserTokens(result.userId)
}

/**
 * Clean up expired and used password reset tokens
 * Should be called periodically (can share cron with token cleanup)
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
  const result = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  })

  if (result.count > 0) {
    logger.info(`Cleaned up ${result.count} expired/used password reset tokens`, 'PasswordResetService')
  }

  return result.count
}
