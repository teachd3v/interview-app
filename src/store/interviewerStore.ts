import { create } from 'zustand'

export interface Interviewer {
  id: string
  fullName: string
  role: 'pusat' | 'cabang' | 'mentor'
  region: string
  email: string
}

interface InterviewerStore {
  interviewers: Interviewer[]
  setInterviewers: (interviewers: Interviewer[]) => void
  addInterviewer: (interviewer: Interviewer) => void
  updateInterviewer: (id: string, interviewer: Partial<Interviewer>) => void
  deleteInterviewer: (id: string) => void
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
}

const STORAGE_KEY = 'interview-app:interviewers'

export const useInterviewerStore = create<InterviewerStore>((set, get) => ({
  interviewers: [],

  setInterviewers: (interviewers) => {
    set({ interviewers })
    get().saveToLocalStorage()
  },

  addInterviewer: (interviewer) => {
    set((state) => ({
      interviewers: [...state.interviewers, interviewer],
    }))
    get().saveToLocalStorage()
  },

  updateInterviewer: (id, updates) => {
    set((state) => ({
      interviewers: state.interviewers.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }))
    get().saveToLocalStorage()
  },

  deleteInterviewer: (id) => {
    set((state) => ({
      interviewers: state.interviewers.filter((i) => i.id !== id),
    }))
    get().saveToLocalStorage()
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        set({ interviewers: JSON.parse(stored) })
      }
    } catch (error) {
      console.error('Failed to load interviewers from localStorage:', error)
    }
  },

  saveToLocalStorage: () => {
    try {
      const { interviewers } = get()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(interviewers))
    } catch (error) {
      console.error('Failed to save interviewers to localStorage:', error)
    }
  },
}))
