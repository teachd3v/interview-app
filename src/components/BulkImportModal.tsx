import { useState } from 'react'
import {
  parseExcelFile,
  parseInterviewerExcelFile,
  parseScheduleExcelFile,
  downloadCandidateTemplate,
  downloadInterviewerTemplate,
  downloadScheduleTemplate,
} from '../utils/excelParser'
import { useCandidateStore } from '../store/candidateStore'
import { useInterviewerStore } from '../store/interviewerStore'
import { useScheduleStore } from '../store/scheduleStore'

interface BulkImportModalProps {
  onClose: () => void
}

export default function BulkImportModal({ onClose }: BulkImportModalProps) {
  const [candidateFile, setCandidateFile] = useState<File | null>(null)
  const [interviewerFile, setInterviewerFile] = useState<File | null>(null)
  const [scheduleFile, setScheduleFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const setCandidates = useCandidateStore((state) => state.setCandidates)
  const candidates = useCandidateStore((state) => state.candidates)

  const setInterviewers = useInterviewerStore((state) => state.setInterviewers)
  const interviewers = useInterviewerStore((state) => state.interviewers)

  const createSchedule = useScheduleStore((state) => state.createSchedule)
  const schedules = useScheduleStore((state) => state.schedules)

  const handleImport = async () => {
    if (!candidateFile && !interviewerFile && !scheduleFile) {
      setMessage({ type: 'error', text: 'Pilih minimal 1 file untuk diimport' })
      return
    }

    setIsProcessing(true)
    setMessage(null)

    try {
      let importedCandidates = candidates
      let importedInterviewers = interviewers
      let errors: string[] = []

      // Parse Candidates
      if (candidateFile) {
        try {
          const { candidates: parsed, errors: parseErrors } = await parseExcelFile(candidateFile)
          if (parseErrors.length > 0) {
            errors = [...errors, ...parseErrors.map((e) => `Kandidat: ${e}`)]
          } else {
            const existingIds = new Set(importedCandidates.map((c) => c.id))
            const newOnes = parsed.filter((c) => !existingIds.has(c.id))
            importedCandidates = [...importedCandidates, ...newOnes]
            setCandidates(importedCandidates)
          }
        } catch (error) {
          errors.push(`Kandidat: ${(error as Error).message}`)
        }
      }

      // Parse Interviewers
      if (interviewerFile) {
        try {
          const { interviewers: parsed, errors: parseErrors } = await parseInterviewerExcelFile(interviewerFile)
          if (parseErrors.length > 0) {
            errors = [...errors, ...parseErrors.map((e) => `Interviewer: ${e}`)]
          } else {
            const existingIds = new Set(importedInterviewers.map((i) => i.id))
            const newOnes = parsed.filter((i) => !existingIds.has(i.id))
            importedInterviewers = [...importedInterviewers, ...newOnes]
            setInterviewers(importedInterviewers)
          }
        } catch (error) {
          errors.push(`Interviewer: ${(error as Error).message}`)
        }
      }

      // Parse Schedules
      if (scheduleFile) {
        try {
          const { schedules: parsed, errors: parseErrors } = await parseScheduleExcelFile(scheduleFile)
          if (parseErrors.length > 0) {
            errors = [...errors, ...parseErrors.map((e) => `Jadwal: ${e}`)]
          } else {
            // Validate that all referenced IDs exist
            for (const schedule of parsed) {
              const pusat = importedInterviewers.find((i) => i.id === schedule.pusatId)
              const cabang = importedInterviewers.find((i) => i.id === schedule.cabangId)
              const mentor = importedInterviewers.find((i) => i.id === schedule.mentorId)

              if (!pusat) {
                errors.push(`Jadwal ${schedule.date}: Interviewer Pusat ID ${schedule.pusatId} tidak ditemukan`)
                continue
              }
              if (!cabang) {
                errors.push(`Jadwal ${schedule.date}: Interviewer Cabang ID ${schedule.cabangId} tidak ditemukan`)
                continue
              }
              if (!mentor) {
                errors.push(`Jadwal ${schedule.date}: Interviewer Mentor ID ${schedule.mentorId} tidak ditemukan`)
                continue
              }

              // Validate all candidate IDs exist
              const missingCandidates = schedule.candidateIds.filter(
                (id) => !importedCandidates.find((c) => c.id === id)
              )
              if (missingCandidates.length > 0) {
                errors.push(
                  `Jadwal ${schedule.date}: Kandidat tidak ditemukan: ${missingCandidates.join(', ')}`
                )
                continue
              }

              // Create schedule
              createSchedule(schedule.date, pusat, cabang, mentor, schedule.candidateIds)
            }
          }
        } catch (error) {
          errors.push(`Jadwal: ${(error as Error).message}`)
        }
      }

      if (errors.length > 0) {
        setMessage({
          type: 'error',
          text: `Import selesai dengan ${errors.length} error(s):\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`,
        })
      } else {
        setMessage({
          type: 'success',
          text: 'Semua data berhasil diimport!',
        })
        setTimeout(() => onClose(), 2000)
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error: ${(error as Error).message}` })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-900">Bulk Import Data</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div
              className={`p-4 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : message.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                {message.text}
              </pre>
            </div>
          )}

          {/* Kandidat Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">1. Data Kandidat (Opsional)</h3>
              <button
                onClick={downloadCandidateTemplate}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                📥 Template
              </button>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setCandidateFile(e.target.files?.[0] || null)}
              disabled={isProcessing}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-2">
              {candidateFile ? `✓ ${candidateFile.name}` : 'Pilih file Excel (.xlsx)'}
            </p>
          </div>

          {/* Interviewer Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">2. Data Interviewer (Opsional)</h3>
              <button
                onClick={downloadInterviewerTemplate}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                📥 Template
              </button>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setInterviewerFile(e.target.files?.[0] || null)}
              disabled={isProcessing}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-2">
              {interviewerFile ? `✓ ${interviewerFile.name}` : 'Pilih file Excel (.xlsx)'}
            </p>
          </div>

          {/* Schedule Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">3. Jadwal Wawancara (Opsional)</h3>
              <button
                onClick={downloadScheduleTemplate}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                📥 Template
              </button>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setScheduleFile(e.target.files?.[0] || null)}
              disabled={isProcessing}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-2">
              {scheduleFile ? `✓ ${scheduleFile.name}` : 'Pilih file Excel (.xlsx)'}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
            <p className="font-semibold mb-1">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Import data dalam urutan: Kandidat → Interviewer → Jadwal</li>
              <li>Jadwal memerlukan ID yang sudah ada di Kandidat & Interviewer</li>
              <li>Klik "Template" untuk download contoh format</li>
              <li>Minimal upload 1 file untuk proceed</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleImport}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Import Semua'}
          </button>
        </div>
      </div>
    </div>
  )
}
