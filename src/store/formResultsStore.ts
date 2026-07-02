import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface FormResult {
  id: string
  candidateId: string
  candidateName: string
  interviewerId: string
  scheduleId?: string
  interviewDate: string
  submittedAt: string
  partA: Array<{
    id: string
    label: string
    value: boolean
  }>
  partB: Array<{
    id: string
    label: string
    aspect: string
    value: 'yes' | 'maybe' | 'no'
    score: number
  }>
  notes: string
  partAPass: boolean
  partBTotal: number
  partBPercentage: number
}

interface FormResultsStore {
  results: FormResult[]
  setResults: (results: FormResult[]) => void
  addResult: (result: Omit<FormResult, 'id'>) => Promise<void>
  updateNotes: (id: string, notes: string) => Promise<void>
  updateResult: (id: string, updates: Partial<FormResult>) => Promise<void>
  getResultsByCandidate: (candidateId: string) => FormResult[]
  getResultsBySchedule: (scheduleId: string) => FormResult[]
  loadFromSupabase: () => Promise<void>

}

export const useFormResultsStore = create<FormResultsStore>((set, get) => ({
  results: [],

  setResults: (results) => {
    set({ results })
  },

  loadFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_results')
        .select(`
          id,
          candidate_id,
          interviewer_id,
          schedule_id,
          submitted_at,
          part_a_results,
          part_a_pass,
          part_b_results,
          part_b_total,
          part_b_percentage,
          notes,
          candidates(full_name)
        `)
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error loading results:', error)
        return
      }

      // Map database fields ke format app
      const mappedData = (data || []).map((item: any) => {
        const mapped = {
          id: item.id,
          candidateId: item.candidate_id,
          interviewerId: item.interviewer_id || '',
          candidateName: item.candidates?.full_name || 'Unknown',
          scheduleId: item.schedule_id,
          interviewDate: new Date(item.submitted_at).toISOString().split('T')[0],
          submittedAt: item.submitted_at,
          partA: item.part_a_results || [],
          partB: item.part_b_results || [],
          notes: item.notes || '',
          partAPass: item.part_a_pass,
          partBTotal: item.part_b_total || 0,
          partBPercentage: item.part_b_percentage || 0,
        }
        return mapped
      })

      set({ results: mappedData })
    } catch (error) {
      console.error('Failed to load results:', error)
    }
  },

  addResult: async (result) => {
    try {
      const dbPayload = {
        candidate_id: result.candidateId,
        interviewer_id: result.interviewerId,
        schedule_id: result.scheduleId,
        submitted_at: result.submittedAt,
        part_a_results: result.partA,
        part_a_pass: result.partAPass,
        part_b_results: result.partB,
        part_b_total: result.partBTotal,
        part_b_percentage: result.partBPercentage,
        notes: result.notes,
      }

      const { data, error } = await supabase
        .from('assessment_results')
        .insert([dbPayload])
        .select()

      if (error) {
        console.error('❌ Error adding result:', error)
        alert(`❌ Error menyimpan hasil: ${error.message}`)
        return
      }

      if (data && data.length > 0) {
        const newResult = {
          id: data[0].id,
          candidateId: data[0].candidate_id,
          interviewerId: data[0].interviewer_id,
          candidateName: result.candidateName,
          scheduleId: data[0].schedule_id,
          interviewDate: result.interviewDate,
          submittedAt: data[0].submitted_at,
          partA: data[0].part_a_results || [],
          partB: data[0].part_b_results || [],
          notes: data[0].notes || '',
          partAPass: data[0].part_a_pass,
          partBTotal: data[0].part_b_total || 0,
          partBPercentage: data[0].part_b_percentage || 0,
        }

        set((state) => ({
          results: [newResult, ...state.results],
        }))
      }
    } catch (error) {
      console.error('❌ Failed to add result:', error)
      alert(`Error: ${(error as any).message}`)
    }
  },

  updateNotes: async (id, notes) => {
    try {
      const { error } = await supabase
        .from('assessment_results')
        .update({ notes })
        .eq('id', id)

      if (error) {
        console.error('Error updating notes:', error)
        alert('Gagal mengupdate catatan')
        return
      }

      set((state) => ({
        results: state.results.map((r) => (r.id === id ? { ...r, notes } : r)),
      }))
    } catch (error) {
      console.error('Failed to update notes:', error)
    }
  },

  updateResult: async (id, updates) => {
    try {
      const dbPayload = {
        part_a_results: updates.partA,
        part_a_pass: updates.partAPass,
        part_b_results: updates.partB,
        part_b_total: updates.partBTotal,
        part_b_percentage: updates.partBPercentage,
        notes: updates.notes,
      }

      const { error } = await supabase
        .from('assessment_results')
        .update(dbPayload)
        .eq('id', id)

      if (error) {
        console.error('Error updating result:', error)
        alert(`Gagal mengupdate hasil: ${error.message}`)
        return
      }

      set((state) => ({
        results: state.results.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }))
    } catch (error) {
      console.error('Failed to update result:', error)
    }
  },

  getResultsByCandidate: (candidateId) => {
    return get().results.filter((r) => r.candidateId === candidateId)
  },

  getResultsBySchedule: (scheduleId) => {
    return get().results.filter((r) => r.scheduleId === scheduleId)
  },
}))