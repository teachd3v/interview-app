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
    interview_date: string
    pusat_id: string
    cabang_id: string
    mentor_id: string
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
            const school = String(row['Sekolah'] || row['sekolah'] || row['School'] || row['school'] || '').trim()
            const region = String(row['Wilayah'] || row['wilayah'] || row['Region'] || row['region'] || '').trim()
            const email = String(row['Email'] || row['email'] || '').trim()
            const birthDate = String(row['TglLahir'] || row['tglLahir'] || row['Tanggal Lahir'] || row['BirthDate'] || row['birthDate'] || '').trim()

            // Validation
            if (!id) {
              errors.push(`Row ${index + 2}: ID is required`)
              return
            }
            if (!fullName) {
              errors.push(`Row ${index + 2}: Name is required`)
              return
            }
            if (!school) {
              errors.push(`Row ${index + 2}: School is required`)
              return
            }
            if (!region) {
              errors.push(`Row ${index + 2}: Region is required`)
              return
            }
            if (!email) {
              errors.push(`Row ${index + 2}: Email is required`)
              return
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
              errors.push(`Row ${index + 2}: Invalid email format`)
              return
            }

            // Format date (accept various formats: YYYY-MM-DD, DD/MM/YYYY, etc)
            let formattedDate = birthDate
            if (birthDate && !birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Try to parse and reformat
              const parsed = new Date(birthDate)
              if (!isNaN(parsed.getTime())) {
                formattedDate = parsed.toISOString().split('T')[0]
              }
            }

            candidates.push({
              id,
              full_name: fullName,
              school,
              region,
              email,
              birth_date: formattedDate || null,
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
            } else if (role === 'cabang' || role === 'Cabang' || role === 'CABANG') {
              role = 'cabang'
            } else if (role === 'mentor' || role === 'Mentor' || role === 'MENTOR') {
              role = 'mentor'
            }

            const region = String(row['Region'] || row['region'] || row['Wilayah'] || row['wilayah'] || '').trim()
            const email = String(row['Email'] || row['email'] || '').trim()

            // Validation
            if (!id) {
              errors.push(`Row ${index + 2}: ID is required`)
              return
            }
            if (!fullName) {
              errors.push(`Row ${index + 2}: Name is required`)
              return
            }
            if (!role || !['pusat', 'cabang', 'mentor'].includes(role)) {
              errors.push(`Row ${index + 2}: Role must be pusat, cabang, or mentor (case-insensitive)`)
              return
            }
            if (!region) {
              errors.push(`Row ${index + 2}: Region is required`)
              return
            }
            if (!email) {
              errors.push(`Row ${index + 2}: Email is required`)
              return
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
              errors.push(`Row ${index + 2}: Invalid email format`)
              return
            }

            interviewers.push({
              id,
              full_name: fullName,
              role: role as 'pusat' | 'cabang' | 'mentor',
              region,
              email,
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
      Sekolah: 'SMA Negeri 1 Jakarta',
      Wilayah: 'DKI Jakarta',
      Email: 'ahmad@email.com',
      TglLahir: '2003-05-15',
    },
    {
      ID: '002',
      Nama: 'Siti Nurhaliza Wijaya',
      Sekolah: 'SMA Negeri 2 Bandung',
      Wilayah: 'Jawa Barat',
      Email: 'siti@email.com',
      TglLahir: '2003-08-22',
    },
    {
      ID: '003',
      Nama: 'Budi Santoso',
      Sekolah: 'SMA Negeri 3 Surabaya',
      Wilayah: 'Jawa Timur',
      Email: 'budi.santoso@email.com',
      TglLahir: '2002-11-10',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kandidat')

  // Auto-size columns
  ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }]

  XLSX.writeFile(wb, 'template-kandidat.xlsx')
}

