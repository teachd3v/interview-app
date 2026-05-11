import { create } from 'zustand'

export interface Candidate {
  id: string
  fullName: string
  school: string
  region: string
  birthDate: string
  email: string
}

interface CandidateStore {
  candidates: Candidate[]
  setCandidates: (candidates: Candidate[]) => void
  addCandidate: (candidate: Candidate) => void
  deleteCandidate: (id: string) => void
  updateCandidate: (id: string, candidate: Partial<Candidate>) => void
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
}

const STORAGE_KEY = 'interview-app:candidates'

export const useCandidateStore = create<CandidateStore>((set, get) => ({
  candidates: [],

  setCandidates: (candidates) => {
    set({ candidates })
    get().saveToLocalStorage()
  },

  addCandidate: (candidate) => {
    set((state) => ({
      candidates: [...state.candidates, candidate],
    }))
    get().saveToLocalStorage()
  },

  deleteCandidate: (id) => {
    set((state) => ({
      candidates: state.candidates.filter((c) => c.id !== id),
    }))
    get().saveToLocalStorage()
  },

  updateCandidate: (id, updates) => {
    set((state) => ({
      candidates: state.candidates.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
    get().saveToLocalStorage()
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        set({ candidates: JSON.parse(stored) })
      }
    } catch (error) {
      console.error('Failed to load candidates from localStorage:', error)
    }
  },

  saveToLocalStorage: () => {
    try {
      const { candidates } = get()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates))
    } catch (error) {
      console.error('Failed to save candidates to localStorage:', error)
    }
  },
}))
