import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  role: string | null
  interviewerId: string | null
  interviewerName: string | null
  setRole: (role: 'admin' | 'pusat' | 'cabang' | 'mentor' | null) => void
  setInterviewer: (id: string, name: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      role: null,
      interviewerId: null,
      interviewerName: null,

      setRole: (role) => {
        set({ role })
      },

      setInterviewer: (id, name) => {
        set({ interviewerId: id, interviewerName: name })
      },

      logout: () => {
        set({ role: null, interviewerId: null, interviewerName: null })
      },
    }),
    {
      name: 'auth-store',
    }
  )
)