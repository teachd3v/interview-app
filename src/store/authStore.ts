import { create } from 'zustand'

type Role = 'admin' | 'pusat' | 'cabang' | 'mentor' | null

interface AuthStore {
  role: Role
  setRole: (role: Role) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  role: null,
  setRole: (role) => set({ role }),
  logout: () => set({ role: null }),
}))
