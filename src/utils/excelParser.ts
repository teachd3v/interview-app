import * as XLSX from 'xlsx'
import { Candidate } from '../store/candidateStore'
import { Interviewer } from '../store/interviewerStore'
import { Instrument } from '../store/instrumentStore'

export interface ParsedCandidateData {
  candidates: Candidate[]
  errors: string[]
}

export interface ParsedInterviewerData {
  interviewers: Interviewer[]
  errors: string[]
}

export interface ParsedScheduleData {
  schedules: Array<{
    region_id: string
    interview_date: string
    pusat_id?: string
    mitra_id?: string
    fasil_id?: string
    status: 'belum' | 'berjalan' | 'selesai'
    candidate_ids: string[]
  }>
  errors: string[]
}

export interface ParsedInstrumentData {
  instruments: Instrument[]
  errors: string[]
}

export const parseExcelFile = (file: File): Promise<ParsedCandidateData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]

        if (!worksheet) {
          reject(new Error('No worksheet found in Excel file'))
          return
        }

        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

        if (rows.length === 0) {
          reject(new Error('Excel file is empty'))
          return
        }

        const candidates: Candidate[] = []
        const errors: string[] = []

        rows.forEach((row, index) => {
          try {
            // Flexible column name matching (case-insensitive, trim spaces)
            const id = String(row['ID'] || row['id'] || row['Id'] || '').trim()
            const fullName = String(row['Nama'] || row['nama'] || row['Name'] || row['name'] || '').trim()
            const gender = String(row['JenisKelamin'] || row['jenisKelamin'] || row['Jenis Kelamin'] || row['gender'] || row['Gender'] || '').trim()
            const region = String(row['Wilayah'] || row['wilayah'] || row['Region'] || row['region'] || '').trim()
            const school = String(row['Kampus'] || row['kampus'] || row['Campus'] || row['campus'] || row['Sekolah'] || row['sekolah'] || '').trim()
            const major = String(row['Prodi'] || row['prodi'] || row['Program Studi'] || row['Major'] || row['major'] || '').trim()

            // Validation
            if (!id) {
              errors.push(`Row ${index + 2}: ID is required`)
              return
            }
            if (!fullName) {
              errors.push(`Row ${index + 2}: Nama is required`)
              return
            }
            if (!gender) {
              errors.push(`Row ${index + 2}: JenisKelamin is required`)
              return
            }
            if (!region) {
              errors.push(`Row ${index + 2}: Wilayah is required`)
              return
            }
            if (!school) {
              errors.push(`Row ${index + 2}: Kampus is required`)
              return
            }
            if (!major) {
              errors.push(`Row ${index + 2}: Prodi is required`)
              return
            }

            candidates.push({
              id,
              full_name: fullName,
              school,
              region,
              gender,
              major,
            })
          } catch (error) {
            errors.push(`Row ${index + 2}: Failed to parse row`)
          }
        })

        resolve({
          candidates,
          errors,
        })
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export const parseInterviewerExcelFile = (file: File): Promise<ParsedInterviewerData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]

        if (!worksheet) {
          reject(new Error('No worksheet found in Excel file'))
          return
        }

        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

        if (rows.length === 0) {
          reject(new Error('Excel file is empty'))
          return
        }

        const interviewers: Interviewer[] = []
        const errors: string[] = []

        rows.forEach((row, index) => {
          try {
            const id = String(row['ID'] || row['id'] || row['Id'] || '').trim()
            const fullName = String(row['Nama'] || row['nama'] || row['Name'] || row['name'] || '').trim()
            let role = String(row['Role'] || row['role'] || '').trim().toLowerCase()

            // Normalize role variations (handle "Pusat" → "pusat", etc)
            if (role === 'pusat' || role === 'Pusat' || role === 'PUSAT') {
              role = 'pusat'
            } else if (role === 'mitra' || role === 'Mitra' || role === 'MITRA' || role === 'cabang' || role === 'Cabang' || role === 'CABANG') {
              role = 'mitra'
            } else if (role === 'fasil' || role === 'Fasil' || role === 'FASIL' || role === 'mentor' || role === 'Mentor' || role === 'MENTOR') {
              role = 'fasil'
            }

            // Validation
            if (!id) {
              errors.push(`Row ${index + 2}: ID is required`)
              return
            }
            if (!fullName) {
              errors.push(`Row ${index + 2}: Nama is required`)
              return
            }
            if (!role || !['pusat', 'mitra', 'fasil'].includes(role)) {
              errors.push(`Row ${index + 2}: Role must be pusat, mitra, or fasil (case-insensitive)`)
              return
            }

            interviewers.push({
              id,
              full_name: fullName,
              role: role as 'pusat' | 'mitra' | 'fasil',
            })
          } catch (error) {
            errors.push(`Row ${index + 2}: Failed to parse row`)
          }
        })

        resolve({
          interviewers,
          errors,
        })
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export const downloadCandidateTemplate = () => {
  const template = [
    {
      ID: '001',
      Nama: 'Ahmad Rizki Pratama',
      JenisKelamin: 'Laki-laki',
      Wilayah: 'DKI Jakarta',
      Kampus: 'Universitas Indonesia',
      Prodi: 'Teknik Informatika',
    },
    {
      ID: '002',
      Nama: 'Siti Nurhaliza Wijaya',
      JenisKelamin: 'Perempuan',
      Wilayah: 'Jawa Barat',
      Kampus: 'Institut Teknologi Bandung',
      Prodi: 'Sistem Informasi',
    },
    {
      ID: '003',
      Nama: 'Budi Santoso',
      JenisKelamin: 'Laki-laki',
      Wilayah: 'Jawa Timur',
      Kampus: 'Universitas Airlangga',
      Prodi: 'Manajemen',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kandidat')

  // Auto-size columns
  ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 25 }]

  XLSX.writeFile(wb, 'template-kandidat.xlsx')
}

