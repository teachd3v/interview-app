import { create } from 'zustand'
import { Interviewer } from '../mocks/data'

export interface InterviewSchedule {
  id: string
  date: string
  pusat: Interviewer | null
  cabang: Interviewer | null
  mentor: Interviewer | null
  candidateIds: string[]
  status: 'belum' | 'berjalan' | 'selesai'
}

interface ScheduleStore {
  schedules: InterviewSchedule[]
  createSchedule: (date: string, pusat: Interviewer | null, cabang: Interviewer | null, mentor: Interviewer | null, candidateIds: string[]) => string
  deleteSchedule: (id: string) => void
  updateSchedule: (id: string, updates: Partial<InterviewSchedule>) => void
  addCandidatesToSchedule: (scheduleId: string, candidateIds: string[]) => void
  removeCandidateFromSchedule: (scheduleId: string, candidateId: string) => void
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
}

const STORAGE_KEY = 'interview-app:schedules'

const generateId = () => `sch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  schedules: [],

  createSchedule: (date, pusat, cabang, mentor, candidateIds) => {
    const id = generateId()
    const newSchedule: InterviewSchedule = {
      id,
      date,
      pusat,
      cabang,
      mentor,
      candidateIds,
      status: 'belum',
    }
    set((state) => ({
      schedules: [...state.schedules, newSchedule],
    }))
    get().saveToLocalStorage()
    return id
  },

  deleteSchedule: (id) => {
    set((state) => ({
      schedules: state.schedules.filter((sch) => sch.id !== id),
    }))
    get().saveToLocalStorage()
  },

  updateSchedule: (id, updates) => {
    set((state) => ({
      schedules: state.schedules.map((sch) => (sch.id === id ? { ...sch, ...updates } : sch)),
    }))
    get().saveToLocalStorage()
  },

  addCandidatesToSchedule: (scheduleId, candidateIds) => {
    set((state) => ({
      schedules: state.schedules.map((sch) => {
        if (sch.id === scheduleId) {
          const uniqueIds = [...new Set([...sch.candidateIds, ...candidateIds])]
          return { ...sch, candidateIds: uniqueIds }
        }
        return sch
      }),
    }))
    get().saveToLocalStorage()
  },

  removeCandidateFromSchedule: (scheduleId, candidateId) => {
    set((state) => ({
      schedules: state.schedules.map((sch) => {
        if (sch.id === scheduleId) {
          return { ...sch, candidateIds: sch.candidateIds.filter((id) => id !== candidateId) }
        }
        return sch
      }),
    }))
    get().saveToLocalStorage()
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        set({ schedules: JSON.parse(stored) })
      }
    } catch (error) {
      console.error('Failed to load schedules from localStorage:', error)
    }
  },

  saveToLocalStorage: () => {
    try {
      const { schedules } = get()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
    } catch (error) {
      console.error('Failed to save schedules to localStorage:', error)
    }
  },
}))
