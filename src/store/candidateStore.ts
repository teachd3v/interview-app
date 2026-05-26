import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Candidate {
  id: string
  full_name: string
  school: string
  region: string
  birth_date?: string | null
  email: string
  home_visit_status?: 'pending' | 'lolos' | 'gagal'
}

interface CandidateStore {
  candidates: Candidate[]
  setCandidates: (candidates: Candidate[]) => void
  addCandidate: (candidate: Candidate) => Promise<void>
  bulkAddCandidates: (candidates: Candidate[]) => Promise<void>
  deleteCandidate: (id: string) => Promise<void>
  updateCandidate: (id: string, candidate: Partial<Candidate>) => Promise<void>
  loadFromSupabase: () => Promise<void>
  updateHomeVisitStatus: (id: string, status: 'lolos' | 'gagal' | 'pending') => Promise<void>
  bulkUpdateHomeVisitStatus: (ids: string[], status: 'lolos' | 'gagal' | 'pending') => Promise<void>
}

export const useCandidateStore = create<CandidateStore>((set) => ({
  candidates: [],

  setCandidates: (candidates) => {
    set({ candidates })
  },

  loadFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')

      if (error) {
        console.error('Error loading candidates:', error)
        return
      }

      // Map database fields ke format yang dipakai app
      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        full_name: item.full_name,
        school: item.school,
        region: item.region,
        birth_date: item.birth_date,
        email: item.email,
        home_visit_status: item.home_visit_status,
      }))

      set({ candidates: mappedData })
    } catch (error) {
      console.error('Failed to load candidates:', error)
    }
  },

  updateHomeVisitStatus: async (id, status) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ home_visit_status: status })
        .eq('id', id)

      if (error) {
        console.error('Error updating home visit status:', error)
        alert(`Gagal memperbarui status: ${error.message}`)
        return
      }

      set((state) => ({
        candidates: state.candidates.map((c) =>
          c.id === id ? { ...c, home_visit_status: status } : c
        ),
      }))
    } catch (error) {
      console.error('Failed to update home visit status:', error)
    }
  },

  bulkUpdateHomeVisitStatus: async (ids, status) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ home_visit_status: status })
        .in('id', ids)

      if (error) {
        console.error('Error bulk updating home visit status:', error)
        alert(`Gagal memperbarui status: ${error.message}`)
        return
      }

      set((state) => ({
        candidates: state.candidates.map((c) =>
          ids.includes(c.id) ? { ...c, home_visit_status: status } : c
        ),
      }))
    } catch (error) {
      console.error('Failed to bulk update home visit status:', error)
    }
  },

  addCandidate: async (candidate) => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert([candidate])
        .select()

      if (error) {
        console.error('Error adding candidate:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        return
      }

      // Add ke local state
      if (data && data.length > 0) {
        const newCandidate = {
          id: data[0].id,
          full_name: data[0].full_name,
          school: data[0].school,
          region: data[0].region,
          birth_date: data[0].birth_date,
          email: data[0].email,
        }
        set((state) => ({
          candidates: [...state.candidates, newCandidate],
        }))
      }
    } catch (error) {
      console.error('Failed to add candidate:', error)
    }
  },

  bulkAddCandidates: async (candidates) => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .insert(candidates)
        .select()

      if (error) {
        console.error('Error bulk adding candidates:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        return
      }

      // Add ke local state
      if (data && data.length > 0) {
        const newCandidates = data.map((item: any) => ({
          id: item.id,
          full_name: item.full_name,
          school: item.school,
          region: item.region,
          birth_date: item.birth_date,
          email: item.email,
        }))
        set((state) => ({
          candidates: [...state.candidates, ...newCandidates],
        }))
      }
    } catch (error) {
      console.error('Failed to bulk add candidates:', error)
    }
  },

  deleteCandidate: async (id) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting candidate:', error)
        return
      }

      // Remove dari local state
      set((state) => ({
        candidates: state.candidates.filter((c) => c.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete candidate:', error)
    }
  },

  updateCandidate: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating candidate:', error)
        return
      }

      // Update local state
      set((state) => ({
        candidates: state.candidates.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      }))
    } catch (error) {
      console.error('Failed to update candidate:', error)
    }
  },
}))