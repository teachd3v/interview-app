import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Schedule {
  id: string
  interview_date: string
  pusat_id?: string
  cabang_id?: string
  mentor_id?: string
  status: 'belum' | 'berjalan' | 'selesai'
  candidate_ids?: string[] // Candidates assigned ke schedule ini
}

interface ScheduleStore {
  schedules: Schedule[]
  setSchedules: (schedules: Schedule[]) => void
  addSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<void>
  bulkAddSchedules: (schedules: Omit<Schedule, 'id'>[]) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  updateSchedule: (id: string, schedule: Partial<Schedule>) => Promise<void>
  addCandidateToSchedule: (scheduleId: string, candidateId: string) => Promise<void>
  removeCandidateFromSchedule: (scheduleId: string, candidateId: string) => Promise<void>
  getScheduleWithCandidates: (scheduleId: string) => Promise<any>
  loadFromSupabase: () => Promise<void>
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  schedules: [],

  setSchedules: (schedules) => {
    set({ schedules })
  },

  loadFromSupabase: async () => {
    try {
      // Fetch schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('interview_schedules')
        .select('*')
        .order('interview_date', { ascending: false })

      if (schedulesError) {
        console.error('Error loading schedules:', schedulesError)
        return
      }

      // Fetch candidates per schedule
      const schedulesWithCandidates = await Promise.all(
        (schedulesData || []).map(async (schedule: any) => {
          const { data: candidatesData } = await supabase
            .from('schedule_candidates')
            .select('candidate_id')
            .eq('schedule_id', schedule.id)

          return {
            id: schedule.id,
            interview_date: schedule.interview_date,
            pusat_id: schedule.pusat_id,
            cabang_id: schedule.cabang_id,
            mentor_id: schedule.mentor_id,
            status: schedule.status,
            candidate_ids: (candidatesData || []).map((c: any) => c.candidate_id),
          }
        })
      )

      set({ schedules: schedulesWithCandidates })
    } catch (error) {
      console.error('Failed to load schedules:', error)
    }
  },

  addSchedule: async (schedule) => {
    try {
      const { candidate_ids, ...scheduleData } = schedule

      const { data, error } = await supabase
        .from('interview_schedules')
        .insert([scheduleData])
        .select()

      if (error) {
        console.error('Error adding schedule:', error)
        return
      }

      if (data && data.length > 0) {
        const newSchedule = {
          id: data[0].id,
          interview_date: data[0].interview_date,
          pusat_id: data[0].pusat_id,
          cabang_id: data[0].cabang_id,
          mentor_id: data[0].mentor_id,
          status: data[0].status,
          candidate_ids: candidate_ids || [],
        }

        // Add candidates ke schedule
        if (candidate_ids && candidate_ids.length > 0) {
          const candidateLinks = candidate_ids.map((candidateId) => ({
            schedule_id: newSchedule.id,
            candidate_id: candidateId,
          }))

          await supabase.from('schedule_candidates').insert(candidateLinks)
        }

        set((state) => ({
          schedules: [...state.schedules, newSchedule],
        }))
      }
    } catch (error) {
      console.error('Failed to add schedule:', error)
    }
  },

