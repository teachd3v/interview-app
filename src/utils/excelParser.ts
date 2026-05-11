import * as XLSX from 'xlsx'
import { Candidate } from '../store/candidateStore'
import { Interviewer } from '../store/interviewerStore'

export interface ParsedCandidateData {
  candidates: Candidate[]
  errors: string[]
}

export interface ParsedInterviewerData {
  interviewers: Interviewer[]
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
              fullName,
              school,
              region,
              email,
              birthDate: formattedDate,
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
            const role = String(row['Role'] || row['role'] || '').trim().toLowerCase()
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
              errors.push(`Row ${index + 2}: Role must be pusat, cabang, or mentor`)
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
              fullName,
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

export const downloadExcelTemplate = () => {
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
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Kandidat')

  // Auto-size columns
  ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }]

  XLSX.writeFile(wb, 'template-kandidat.xlsx')
}
