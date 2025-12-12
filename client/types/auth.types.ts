/**
 * Authentication and user-related types
 */

export interface User {
  id: number
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface AuthResponse {
  user: User
}

export interface ApiError {
  message: string
  code?: string
}