export const parseScheduleExcelFile = (file: File): Promise<ParsedScheduleData> => {
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

        const schedules: ParsedScheduleData['schedules'] = []
        const errors: string[] = []

        rows.forEach((row, index) => {
          try {
            const date = String(row['TanggalWawancara'] || row['tanggalWawancara'] || row['Tanggal'] || row['Date'] || '').trim()
            const pusatId = String(row['IDInterviewerPusat'] || row['idInterviewerPusat'] || row['Pusat'] || '').trim()
            const cabangId = String(row['IDInterviewerCabang'] || row['idInterviewerCabang'] || row['Cabang'] || '').trim()
            const mentorId = String(row['IDInterviewerMentor'] || row['idInterviewerMentor'] || row['Mentor'] || '').trim()
            const daftarKandidatStr = String(row['DaftarKandidat'] || row['daftarKandidat'] || row['Kandidat'] || '').trim()

            // Validation
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
            if (!pusatId && !cabangId && !mentorId) {
              errors.push(`Row ${index + 2}: Minimal 1 interviewer ID harus diisi (Pusat, Cabang, atau Mentor)`)
              return
            }

            schedules.push({
              interview_date: date,
              pusat_id: pusatId || undefined,
              cabang_id: cabangId || undefined,
              mentor_id: mentorId || undefined,
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
      Region: 'DKI Jakarta',
      Email: 'bambang.sutrisno@lpdp.go.id',
    },
    {
      ID: 'int-002',
      Nama: 'Ibu Sinta Wijaya',
      Role: 'pusat',
      Region: 'DKI Jakarta',
      Email: 'sinta.wijaya@lpdp.go.id',
    },
    {
      ID: 'int-003',
      Nama: 'Pak Hendra Gunawan',
      Role: 'cabang',
      Region: 'Jawa Barat',
      Email: 'hendra.gunawan@lpdp.go.id',
    },
    {
      ID: 'int-004',
      Nama: 'Dr. Eka Putri',
      Role: 'cabang',
      Region: 'Jawa Timur',
      Email: 'eka.putri@lpdp.go.id',
    },
    {
      ID: 'int-005',
      Nama: 'Ahmad Syaiful (Mentor)',
      Role: 'mentor',
      Region: 'DKI Jakarta',
      Email: 'ahmad.mentor@email.com',
    },
    {
      ID: 'int-006',
      Nama: 'Sri Rahayu (Mentor)',
      Role: 'mentor',
      Region: 'Jawa Barat',
      Email: 'sri.mentor@email.com',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Interviewer')

  // Auto-size columns
  ws['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 30 }]

  // Add info sheet dengan penjelasan
  const infoData = [
    ['Format Data Interviewer'],
    [],
    ['Kolom yang diperlukan:'],
    ['- ID: Identifier unik (contoh: int-001, int-002, int-003)'],
    ['- Nama: Nama lengkap interviewer'],
    ['- Role: pusat, cabang, atau mentor (LOWERCASE)'],
    ['- Region: Wilayah/Provinsi'],
    ['- Email: Email address'],
    [],
    ['Catatan:'],
    ['- Gunakan format ID yang konsisten (int-001, bukan int-01)'],
    ['- Role HARUS lowercase: pusat, cabang, mentor'],
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
            const bagian = String(row['Bagian'] || row['bagian'] || '').trim().toUpperCase()
            const aspek = String(row['Aspek'] || row['aspek'] || '').trim()
            const indikator = String(row['Indikator'] || row['indikator'] || '').trim()
            const keterangan = String(row['Keterangan'] || row['keterangan'] || '').trim()

            // Validation
            if (!bagian || !['A', 'B'].includes(bagian)) {
              errors.push(`Row ${index + 2}: Bagian must be A or B`)
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
              bagian: bagian as 'A' | 'B',
              aspek,
              indikator,
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
      TanggalWawancara: '2026-06-01',
      IDInterviewerPusat: 'int-001',
      IDInterviewerCabang: 'int-003',
      IDInterviewerMentor: 'int-005',
      DaftarKandidat: '001,002,003',
    },
    {
      TanggalWawancara: '2026-06-02',
      IDInterviewerPusat: 'int-002',
      IDInterviewerCabang: 'int-004',
      IDInterviewerMentor: 'int-006',
      DaftarKandidat: '004,005',
    },
    {
      TanggalWawancara: '2026-06-03',
      IDInterviewerPusat: 'int-001',
      IDInterviewerCabang: 'int-003',
      IDInterviewerMentor: 'int-005',
      DaftarKandidat: '001,002',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Jadwal')

  // Auto-size columns
  ws['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 25 }]

  // Add info sheet dengan penjelasan
  const infoData = [
    ['Format Jadwal Wawancara'],
    [],
    ['Kolom yang diperlukan:'],
    ['- TanggalWawancara: Format YYYY-MM-DD (contoh: 2026-06-01)'],
    ['- IDInterviewerPusat: ID dari data interviewer dengan role pusat (contoh: int-001)'],
    ['- IDInterviewerCabang: ID dari data interviewer dengan role cabang (contoh: int-003)'],
    ['- IDInterviewerMentor: ID dari data interviewer dengan role mentor (contoh: int-005)'],
    ['- DaftarKandidat: Comma-separated list ID kandidat (contoh: 001,002,003)'],
    [],
    ['PENTING:'],
    ['1. Interviewer IDs HARUS ada di Data Interviewer (format: int-001, int-002, dll)'],
    ['2. Candidate IDs HARUS ada di Data Kandidat (format: 001, 002, dll)'],
    ['3. TanggalWawancara format HARUS YYYY-MM-DD (tahun-bulan-tanggal)'],
    ['4. Jangan gunakan spasi setelah koma pada DaftarKandidat, atau keduanya ok'],
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
      Bagian: 'A',
      Aspek: 'Wajib',
      Indikator: 'Lulus jenjang minimal SMA/sederajat',
      Keterangan: 'Kandidat telah lulus pendidikan SMA atau sederajat',
    },
    {
      ID: 'a2',
      Bagian: 'A',
      Aspek: 'Wajib',
      Indikator: 'Berusia 17-25 tahun',
      Keterangan: 'Kandidat masuk dalam rentang usia yang ditentukan',
    },
    {
      ID: 'b1',
      Bagian: 'B',
      Aspek: 'Akademik',
      Indikator: 'Alasan memilih program studi jelas',
      Keterangan: 'Kandidat dapat menjelaskan alasan pemilihan program studi dengan jelas dan logis',
    },
    {
      ID: 'b2',
      Bagian: 'B',
      Aspek: 'Akademik',
      Indikator: 'Target karir terukur',
      Keterangan: 'Kandidat memiliki target karir yang spesifik dan terukur',
    },
    {
      ID: 'b6',
      Bagian: 'B',
      Aspek: 'Bahasa',
      Indikator: 'Penguasaan bahasa Inggris baik',
      Keterangan: 'Kandidat menguasai bahasa Inggris dengan baik (lisan & tulis)',
    },
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Instrumen')

  // Auto-size columns
  ws['!cols'] = [{ wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 35 }, { wch: 50 }]

  // Add info sheet
  const infoData = [
    ['Format Instrumen Wawancara'],
    [],
    ['Kolom yang diperlukan:'],
    ['- ID: Identifier unik instrumen (opsional, akan auto-generate jika kosong)'],
    ['- Bagian: A (Kualifikasi Wajib) atau B (Kualifikasi Pendukung)'],
    ['- Aspek: Kategori (Akademik, Bahasa, LPDP, Kepribadian, Keluarga, Domisili, Pengalaman, Potensi)'],
    ['- Indikator: Pertanyaan atau statement yang dinilai'],
    ['- Keterangan: Penjelasan, rubric, atau deskripsi indikator'],
    [],
    ['Catatan:'],
    ['- Bagian A: Maksimal 8 indikator (Ya/Tidak - semua harus Ya untuk lulus)'],
    ['- Bagian B: Maksimal 20 indikator (Ya/Ragu/Tidak - di-score 2/1/0)'],
  ]

  const infoWs = XLSX.utils.aoa_to_sheet(infoData)
  infoWs['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info')

  XLSX.writeFile(wb, 'template-instrumen.xlsx')
}
