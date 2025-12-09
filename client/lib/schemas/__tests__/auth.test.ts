import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '../auth'

describe('loginSchema', () => {
  it('validates valid login data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
    }
    const result = loginSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'password123',
    }
    const result = loginSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  it('rejects empty password', () => {
    const invalidData = {
      email: 'test@example.com',
      password: '',
    }
    const result = loginSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('password')
    }
  })

  it('rejects missing fields', () => {
    const result = loginSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  const validData = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'TestPassword1!',
    confirmPassword: 'TestPassword1!',
  }

  it('validates valid registration data', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects short name', () => {
    const result = registerSchema.safeParse({ ...validData, name: 'J' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'invalid' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('email')
    }
  })

  describe('password validation', () => {
    it('rejects password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'Test1!',
        confirmPassword: 'Test1!',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without uppercase', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'test123!@#',
        confirmPassword: 'test123!@#',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without lowercase', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'TEST123!@#',
        confirmPassword: 'TEST123!@#',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without number', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'TestTest!@#',
        confirmPassword: 'TestTest!@#',
      })
      expect(result.success).toBe(false)
    })

    it('rejects password without special character', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'TestTest123',
        confirmPassword: 'TestTest123',
      })
      expect(result.success).toBe(false)
    })
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...validData,
      confirmPassword: 'DifferentPass1!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      // Zod refine validation puts the error on the path specified in the refine
      expect(result.error.issues.some(issue => issue.path.includes('confirmPassword'))).toBe(true)
    }
  })
})