  bulkAddSchedules: async (schedules) => {
    try {
      // Separate schedule data from candidate_ids
      const schedulesData = schedules.map(({ candidate_ids, ...rest }) => rest)

      const { data, error } = await supabase
        .from('interview_schedules')
        .insert(schedulesData)
        .select()

      if (error) {
        console.error('Error bulk adding schedules:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        return
      }

      if (data && data.length > 0) {
        // Build new schedules with candidate_ids
        const newSchedules = data.map((schedule: any, index: number) => ({
          id: schedule.id,
          interview_date: schedule.interview_date,
          pusat_id: schedule.pusat_id,
          cabang_id: schedule.cabang_id,
          mentor_id: schedule.mentor_id,
          status: schedule.status,
          candidate_ids: schedules[index].candidate_ids || [],
        }))

        // Insert all candidate links
        const allCandidateLinks: any[] = []
        newSchedules.forEach((schedule) => {
          if (schedule.candidate_ids && schedule.candidate_ids.length > 0) {
            const links = schedule.candidate_ids.map((candidateId) => ({
              schedule_id: schedule.id,
              candidate_id: candidateId,
            }))
            allCandidateLinks.push(...links)
          }
        })

        if (allCandidateLinks.length > 0) {
          await supabase.from('schedule_candidates').insert(allCandidateLinks)
        }

        set((state) => ({
          schedules: [...state.schedules, ...newSchedules],
        }))
      }
    } catch (error) {
      console.error('Failed to bulk add schedules:', error)
    }
  },

  deleteSchedule: async (id) => {
    try {
      // First delete all schedule_candidates entries
      const { error: candidatesError } = await supabase
        .from('schedule_candidates')
        .delete()
        .eq('schedule_id', id)

      if (candidatesError) {
        console.error('Error deleting schedule candidates:', candidatesError)
        throw new Error(`Failed to delete schedule candidates: ${candidatesError.message}`)
      }

      // Then delete schedule
      const { error: scheduleError } = await supabase
        .from('interview_schedules')
        .delete()
        .eq('id', id)

      if (scheduleError) {
        console.error('Error deleting schedule:', scheduleError)
        throw new Error(`Failed to delete schedule: ${scheduleError.message}`)
      }

      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      throw error
    }
  },

  updateSchedule: async (id, updates) => {
    try {
      const { candidate_ids, ...scheduleUpdates } = updates

      const { error } = await supabase
        .from('interview_schedules')
        .update(scheduleUpdates)
        .eq('id', id)

      if (error) {
        console.error('Error updating schedule:', error)
        return
      }

      // Update candidates jika ada perubahan
      if (candidate_ids !== undefined) {
        // Delete semua candidates lama
        await supabase.from('schedule_candidates').delete().eq('schedule_id', id)

        // Insert candidates baru
        if (candidate_ids.length > 0) {
          const candidateLinks = candidate_ids.map((candidateId) => ({
            schedule_id: id,
            candidate_id: candidateId,
          }))
          await supabase.from('schedule_candidates').insert(candidateLinks)
        }
      }

      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === id
            ? {
                ...s,
                ...scheduleUpdates,
                candidate_ids: candidate_ids !== undefined ? candidate_ids : s.candidate_ids,
              }
            : s
        ),
      }))
    } catch (error) {
      console.error('Failed to update schedule:', error)
    }
  },

  addCandidateToSchedule: async (scheduleId, candidateId) => {
    try {
      const { error } = await supabase
        .from('schedule_candidates')
        .insert([{ schedule_id: scheduleId, candidate_id: candidateId }])

      if (error) {
        console.error('Error adding candidate to schedule:', error)
        return
      }

      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === scheduleId
            ? {
                ...s,
                candidate_ids: [...(s.candidate_ids || []), candidateId],
              }
            : s
        ),
      }))
    } catch (error) {
      console.error('Failed to add candidate to schedule:', error)
    }
  },

  removeCandidateFromSchedule: async (scheduleId, candidateId) => {
    try {
      const { error } = await supabase
        .from('schedule_candidates')
        .delete()
        .eq('schedule_id', scheduleId)
        .eq('candidate_id', candidateId)

      if (error) {
        console.error('Error removing candidate from schedule:', error)
        return
      }

      set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === scheduleId
            ? {
                ...s,
                candidate_ids: (s.candidate_ids || []).filter((id) => id !== candidateId),
              }
            : s
        ),
      }))
    } catch (error) {
      console.error('Failed to remove candidate from schedule:', error)
    }
  },

  getScheduleWithCandidates: async (scheduleId) => {
    try {
      const { data: schedule } = await supabase
        .from('interview_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single()

      const { data: candidates } = await supabase
        .from('schedule_candidates')
        .select('candidate_id')
        .eq('schedule_id', scheduleId)

      return {
        ...schedule,
        candidate_ids: (candidates || []).map((c: any) => c.candidate_id),
      }
    } catch (error) {
      console.error('Failed to get schedule with candidates:', error)
      return null
    }
  },
}))