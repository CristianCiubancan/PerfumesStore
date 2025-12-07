import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../auth'
import { User } from '@/types'

describe('useAuthStore', () => {
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    createdAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isHydrating: true,
    })
  })

  describe('initial state', () => {
    it('has null user initially', () => {
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('is not authenticated initially', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('is hydrating initially', () => {
      expect(useAuthStore.getState().isHydrating).toBe(true)
    })
  })

  describe('setAuth', () => {
    it('sets user and authentication state', () => {
      useAuthStore.getState().setAuth(mockUser)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isHydrating).toBe(false)
    })

    it('handles admin user', () => {
      const adminUser: User = { ...mockUser, role: 'ADMIN' }
      useAuthStore.getState().setAuth(adminUser)

      expect(useAuthStore.getState().user?.role).toBe('ADMIN')
    })
  })

  describe('clearAuth', () => {
    it('clears user and authentication state', () => {
      // First set auth
      useAuthStore.getState().setAuth(mockUser)

      // Then clear
      useAuthStore.getState().clearAuth()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isHydrating).toBe(false)
    })

    it('works even when not authenticated', () => {
      useAuthStore.getState().clearAuth()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('setHydrating', () => {
    it('sets hydrating to true', () => {
      useAuthStore.getState().setHydrating(false)
      useAuthStore.getState().setHydrating(true)

      expect(useAuthStore.getState().isHydrating).toBe(true)
    })

    it('sets hydrating to false', () => {
      useAuthStore.getState().setHydrating(false)

      expect(useAuthStore.getState().isHydrating).toBe(false)
    })
  })
})
