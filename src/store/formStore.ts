import { create } from 'zustand'
import { Instrument } from './instrumentStore'

interface PartAIndicator {
  id: string
  label: string
  value: boolean | null
}

interface PartBIndicator {
  id: string
  label: string
  aspect: string
  value: 'yes' | 'maybe' | 'no' | null
}

interface FormState {
  candidateId: string | null
  partA: PartAIndicator[]
  partB: PartBIndicator[]
  notes: string
  setCandidate: (id: string) => void
  updatePartA: (id: string, value: boolean) => void
  updatePartB: (id: string, value: 'yes' | 'maybe' | 'no') => void
  setNotes: (notes: string) => void
  reset: () => void
  isPartBComplete: () => boolean
  initializeFromInstruments: (instruments: Instrument[]) => void
}

const defaultPartA: PartAIndicator[] = [
  { id: 'a1', label: 'Lulus jenjang minimal SMA/sederajat', value: null },
  { id: 'a2', label: 'Berusia 17-25 tahun', value: null },
  { id: 'a3', label: 'Belum pernah gagal wawancara LPDP 2x', value: null },
  { id: 'a4', label: 'Tidak dalam status sedang studi di luar negeri', value: null },
  { id: 'a5', label: 'Memiliki sponsor/pendamping', value: null },
  { id: 'a6', label: 'Komitmen bekerja 5 tahun setelah beasiswa', value: null },
  { id: 'a7', label: 'Tidak memiliki utang atau cicilan besar', value: null },
  { id: 'a8', label: 'Lulus pemeriksaan kesehatan', value: null },
]

const defaultPartB: PartBIndicator[] = [
  { id: 'b1', label: 'Alasan memilih program studi jelas', aspect: 'Akademik', value: null },
  { id: 'b2', label: 'Target karir terukur', aspect: 'Akademik', value: null },
  { id: 'b3', label: 'Prestasi akademik konsisten', aspect: 'Akademik', value: null },
  { id: 'b4', label: 'Pengalaman organisasi/kepemimpinan', aspect: 'Akademik', value: null },
  { id: 'b5', label: 'Motivasi belajar tinggi', aspect: 'Akademik', value: null },
  { id: 'b6', label: 'Penguasaan bahasa Inggris baik', aspect: 'Bahasa', value: null },
  { id: 'b7', label: 'Kemampuan komunikasi efektif', aspect: 'Bahasa', value: null },
  { id: 'b8', label: 'Pemahaman peran LPDP jelas', aspect: 'LPDP', value: null },
  { id: 'b9', label: 'Komitmen mengabdi kepada Indonesia', aspect: 'LPDP', value: null },
  { id: 'b10', label: 'Integritas dan kejujuran tinggi', aspect: 'Kepribadian', value: null },
  { id: 'b11', label: 'Kemampuan beradaptasi baik', aspect: 'Kepribadian', value: null },
  { id: 'b12', label: 'Kematangan emosional terjaga', aspect: 'Kepribadian', value: null },
  { id: 'b13', label: 'Keluarga mendukung penuh', aspect: 'Keluarga', value: null },
  { id: 'b14', label: 'Situasi finansial keluarga jelas', aspect: 'Keluarga', value: null },
  { id: 'b15', label: 'Latar belakang keluarga stabil', aspect: 'Keluarga', value: null },
  { id: 'b16', label: 'Asal domisili sesuai preferensi', aspect: 'Domisili', value: null },
  { id: 'b17', label: 'Jaringan lokal/networking positif', aspect: 'Domisili', value: null },
  { id: 'b18', label: 'Pengalaman kerja relevan', aspect: 'Pengalaman', value: null },
  { id: 'b19', label: 'Keterampilan praktis yang dimiliki', aspect: 'Pengalaman', value: null },
  { id: 'b20', label: 'Potensi pengembangan diri tinggi', aspect: 'Potensi', value: null },
]

export const useFormStore = create<FormState>((set, get) => ({
  candidateId: null,
  partA: defaultPartA,
  partB: defaultPartB,
  notes: '',

  setCandidate: (id) => set({ candidateId: id }),

  updatePartA: (id, value) =>
    set((state) => ({
      partA: state.partA.map((item) => (item.id === id ? { ...item, value } : item)),
    })),

  updatePartB: (id, value) =>
    set((state) => ({
      partB: state.partB.map((item) => (item.id === id ? { ...item, value } : item)),
    })),

  setNotes: (notes) => set({ notes }),

  reset: () =>
    set({
      candidateId: null,
      partA: defaultPartA,
      partB: defaultPartB,
      notes: '',
    }),

  isPartBComplete: () => {
    const state = get()
    return state.partB.every((item) => item.value !== null)
  },

  initializeFromInstruments: (instruments) => {
    const partA: PartAIndicator[] = instruments
      .filter((i) => i.bagian === 'A')
      .map((i) => ({
        id: i.id,
        label: i.indikator,
        value: null,
      }))

    const partB: PartBIndicator[] = instruments
      .filter((i) => i.bagian === 'B')
      .map((i) => ({
        id: i.id,
        label: i.indikator,
        aspect: i.aspek,
        value: null,
      }))

    set({ partA, partB })
  },
}))
