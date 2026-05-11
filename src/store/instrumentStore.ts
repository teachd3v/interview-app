import { create } from 'zustand'

export interface Instrument {
  id: string
  bagian: 'A' | 'B'
  aspek: string
  indikator: string
  keterangan: string
  urutan: number // For ordering within bagian
}

interface InstrumentStore {
  instruments: Instrument[]
  setInstruments: (instruments: Instrument[]) => void
  addInstrument: (instrument: Instrument) => void
  updateInstrument: (id: string, updates: Partial<Instrument>) => void
  deleteInstrument: (id: string) => void
  getInstrumentsByBagian: (bagian: 'A' | 'B') => Instrument[]
  getAspekList: () => string[]
  loadFromLocalStorage: () => void
  saveToLocalStorage: () => void
}

const STORAGE_KEY = 'interview-app:instruments'

// Default instruments (from master plan)
const defaultInstruments: Instrument[] = [
  // Part A - Wajib (8 indikator)
  { id: 'a1', bagian: 'A', aspek: 'Wajib', indikator: 'Lulus jenjang minimal SMA/sederajat', keterangan: 'Kandidat telah lulus pendidikan SMA atau sederajat', urutan: 1 },
  { id: 'a2', bagian: 'A', aspek: 'Wajib', indikator: 'Berusia 17-25 tahun', keterangan: 'Kandidat masuk dalam rentang usia yang ditentukan', urutan: 2 },
  { id: 'a3', bagian: 'A', aspek: 'Wajib', indikator: 'Belum pernah gagal wawancara LPDP 2x', keterangan: 'Kandidat tidak pernah gagal tes LPDP lebih dari 2 kali', urutan: 3 },
  { id: 'a4', bagian: 'A', aspek: 'Wajib', indikator: 'Tidak dalam status sedang studi di luar negeri', keterangan: 'Kandidat tidak sedang menjalani studi di luar negeri', urutan: 4 },
  { id: 'a5', bagian: 'A', aspek: 'Wajib', indikator: 'Memiliki sponsor/pendamping', keterangan: 'Kandidat memiliki sponsor atau pendamping untuk program', urutan: 5 },
  { id: 'a6', bagian: 'A', aspek: 'Wajib', indikator: 'Komitmen bekerja 5 tahun setelah beasiswa', keterangan: 'Kandidat bersedia berkomitmen bekerja 5 tahun usai selesai studi', urutan: 6 },
  { id: 'a7', bagian: 'A', aspek: 'Wajib', indikator: 'Tidak memiliki utang atau cicilan besar', keterangan: 'Kandidat tidak memiliki beban utang/cicilan yang signifikan', urutan: 7 },
  { id: 'a8', bagian: 'A', aspek: 'Wajib', indikator: 'Lulus pemeriksaan kesehatan', keterangan: 'Kandidat telah lulus tes kesehatan yang dipersyaratkan', urutan: 8 },

  // Part B - Pendukung (20 indikator, grouped by aspect)
  { id: 'b1', bagian: 'B', aspek: 'Akademik', indikator: 'Alasan memilih program studi jelas', keterangan: 'Kandidat dapat menjelaskan alasan pemilihan program studi dengan jelas dan logis', urutan: 1 },
  { id: 'b2', bagian: 'B', aspek: 'Akademik', indikator: 'Target karir terukur', keterangan: 'Kandidat memiliki target karir yang spesifik dan terukur', urutan: 2 },
  { id: 'b3', bagian: 'B', aspek: 'Akademik', indikator: 'Prestasi akademik konsisten', keterangan: 'Prestasi akademik kandidat menunjukkan konsistensi positif', urutan: 3 },
  { id: 'b4', bagian: 'B', aspek: 'Akademik', indikator: 'Pengalaman organisasi/kepemimpinan', keterangan: 'Kandidat memiliki pengalaman aktif dalam organisasi atau peran kepemimpinan', urutan: 4 },
  { id: 'b5', bagian: 'B', aspek: 'Akademik', indikator: 'Motivasi belajar tinggi', keterangan: 'Kandidat menunjukkan motivasi belajar yang tinggi dan berkelanjutan', urutan: 5 },
  { id: 'b6', bagian: 'B', aspek: 'Bahasa', indikator: 'Penguasaan bahasa Inggris baik', keterangan: 'Kandidat menguasai bahasa Inggris dengan baik (lisan & tulis)', urutan: 6 },
  { id: 'b7', bagian: 'B', aspek: 'Bahasa', indikator: 'Kemampuan komunikasi efektif', keterangan: 'Kandidat dapat berkomunikasi efektif dalam bahasa Inggris', urutan: 7 },
  { id: 'b8', bagian: 'B', aspek: 'LPDP', indikator: 'Pemahaman peran LPDP jelas', keterangan: 'Kandidat memahami peran dan misi LPDP dengan baik', urutan: 8 },
  { id: 'b9', bagian: 'B', aspek: 'LPDP', indikator: 'Komitmen mengabdi kepada Indonesia', keterangan: 'Kandidat menunjukkan komitmen kuat untuk mengabdi kepada Indonesia', urutan: 9 },
  { id: 'b10', bagian: 'B', aspek: 'Kepribadian', indikator: 'Integritas dan kejujuran tinggi', keterangan: 'Kandidat menunjukkan integritas dan kejujuran dalam percakapan', urutan: 10 },
  { id: 'b11', bagian: 'B', aspek: 'Kepribadian', indikator: 'Kemampuan beradaptasi baik', keterangan: 'Kandidat menunjukkan kemampuan adaptasi yang baik terhadap perubahan', urutan: 11 },
  { id: 'b12', bagian: 'B', aspek: 'Kepribadian', indikator: 'Kematangan emosional terjaga', keterangan: 'Kandidat menunjukkan kematangan emosional dan kontrol diri yang baik', urutan: 12 },
  { id: 'b13', bagian: 'B', aspek: 'Keluarga', indikator: 'Keluarga mendukung penuh', keterangan: 'Keluarga kandidat memberikan dukungan penuh untuk program ini', urutan: 13 },
  { id: 'b14', bagian: 'B', aspek: 'Keluarga', indikator: 'Situasi finansial keluarga jelas', keterangan: 'Situasi finansial keluarga kandidat jelas dan stabil', urutan: 14 },
  { id: 'b15', bagian: 'B', aspek: 'Keluarga', indikator: 'Latar belakang keluarga stabil', keterangan: 'Latar belakang keluarga kandidat menunjukkan stabilitas', urutan: 15 },
  { id: 'b16', bagian: 'B', aspek: 'Domisili', indikator: 'Asal domisili sesuai preferensi', keterangan: 'Asal domisili kandidat sesuai dengan preferensi program', urutan: 16 },
  { id: 'b17', bagian: 'B', aspek: 'Domisili', indikator: 'Jaringan lokal/networking positif', keterangan: 'Kandidat memiliki jaringan lokal atau networking yang positif', urutan: 17 },
  { id: 'b18', bagian: 'B', aspek: 'Pengalaman', indikator: 'Pengalaman kerja relevan', keterangan: 'Kandidat memiliki pengalaman kerja yang relevan dengan bidang studi', urutan: 18 },
  { id: 'b19', bagian: 'B', aspek: 'Pengalaman', indikator: 'Keterampilan praktis yang dimiliki', keterangan: 'Kandidat memiliki keterampilan praktis yang dapat diaplikasikan', urutan: 19 },
  { id: 'b20', bagian: 'B', aspek: 'Potensi', indikator: 'Potensi pengembangan diri tinggi', keterangan: 'Kandidat menunjukkan potensi pengembangan diri yang tinggi', urutan: 20 },
]

