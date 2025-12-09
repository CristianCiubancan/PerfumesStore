import bcrypt from 'bcrypt'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../middleware/errorHandler'
import { AUTH } from '../../config/constants'
import { logger } from '../../lib/logger'
import { ChangePasswordInput } from '../../schemas/auth'
import { revokeAllUserTokens } from './token.service'

// Dummy hash for constant-time comparison when user doesn't exist
// This prevents timing attacks that could reveal whether a user exists
const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.hbQYdZ9dGq/3Zy'

export { DUMMY_HASH }

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH.BCRYPT_SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Change user password and invalidate all sessions
 */
export async function changePassword(userId: number, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND')
  }

  const isValidPassword = await verifyPassword(input.currentPassword, user.passwordHash)

  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD')
  }

  const newPasswordHash = await hashPassword(input.newPassword)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  })

  // SECURITY: Invalidate all existing sessions on password change
  await revokeAllUserTokens(userId)

  logger.info(`Password changed for user ${userId}, all sessions invalidated`, 'PasswordService')

  return { message: 'Password changed successfully. Please login again.' }
}
