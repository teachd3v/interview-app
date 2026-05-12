import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Region {
  id: string
  name: string
  code?: string
  order_number?: number
  created_at?: string
}

interface RegionStore {
  regions: Region[]
  loadFromSupabase: () => Promise<void>
}

export const useRegionStore = create<RegionStore>((set) => ({
  regions: [],

  loadFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('order_number', { ascending: true })

      if (error) {
        console.error('Error loading regions:', error)
        return
      }

      set({ regions: data || [] })
    } catch (error) {
      console.error('Failed to load regions:', error)
    }
  },
}))
