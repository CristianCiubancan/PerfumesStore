import { z } from 'zod'
// Shared validation constants to ensure sync between client and server
import { VALIDATION_CONSTANTS } from '../../shared/validation-constants'

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

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(VALIDATION_CONSTANTS.NAME_MIN_LENGTH, VALIDATION_CONSTANTS.NAME_ERROR_MESSAGE),
    email: z.string().email('Please enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
