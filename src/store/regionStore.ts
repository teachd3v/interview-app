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
  addRegion: (region: Omit<Region, 'id' | 'created_at'>) => Promise<void>
  updateRegion: (id: string, updates: Partial<Region>) => Promise<void>
  deleteRegion: (id: string) => Promise<void>
}

export const useRegionStore = create<RegionStore>((set, get) => ({
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

  addRegion: async (region) => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .insert([region])
        .select()

      if (error) throw error

      if (data) {
        set({ regions: [...get().regions, data[0]] })
      }
    } catch (error) {
      console.error('Error adding region:', error)
      throw error
    }
  },

  updateRegion: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('regions')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set({
        regions: get().regions.map((region) =>
          region.id === id ? { ...region, ...updates } : region
        ),
      })
    } catch (error) {
      console.error('Error updating region:', error)
      throw error
    }
  },

  deleteRegion: async (id) => {
    try {
      const { error } = await supabase.from('regions').delete().eq('id', id)
      if (error) throw error

      set({ regions: get().regions.filter((region) => region.id !== id) })
    } catch (error) {
      console.error('Error deleting region:', error)
      throw error
    }
  },
}))
