import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Interviewer {
  id: string
  full_name: string
  role: 'pusat' | 'cabang' | 'mentor'
  region: string
  email: string
}

interface InterviewerStore {
  interviewers: Interviewer[]
  setInterviewers: (interviewers: Interviewer[]) => void
  addInterviewer: (interviewer: Interviewer) => Promise<void>
  bulkAddInterviewers: (interviewers: Interviewer[]) => Promise<void>
  deleteInterviewer: (id: string) => Promise<void>
  updateInterviewer: (id: string, interviewer: Partial<Interviewer>) => Promise<void>
  getInterviewersByRole: (role: 'pusat' | 'cabang' | 'mentor') => Interviewer[]
  loadFromSupabase: () => Promise<void>
}

export const useInterviewerStore = create<InterviewerStore>((set, get) => ({
  interviewers: [],

  setInterviewers: (interviewers) => {
    set({ interviewers })
  },

  loadFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('interviewers')
        .select('*')
        .order('full_name')

      if (error) {
        console.error('Error loading interviewers:', error)
        return
      }

      // Map database fields
      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        full_name: item.full_name,
        role: item.role,
        region: item.region,
        email: item.email,
      }))

      set({ interviewers: mappedData })
    } catch (error) {
      console.error('Failed to load interviewers:', error)
    }
  },

  addInterviewer: async (interviewer) => {
    try {
      const { data, error } = await supabase
        .from('interviewers')
        .insert([interviewer])
        .select()

      if (error) {
        console.error('Error adding interviewer:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        return
      }

      if (data && data.length > 0) {
        const newInterviewer = {
          id: data[0].id,
          full_name: data[0].full_name,
          role: data[0].role,
          region: data[0].region,
          email: data[0].email,
        }
        set((state) => ({
          interviewers: [...state.interviewers, newInterviewer],
        }))
      }
    } catch (error) {
      console.error('Failed to add interviewer:', error)
    }
  },

  bulkAddInterviewers: async (interviewers) => {
    try {
      const { data, error } = await supabase
        .from('interviewers')
        .insert(interviewers)
        .select()

      if (error) {
        console.error('Error bulk adding interviewers:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        return
      }

      if (data && data.length > 0) {
        const newInterviewers = data.map((item: any) => ({
          id: item.id,
          full_name: item.full_name,
          role: item.role,
          region: item.region,
          email: item.email,
        }))
        set((state) => ({
          interviewers: [...state.interviewers, ...newInterviewers],
        }))
      }
    } catch (error) {
      console.error('Failed to bulk add interviewers:', error)
    }
  },

  deleteInterviewer: async (id) => {
    try {
      const { error } = await supabase
        .from('interviewers')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting interviewer:', error)
        return
      }

      set((state) => ({
        interviewers: state.interviewers.filter((i) => i.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete interviewer:', error)
    }
  },

  updateInterviewer: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('interviewers')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating interviewer:', error)
        return
      }

      set((state) => ({
        interviewers: state.interviewers.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      }))
    } catch (error) {
      console.error('Failed to update interviewer:', error)
    }
  },

  getInterviewersByRole: (role) => {
    return get().interviewers.filter((i) => i.role === role)
  },
}))