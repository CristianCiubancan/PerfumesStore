import { z } from 'zod'
// Shared validation constants to ensure sync between client and server
import { VALIDATION_CONSTANTS } from '../../../shared/validation-constants'

// Password complexity validation
// Requires: min 12 chars, uppercase, lowercase, number, special character
const passwordSchema = z
  .string()
  .min(
    VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH,
    VALIDATION_CONSTANTS.PASSWORD_ERROR_MESSAGES.MIN_LENGTH
  )
  .regex(
    VALIDATION_CONSTANTS.PASSWORD_RULES.UPPERCASE,
    VALIDATION_CONSTANTS.PASSWORD_ERROR_MESSAGES.UPPERCASE
  )
  .regex(
    VALIDATION_CONSTANTS.PASSWORD_RULES.LOWERCASE,
    VALIDATION_CONSTANTS.PASSWORD_ERROR_MESSAGES.LOWERCASE
  )
  .regex(
    VALIDATION_CONSTANTS.PASSWORD_RULES.NUMBER,
    VALIDATION_CONSTANTS.PASSWORD_ERROR_MESSAGES.NUMBER
  )
  .regex(
    VALIDATION_CONSTANTS.PASSWORD_RULES.SPECIAL_CHAR,
    VALIDATION_CONSTANTS.PASSWORD_ERROR_MESSAGES.SPECIAL_CHAR
  )

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    name: z
      .string()
      .min(VALIDATION_CONSTANTS.NAME_MIN_LENGTH, VALIDATION_CONSTANTS.NAME_ERROR_MESSAGE),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput = z.infer<typeof loginSchema>['body']
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body']
