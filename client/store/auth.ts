import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isHydrating: boolean
  setAuth: (user: User) => void
  clearAuth: () => void
  setHydrating: (isHydrating: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrating: true,
  setAuth: (user) => {
    set({ user, isAuthenticated: true, isHydrating: false })
  },
  clearAuth: () => {
    set({ user: null, isAuthenticated: false, isHydrating: false })
  },
  setHydrating: (isHydrating) => set({ isHydrating }),
}))
