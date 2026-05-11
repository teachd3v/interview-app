import { create } from 'zustand'

export interface FormResult {
  id: string
  candidateId: string
  candidateName: string
  interviewDate: string
  submittedAt: string

  // Part A: Mandatory qualifications (8 items, boolean)
  partA: Array<{
    id: string
    label: string
    value: boolean
  }>

  // Part B: Supporting qualifications (20 items, 0-2 score)
  partB: Array<{
    id: string
    label: string
    aspect: string
    value: 'yes' | 'maybe' | 'no'
    score: number // 0=tidak, 1=ragu, 2=ya
  }>

  // Part C: Notes
  notes: string

  // Scoring
  partAPass: boolean // All mandatory qualifications met
  partBTotal: number // Sum of all scores (0-40)
  partBPercentage: number // (partBTotal / 40) * 100
}

interface FormResultsStore {
  results: FormResult[]
  addResult: (result: FormResult) => void
  getResult: (candidateId: string) => FormResult | undefined
  deleteResult: (resultId: string) => void
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
}

const STORAGE_KEY = 'interview-app:form-results'

export const useFormResultsStore = create<FormResultsStore>((set, get) => ({
  results: [],

  addResult: (result) => {
    set((state) => ({
      results: [...state.results, result],
    }))
    get().saveToLocalStorage()
  },

  getResult: (candidateId) => {
    const state = get()
    return state.results.find((r) => r.candidateId === candidateId)
  },

  deleteResult: (resultId) => {
    set((state) => ({
      results: state.results.filter((r) => r.id !== resultId),
    }))
    get().saveToLocalStorage()
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        set({ results: JSON.parse(stored) })
      }
    } catch (error) {
      console.error('Failed to load form results from localStorage:', error)
    }
  },

  saveToLocalStorage: () => {
    try {
      const { results } = get()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
    } catch (error) {
      console.error('Failed to save form results to localStorage:', error)
    }
  },
}))
