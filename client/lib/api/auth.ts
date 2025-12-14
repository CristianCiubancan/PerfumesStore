import { api } from './client'
import { AuthResponse, User } from '@/types'

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface LoginData {
  email: string
  password: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  newPassword: string
}

export const authApi = {
  register: (data: RegisterData) => api.post<AuthResponse>('/api/auth/register', data),
  login: (data: LoginData) => api.post<AuthResponse>('/api/auth/login', data),
  logout: () => api.post<{ message: string }>('/api/auth/logout'),
  logoutAll: () => api.post<{ message: string }>('/api/auth/logout-all'),
  getProfile: () => api.get<User>('/api/auth/profile'),
  changePassword: (data: ChangePasswordData) => api.post<{ message: string }>('/api/auth/change-password', data),
  forgotPassword: (data: ForgotPasswordData) => api.post<{ message: string }>('/api/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordData) => api.post<{ message: string }>('/api/auth/reset-password', data),
}
