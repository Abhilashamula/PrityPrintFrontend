import { create } from 'zustand'
import type { ApiUser } from '../lib/apiClient'

interface AuthState {
  user: ApiUser | null
  logoutMessage: string | null
  setUser: (user: ApiUser) => void
  clearUser: (message?: string) => void
  clearLogoutMessage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  logoutMessage: null,
  setUser: (user) => set({ user }),
  clearUser: (message) => set({ user: null, logoutMessage: message ?? null }),
  clearLogoutMessage: () => set({ logoutMessage: null }),
}))
