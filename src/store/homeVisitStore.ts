import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface HomeVisitResult {
  id: string
  candidateId: string
  mentorId: string
  submittedAt: string
  partAResults: Array<{
    id: string
    label: string
    value: boolean
    note?: string
    evidenceUrls?: string[]
  }>
  partAPass: boolean
  partBResults: Array<{
    id: string
    label: string
    aspect: string
    score: number
    note?: string
    evidenceUrls?: string[]
  }>
  partCResults: Array<{
    id: string
    label: string
    aspect: string
    score: number
    note?: string
    evidenceUrls?: string[]
  }>
  totalScore: number
  percentage: number
  recommendationStatus: string
  notes: string
}

interface HomeVisitStore {
  results: HomeVisitResult[]
  setResults: (results: HomeVisitResult[]) => void
  addResult: (result: Omit<HomeVisitResult, 'id'>) => Promise<void>
  loadFromSupabase: () => Promise<void>
  getResultsByCandidate: (candidateId: string) => HomeVisitResult | undefined
}

export const useHomeVisitStore = create<HomeVisitStore>((set, get) => ({
  results: [],

  setResults: (results) => {
    set({ results })
  },

  loadFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('home_visit_results')
        .select('*')
        .order('submitted_at', { ascending: false })

      if (error) {
        console.error('Error loading home visit results:', error)
        return
      }

      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        candidateId: item.candidate_id,
        mentorId: item.mentor_id,
        submittedAt: item.submitted_at,
        partAResults: item.part_a_results,
        partAPass: item.part_a_pass,
        partBResults: item.part_b_results,
        partCResults: item.part_c_results,
        totalScore: item.total_score,
        percentage: item.percentage,
        recommendationStatus: item.recommendation_status,
        notes: item.notes,
      }))

      set({ results: mappedData })
    } catch (error) {
      console.error('Failed to load home visit results:', error)
    }
  },

  addResult: async (result) => {
    try {
      const dbPayload = {
        candidate_id: result.candidateId,
        mentor_id: result.mentorId,
        submitted_at: result.submittedAt,
        part_a_results: result.partAResults,
        part_a_pass: result.partAPass,
        part_b_results: result.partBResults,
        part_c_results: result.partCResults,
        total_score: result.totalScore,
        percentage: result.percentage,
        recommendation_status: result.recommendationStatus,
        notes: result.notes,
      }

      // 1. Cek ketersediaan data secara manual
      const { data: existingData } = await supabase
        .from('home_visit_results')
        .select('id')
        .eq('candidate_id', result.candidateId)
        .maybeSingle()

      let data, error;

      if (existingData) {
        // 2a. Jika sudah ada, lakukan UPDATE
        const { data: updateData, error: updateError } = await supabase
          .from('home_visit_results')
          .update(dbPayload)
          .eq('candidate_id', result.candidateId)
          .select()
        data = updateData;
        error = updateError;
      } else {
        // 2b. Jika belum ada, lakukan INSERT
        const { data: insertData, error: insertError } = await supabase
          .from('home_visit_results')
          .insert([dbPayload])
          .select()
        data = insertData;
        error = insertError;
      }

      if (error) {
        console.error('Error adding/updating home visit result:', error)
        alert(`Gagal menyimpan hasil home visit: ${error.message}`)
        return
      }

      if (data && data.length > 0) {
        const updatedResult = {
          id: data[0].id,
          ...result
        }
        
        set((state) => {
          const filtered = state.results.filter(r => r.candidateId !== result.candidateId)
          return {
            results: [updatedResult as HomeVisitResult, ...filtered],
          }
        })
      }
    } catch (error) {
      console.error('Failed to add home visit result:', error)
    }
  },

  getResultsByCandidate: (candidateId) => {
    return get().results.find((r) => r.candidateId === candidateId)
  },
}))