export const parseScheduleExcelFile = async (file: File): Promise<ParsedScheduleData> => {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        // Import supabase here to avoid circular dependencies
        const { supabase } = await import('../lib/supabase')

        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]

        if (!worksheet) {
          reject(new Error('No worksheet found in Excel file'))
          return
        }

        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

        if (rows.length === 0) {
          reject(new Error('Excel file is empty'))
          return
        }

        // Fetch regions for validation
        const { data: regionsData, error: regionsError } = await supabase.from('regions').select('id, name, code')

        if (regionsError) {
          reject(new Error(`Failed to fetch regions: ${regionsError.message}`))
          return
        }

        const regionMap = new Map((regionsData || []).map((r: any) => [r.code?.toUpperCase() || '', r.id]))

        const schedules: ParsedScheduleData['schedules'] = []
        const errors: string[] = []

        rows.forEach((row, index) => {
          try {
            const wilayahCode = String(row['Wilayah'] || row['wilayah'] || row['Region'] || row['region'] || '').trim().toUpperCase()
            const date = String(row['TanggalWawancara'] || row['tanggalWawancara'] || row['Tanggal'] || row['Date'] || '').trim()
            const pusatId = String(row['IDInterviewerPusat'] || row['idInterviewerPusat'] || row['Pusat'] || '').trim()
            const mitraId = String(row['IDInterviewerMitra'] || row['idInterviewerMitra'] || row['IDInterviewerCabang'] || row['idInterviewerCabang'] || row['Mitra'] || row['Cabang'] || '').trim()
            const fasilId = String(row['IDInterviewerFasil'] || row['idInterviewerFasil'] || row['IDInterviewerMentor'] || row['idInterviewerMentor'] || row['Fasil'] || row['Mentor'] || '').trim()
            const daftarKandidatStr = String(row['DaftarKandidat'] || row['daftarKandidat'] || row['Kandidat'] || '').trim()

            // Validation
            if (!wilayahCode) {
              errors.push(`Row ${index + 2}: Wilayah (kode) is required`)
              return
            }

            const regionId = regionMap.get(wilayahCode)
            if (!regionId) {
              errors.push(`Row ${index + 2}: Kode wilayah "${wilayahCode}" tidak ditemukan. Gunakan: ${Array.from(regionMap.keys()).join(', ')}`)
              return
            }

            if (!date) {
              errors.push(`Row ${index + 2}: TanggalWawancara is required`)
              return
            }

            // Validate date format (YYYY-MM-DD)
            if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              errors.push(`Row ${index + 2}: TanggalWawancara must be in YYYY-MM-DD format`)
              return
            }

            if (!daftarKandidatStr) {
              errors.push(`Row ${index + 2}: DaftarKandidat is required (comma-separated IDs)`)
              return
            }

            // Parse candidate IDs (comma-separated)
            const candidateIds = daftarKandidatStr
              .split(',')
              .map((id) => id.trim())
              .filter((id) => id.length > 0)

            if (candidateIds.length === 0) {
              errors.push(`Row ${index + 2}: DaftarKandidat must contain at least one candidate ID`)
              return
            }

            // At least one interviewer should be provided
            if (!pusatId && !mitraId && !fasilId) {
              errors.push(`Row ${index + 2}: Minimal 1 interviewer ID harus diisi (Pusat, Mitra, atau Fasil)`)
              return
            }

            schedules.push({
              region_id: regionId,
              interview_date: date,
              pusat_id: pusatId || undefined,
              mitra_id: mitraId || undefined,
              fasil_id: fasilId || undefined,
              status: 'belum',
              candidate_ids: candidateIds,
            })
          } catch (error) {
            errors.push(`Row ${index + 2}: Failed to parse row`)
          }
        })

        resolve({
          schedules,
          errors,
        })
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export const downloadInterviewerTemplate = () => {
  const template = [
    {
      ID: 'int-001',
      Nama: 'Dr. Bambang Sutrisno',
      Role: 'pusat',
    },
    {
      ID: 'int-002',
      Nama: 'Ibu Sinta Wijaya',
      Role: 'pusat',
    },
    {
      ID: 'int-003',
      Nama: 'Pak Hendra Gunawan',
      Role: 'mitra',
    },
    {
      ID: 'int-004',
      Nama: 'Dr. Eka Putri',
      Role: 'mitra',
    },
    {
      ID: 'int-005',
      Nama: 'Ahmad Syaiful (Fasil)',
      Role: 'fasil',
    },
    {
      ID: 'int-006',
      Nama: 'Sri Rahayu (Fasil)',
      Role: 'fasil',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Interviewer')

  // Auto-size columns
  ws['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 12 }]

  // Add info sheet dengan penjelasan
  const infoData = [
    ['Format Data Interviewer'],
    [],
    ['Kolom yang diperlukan:'],
    ['- ID: Identifier unik (contoh: int-001, int-002, int-003)'],
    ['- Nama: Nama lengkap interviewer'],
    ['- Role: pusat, mitra, atau fasil (LOWERCASE)'],
    [],
    ['Catatan:'],
    ['- Gunakan format ID yang konsisten (int-001, bukan int-01)'],
    ['- Role HARUS lowercase: pusat, mitra, fasil'],
  ]

  const infoWs = XLSX.utils.aoa_to_sheet(infoData)
  infoWs['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info')

  XLSX.writeFile(wb, 'template-interviewer.xlsx')
}

export const parseInstrumentCSVFile = (file: File): Promise<ParsedInstrumentData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string
        const lines = csv.trim().split('\n')

        if (lines.length < 2) {
          reject(new Error('CSV file is empty or has only headers'))
          return
        }

        // Skip header line
        const dataLines = lines.slice(1)
        const instruments: Instrument[] = []
        const errors: string[] = []

        dataLines.forEach((line, index) => {
          try {
            // Parse CSV line (handle quoted fields)
            const parts: string[] = []
            let current = ''
            let inQuotes = false

            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === ',' && !inQuotes) {
                parts.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            parts.push(current.trim())

            if (parts.length < 3) {
              errors.push(`Row ${index + 2}: Insufficient columns (expected at least Bagian, Aspek, Indikator)`)
              return
            }

            let bagianRaw = parts[0]?.trim() || ''
            const aspek = parts[1]?.trim() || ''
            const indikator = parts[2]?.trim() || ''
            const keterangan = parts[3]?.trim() || ''

            // Normalize bagian
            let bagian: 'A' | 'B'
            if (bagianRaw.includes('WAJIB') || bagianRaw === 'A') {
              bagian = 'A'
            } else if (bagianRaw.includes('PENDUKUNG') || bagianRaw === 'B') {
              bagian = 'B'
            } else {
              errors.push(`Row ${index + 2}: Bagian must contain "WAJIB" or "PENDUKUNG" or be A/B`)
              return
            }

            if (!aspek) {
              errors.push(`Row ${index + 2}: Aspek is required`)
              return
            }
            if (!indikator) {
              errors.push(`Row ${index + 2}: Indikator is required`)
              return
            }

            instruments.push({
              id: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              bagian,
              aspek,
              indikator,
              keterangan,
              urutan: instruments.length + 1,
            })
          } catch (error) {
            errors.push(`Row ${index + 2}: Failed to parse row`)
          }
        })

        resolve({
          instruments,
          errors,
        })
      } catch (error) {
        reject(new Error(`Failed to parse CSV file: ${(error as Error).message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsText(file)
  })
}

export const parseInstrumentExcelFile = (file: File): Promise<ParsedInstrumentData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]

        if (!worksheet) {
          reject(new Error('No worksheet found in Excel file'))
          return
        }

        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

        if (rows.length === 0) {
          reject(new Error('Excel file is empty'))
          return
        }

        const instruments: Instrument[] = []
        const errors: string[] = []

        rows.forEach((row, index) => {
          try {
            const id = String(row['ID'] || row['id'] || '').trim()
            const bagian = String(row['Bagian'] || row['bagian'] || '').trim()
            const aspek = String(row['Aspek'] || row['aspek'] || '').trim()
            const pertanyaan = String(row['Pertanyaan'] || row['pertanyaan'] || '').trim()
            const indikator = String(row['Indikator'] || row['indikator'] || '').trim()
            const pilihan = String(row['Pilihan'] !== undefined ? row['Pilihan'] : '').trim()
            const keterangan = String(row['Keterangan'] || row['keterangan'] || '').trim()

            // Validate that it starts with A, B or C
            const bagianUpper = bagian.toUpperCase()
            if (!bagianUpper.startsWith('A') && !bagianUpper.startsWith('B') && !bagianUpper.startsWith('C')) {
              errors.push(`Row ${index + 2}: Bagian must start with A, B, or C`)
              return
            }


            if (!aspek) {
              errors.push(`Row ${index + 2}: Aspek is required`)
              return
            }
            if (!indikator) {
              errors.push(`Row ${index + 2}: Indikator is required`)
              return
            }

            // Generate ID if not provided
            const instrId = id || `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

            instruments.push({
              id: instrId,
              bagian,
              aspek,
              pertanyaan,
              indikator,
              pilihan,
              keterangan,
              urutan: index + 1,
            })
          } catch (error) {
            errors.push(`Row ${index + 2}: Failed to parse row`)
          }
        })

        resolve({
          instruments,
          errors,
        })
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

export const downloadScheduleTemplate = () => {
  const template = [
    {
      Wilayah: 'LKT',
      TanggalWawancara: '2026-06-01',
      IDInterviewerPusat: 'int-001',
      IDInterviewerMitra: 'int-003',
      IDInterviewerFasil: 'int-005',
      DaftarKandidat: '001,002,003',
    },
    {
      Wilayah: 'PKB',
      TanggalWawancara: '2026-06-02',
      IDInterviewerPusat: 'int-002',
      IDInterviewerMitra: 'int-004',
      IDInterviewerFasil: 'int-006',
      DaftarKandidat: '004,005',
    },
    {
      Wilayah: 'PDG',
      TanggalWawancara: '2026-06-03',
      IDInterviewerPusat: 'int-001',
      IDInterviewerMitra: 'int-003',
      IDInterviewerFasil: 'int-005',
      DaftarKandidat: '001,002',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal')

  // Auto-size columns
  ws['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 25 }]

  // Add info sheet dengan mapping region code
  const infoData = [
    ['Format Jadwal Wawancara'],
    [],
    ['Kolom yang diperlukan:'],
    ['- Wilayah: Kode wilayah (3 huruf) - lihat tabel mapping di bawah'],
    ['- TanggalWawancara: Format YYYY-MM-DD (contoh: 2026-06-01)'],
    ['- IDInterviewerPusat: ID dari data interviewer dengan role pusat (contoh: int-001)'],
    ['- IDInterviewerMitra: ID dari data interviewer dengan role mitra (contoh: int-003)'],
    ['- IDInterviewerFasil: ID dari data interviewer dengan role fasil (contoh: int-005)'],
    ['- DaftarKandidat: Comma-separated list ID kandidat (contoh: 001,002,003)'],
    [],
    ['MAPPING WILAYAH:'],
    ['Code | Nama Wilayah'],
    ['LKT  | LANGKAT'],
    ['PKB  | PEKANBARU'],
    ['DMI  | DUMAI'],
    ['PDG  | PADANG'],
    ['PLB  | PALEMBANG'],
    ['BGR  | BOGOR'],
    ['YGY  | YOGYAKARTA'],
    ['SBY  | SURABAYA'],
    ['SNJ  | SINJAI'],
    ['PDJ  | PIDIE JAYA'],
    ['AUT  | ACEH UTARA'],
    [],
    ['PENTING:'],
    ['1. Wilayah HARUS pakai KODE (LKT, PKB, DMI, dst) - lihat mapping di atas'],
    ['2. Interviewer IDs HARUS ada di Data Interviewer (format: int-001, int-002, dll)'],
    ['3. Candidate IDs HARUS ada di Data Kandidat (format: 001, 002, dll)'],
    ['4. TanggalWawancara format HARUS YYYY-MM-DD (tahun-bulan-tanggal)'],
    ['5. Jangan gunakan spasi setelah koma pada DaftarKandidat, atau keduanya ok'],
  ]

  const infoWs = XLSX.utils.aoa_to_sheet(infoData)
  infoWs['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info')

  XLSX.writeFile(wb, 'template-jadwal-wawancara.xlsx')
}

export const downloadInstrumentTemplate = () => {
  const template = [
    {
      ID: 'a1',
      Bagian: 'A. VERIFIKASI DATA SOSIAL-EKONOMI & KELAYAKAN ADMINISTRATIF',
      Aspek: 'Pendapatan & Tanggungan Keluarga',
      Pertanyaan: 'Cross-check pendapatan orang tua/wali atau pihak yang menanggung biaya hidup peserta. Berapa total pendapatan bulanan keluarga dan berapa jumlah anggota keluarga yang ditanggung dari pendapatan tersebut?',
      Indikator: 'Bandingkan nominal yang disebutkan dengan dokumen pendukung (slip gaji/SKTM/surat keterangan RT-RW). Hitung pendapatan per kapita untuk menilai kewajaran klaim ekonomi lemah.',
      Pilihan: 'Sesuai; Tidak Sesuai',
      Keterangan: '-',
    },
    {
      ID: 'b1',
      Bagian: 'B. PRESENTASI DIRI, WAWASAN & KEMAMPUAN KOMUNIKASI',
      Aspek: 'Pemahaman & Kejelasan Tujuan Hidup',
      Pertanyaan: 'Bagaimana Anda menjelaskan cita-cita Anda dalam jangka pendek (1-2 tahun), menengah (saat kuliah), dan panjang (setelah lulus)? Bagaimana keterkaitan cita-cita tersebut dengan kontribusi Anda pada masyarakat sekitar?',
      Indikator: 'Mampu menjelaskan cita-cita jangka pendek-menengah-panjang dengan jelas & terencana, serta mengaitkannya dengan kontribusi sosial.',
      Pilihan: '3',
      Keterangan: 'Skoring',
    },
    {
      ID: 'b2',
      Bagian: 'B. PRESENTASI DIRI, WAWASAN & KEMAMPUAN KOMUNIKASI',
      Aspek: 'Pemahaman & Kejelasan Tujuan Hidup',
      Pertanyaan: 'Bagaimana Anda menjelaskan cita-cita Anda dalam jangka pendek (1-2 tahun), menengah (saat kuliah), dan panjang (setelah lulus)? Bagaimana keterkaitan cita-cita tersebut dengan kontribusi Anda pada masyarakat sekitar?',
      Indikator: 'Memiliki cita-cita namun belum mengaitkannya dengan kontribusi sosial-masyarakat.',
      Pilihan: '2',
      Keterangan: 'Skoring',
    },
    {
      ID: 'b3',
      Bagian: 'B. PRESENTASI DIRI, WAWASAN & KEMAMPUAN KOMUNIKASI',
      Aspek: 'Pemahaman & Kejelasan Tujuan Hidup',
      Pertanyaan: 'Bagaimana Anda menjelaskan cita-cita Anda dalam jangka pendek (1-2 tahun), menengah (saat kuliah), dan panjang (setelah lulus)? Bagaimana keterkaitan cita-cita tersebut dengan kontribusi Anda pada masyarakat sekitar?',
      Indikator: 'Belum memiliki cita-cita yang jelas.',
      Pilihan: '1',
      Keterangan: 'Skoring',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Instrumen')

  // Auto-size columns
  ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 45 }, { wch: 45 }, { wch: 15 }, { wch: 15 }]

  // Add info sheet
  const infoData = [
    ['Format Instrumen Wawancara Baru'],
    [],
    ['Kolom yang diperlukan:'],
    ['- ID: Identifier unik instrumen (contoh: a1, b1, b2, dll)'],
    ['- Bagian: Dimulai dengan "A" (Kualifikasi Wajib) atau "B" (Kualifikasi Pendukung)'],
    ['- Aspek: Judul/kategori aspek yang dinilai'],
    ['- Pertanyaan: Deskripsi pertanyaan panduan untuk interviewer'],
    ['- Indikator: Kriteria penilaian atau deskripsi indikator rubrik'],
    ['- Pilihan: Untuk Bagian A: Opsi jawaban (dipisahkan titik koma, contoh: Ya; Tidak atau Sesuai; Tidak Sesuai). Untuk Bagian B: Skor (contoh: 3, 2, 1)'],
    ['- Keterangan: Catatan tambahan atau jenis penanganan logic (contoh: Skoring, dll)'],
  ]

  const infoWs = XLSX.utils.aoa_to_sheet(infoData)
  infoWs['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info')

  XLSX.writeFile(wb, 'template-instrumen.xlsx')
}
