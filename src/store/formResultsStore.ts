import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface FormResult {
  id: string
  candidateId: string
  candidateName: string
  interviewerId?: string
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
      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        candidateId: item.candidate_id,
        candidateName: item.candidates?.full_name || 'Unknown',
        scheduleId: item.schedule_id,
        interviewDate: new Date().toISOString().split('T')[0], // Use current date as fallback
        submittedAt: item.submitted_at,
        partA: item.part_a_results || [],
        partB: item.part_b_results || [],
        notes: item.notes || '',
        partAPass: item.part_a_pass,
        partBTotal: item.part_b_total || 0,
        partBPercentage: item.part_b_percentage || 0,
      }))

      set({ results: mappedData })
    } catch (error) {
      console.error('Failed to load results:', error)
    }
  },

  addResult: async (result) => {
    try {
      const dbPayload = {
        candidate_id: result.candidateId,
        schedule_id: result.scheduleId, // Now should have value from schedule_candidates
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
        console.error('📋 Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        // Show alert untuk user
        alert(`❌ Error menyimpan hasil: ${error.message}`)
        return
      }

      if (data && data.length > 0) {
        const newResult = {
          id: data[0].id,
          candidateId: data[0].candidate_id,
          candidateName: result.candidateName,
          interviewerId: result.interviewerId || '', // Use from input, not from DB
          scheduleId: data[0].schedule_id,
          interviewDate: result.interviewDate, // Use from input, not from DB
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

  getResultsByCandidate: (candidateId) => {
    return get().results.filter((r) => r.candidateId === candidateId)
  },

  getResultsBySchedule: (scheduleId) => {
    return get().results.filter((r) => r.scheduleId === scheduleId)
  },
}))