export const useInstrumentStore = create<InstrumentStore>((set, get) => ({
  instruments: defaultInstruments,

  setInstruments: (instruments) => {
    set({ instruments })
    get().saveToLocalStorage()
  },

  addInstrument: (instrument) => {
    set((state) => ({
      instruments: [...state.instruments, instrument],
    }))
    get().saveToLocalStorage()
  },

  updateInstrument: (id, updates) => {
    set((state) => ({
      instruments: state.instruments.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }))
    get().saveToLocalStorage()
  },

  deleteInstrument: (id) => {
    set((state) => ({
      instruments: state.instruments.filter((i) => i.id !== id),
    }))
    get().saveToLocalStorage()
  },

  getInstrumentsByBagian: (bagian) => {
    const state = get()
    return state.instruments
      .filter((i) => i.bagian === bagian)
      .sort((a, b) => a.urutan - b.urutan)
  },

  getAspekList: () => {
    const state = get()
    const aspeks = new Set(state.instruments.map((i) => i.aspek))
    return Array.from(aspeks).sort()
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        set({ instruments: JSON.parse(stored) })
      }
    } catch (error) {
      console.error('Failed to load instruments from localStorage:', error)
    }
  },

  saveToLocalStorage: () => {
    try {
      const { instruments } = get()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(instruments))
    } catch (error) {
      console.error('Failed to save instruments to localStorage:', error)
    }
  },
}))
