import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Instrument {
  id: string
  bagian: 'A' | 'B'
  aspek: string
  indikator: string
  keterangan?: string
  urutan: number
}

interface InstrumentStore {
  instruments: Instrument[]
  setInstruments: (instruments: Instrument[]) => void
  addInstrument: (instrument: Omit<Instrument, 'id'>) => Promise<void>
  bulkAddInstruments: (instruments: Omit<Instrument, 'id'>[]) => Promise<void>
  deleteInstrument: (id: string) => Promise<void>
  updateInstrument: (id: string, instrument: Partial<Instrument>) => Promise<void>
  getInstrumentsByBagian: (bagian: 'A' | 'B') => Instrument[]
  getAspekList: () => string[]
  loadFromSupabase: () => Promise<void>
}

export const useInstrumentStore = create<InstrumentStore>((set, get) => ({
  instruments: [],

  setInstruments: (instruments) => {
    set({ instruments })
  },

  loadFromSupabase: async () => {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .select('*')
        .order('bagian')
        .order('urutan')

      if (error) {
        console.error('Error loading instruments:', error)
        return
      }

      // Map database fields
      const mappedData = (data || []).map((item: any) => ({
        id: item.id,
        bagian: item.bagian,
        aspek: item.aspek,
        indikator: item.indikator,
        keterangan: item.keterangan,
        urutan: item.urutan,
      }))

      set({ instruments: mappedData })
    } catch (error) {
      console.error('Failed to load instruments:', error)
    }
  },

  addInstrument: async (instrument) => {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .insert([instrument])
        .select()

      if (error) {
        console.error('Error adding instrument:', error)
        return
      }

      if (data && data.length > 0) {
        const newInstrument = {
          id: data[0].id,
          bagian: data[0].bagian,
          aspek: data[0].aspek,
          indikator: data[0].indikator,
          keterangan: data[0].keterangan,
          urutan: data[0].urutan,
        }
        set((state) => ({
          instruments: [...state.instruments, newInstrument],
        }))
      }
    } catch (error) {
      console.error('Failed to add instrument:', error)
    }
  },

  bulkAddInstruments: async (instruments) => {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .insert(instruments)
        .select()

      if (error) {
        console.error('Error bulk adding instruments:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        return
      }

      if (data && data.length > 0) {
        const newInstruments = data.map((item: any) => ({
          id: item.id,
          bagian: item.bagian,
          aspek: item.aspek,
          indikator: item.indikator,
          keterangan: item.keterangan,
          urutan: item.urutan,
        }))
        set((state) => ({
          instruments: [...state.instruments, ...newInstruments],
        }))
      }
    } catch (error) {
      console.error('Failed to bulk add instruments:', error)
    }
  },

  deleteInstrument: async (id) => {
    try {
      const { error } = await supabase
        .from('instruments')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting instrument:', error)
        return
      }

      set((state) => ({
        instruments: state.instruments.filter((i) => i.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete instrument:', error)
    }
  },

  updateInstrument: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('instruments')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Error updating instrument:', error)
        return
      }

      set((state) => ({
        instruments: state.instruments.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      }))
    } catch (error) {
      console.error('Failed to update instrument:', error)
    }
  },

  getInstrumentsByBagian: (bagian) => {
    return get().instruments.filter((i) => i.bagian === bagian)
  },

  getAspekList: () => {
    const aspeks = new Set(get().instruments.map((i) => i.aspek))
    return Array.from(aspeks).sort()
  },
}))