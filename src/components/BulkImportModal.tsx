import { useState } from 'react'
import {
  parseExcelFile,
  parseInterviewerExcelFile,
  parseInstrumentExcelFile,
  parseInstrumentCSVFile,
  parseScheduleExcelFile,
  downloadCandidateTemplate,
  downloadInterviewerTemplate,
  downloadInstrumentTemplate,
  downloadScheduleTemplate,
} from '../utils/excelParser'
import { useCandidateStore } from '../store/candidateStore'
import { useInterviewerStore } from '../store/interviewerStore'
import { useInstrumentStore } from '../store/instrumentStore'
import { useScheduleStore } from '../store/scheduleStore'

interface BulkImportModalProps {
  onClose: () => void
}

export default function BulkImportModal({ onClose }: BulkImportModalProps) {
  const [candidateFile, setCandidateFile] = useState<File | null>(null)
  const [candidatePreview, setCandidatePreview] = useState<any[] | null>(null)

  const [interviewerFile, setInterviewerFile] = useState<File | null>(null)
  const [interviewerPreview, setInterviewerPreview] = useState<any[] | null>(null)

  const [instrumentFile, setInstrumentFile] = useState<File | null>(null)
  const [instrumentPreview, setInstrumentPreview] = useState<any[] | null>(null)

  const [scheduleFile, setScheduleFile] = useState<File | null>(null)
  const [schedulePreview, setSchedulePreview] = useState<any[] | null>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const bulkAddCandidates = useCandidateStore((state) => state.bulkAddCandidates)
  const candidates = useCandidateStore((state) => state.candidates)

  const bulkAddInterviewers = useInterviewerStore((state) => state.bulkAddInterviewers)
  const interviewers = useInterviewerStore((state) => state.interviewers)

  const bulkAddInstruments = useInstrumentStore((state) => state.bulkAddInstruments)
  const instruments = useInstrumentStore((state) => state.instruments)

  const bulkAddSchedules = useScheduleStore((state) => state.bulkAddSchedules)
  const schedules = useScheduleStore((state) => state.schedules)

  // Handle file preview untuk candidates
  const handleCandidateFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCandidateFile(file)
    try {
      const { candidates: parsed } = await parseExcelFile(file)
      setCandidatePreview(parsed)
    } catch (error) {
      setMessage({ type: 'error', text: `Error parsing candidate file: ${(error as Error).message}` })
      setCandidatePreview(null)
    }
  }

  // Handle file preview untuk interviewers
  const handleInterviewerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setInterviewerFile(file)
    try {
      const { interviewers: parsed } = await parseInterviewerExcelFile(file)
      setInterviewerPreview(parsed)
    } catch (error) {
      setMessage({ type: 'error', text: `Error parsing interviewer file: ${(error as Error).message}` })
      setInterviewerPreview(null)
    }
  }

  // Handle file preview untuk instruments
  const handleInstrumentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setInstrumentFile(file)
    try {
      const isCSV = file.name.endsWith('.csv')
      const { instruments: parsed } = isCSV
        ? await parseInstrumentCSVFile(file)
        : await parseInstrumentExcelFile(file)
      setInstrumentPreview(parsed)
    } catch (error) {
      setMessage({ type: 'error', text: `Error parsing instrument file: ${(error as Error).message}` })
      setInstrumentPreview(null)
    }
  }

  // Handle file preview untuk schedules
  const handleScheduleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScheduleFile(file)
    try {
      const { schedules: parsed } = await parseScheduleExcelFile(file)
      setSchedulePreview(parsed)
    } catch (error) {
      setMessage({ type: 'error', text: `Error parsing schedule file: ${(error as Error).message}` })
      setSchedulePreview(null)
    }
  }

  const handleImport = async () => {
    if (!candidateFile && !interviewerFile && !instrumentFile && !scheduleFile) {
      setMessage({ type: 'error', text: 'Pilih minimal 1 file untuk diimport' })
      return
    }

    setIsProcessing(true)
    setMessage(null)

    try {
      let successCount = 0
      let errors: string[] = []

      // Import Candidates
      if (candidatePreview && candidateFile) {
        try {
          const existingIds = new Set(candidates.map((c) => c.id))
          const newOnes = candidatePreview.filter((c) => !existingIds.has(c.id))
          if (newOnes.length > 0) {
            await bulkAddCandidates(newOnes)
            successCount++
          }
        } catch (error) {
          errors.push(`Kandidat: ${(error as Error).message}`)
        }
      }

      // Import Interviewers
      if (interviewerPreview && interviewerFile) {
        try {
          const existingIds = new Set(interviewers.map((i) => i.id))
          const newOnes = interviewerPreview.filter((i) => !existingIds.has(i.id))
          if (newOnes.length > 0) {
            await bulkAddInterviewers(newOnes)
            successCount++
          }
        } catch (error) {
          errors.push(`Interviewer: ${(error as Error).message}`)
        }
      }

      // Import Instruments
      if (instrumentPreview && instrumentFile) {
        try {
          const existingIds = new Set(instruments.map((i) => i.id))
          const newOnes = instrumentPreview.filter((i) => !existingIds.has(i.id))
          if (newOnes.length > 0) {
            await bulkAddInstruments(newOnes)
            successCount++
          }
        } catch (error) {
          errors.push(`Instrumen: ${(error as Error).message}`)
        }
      }

      // Import Schedules
      if (schedulePreview && scheduleFile) {
        try {
          if (schedulePreview.length > 0) {
            await bulkAddSchedules(schedulePreview)
            successCount++
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
          text: `Semua data berhasil diimport! (${successCount} tipe data)`,
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
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
              {message.text}
            </div>
          )}

          {/* CANDIDATES SECTION */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📥 Data Kandidat</h3>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleCandidateFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <button
              onClick={downloadCandidateTemplate}
              className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded mb-3"
            >
              Download Template
            </button>

            {candidatePreview && candidatePreview.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Preview ({candidatePreview.length} data):
                </p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border border-gray-200">
                      <th className="px-2 py-1 text-left">Nama</th>
                      <th className="px-2 py-1 text-left">Sekolah</th>
                      <th className="px-2 py-1 text-left">Wilayah</th>
                      <th className="px-2 py-1 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidatePreview.slice(0, 3).map((item, idx) => (
                      <tr key={idx} className="border border-gray-200">
                        <td className="px-2 py-1">{item.full_name}</td>
                        <td className="px-2 py-1">{item.school}</td>
                        <td className="px-2 py-1">{item.region}</td>
                        <td className="px-2 py-1">{item.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {candidatePreview.length > 3 && (
                  <p className="text-xs text-gray-500 mt-1">... dan {candidatePreview.length - 3} data lainnya</p>
                )}
              </div>
            )}
          </div>

          {/* INTERVIEWERS SECTION */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📥 Data Interviewer</h3>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleInterviewerFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <button
              onClick={downloadInterviewerTemplate}
              className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded mb-3"
            >
              Download Template
            </button>

            {interviewerPreview && interviewerPreview.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Preview ({interviewerPreview.length} data):
                </p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border border-gray-200">
                      <th className="px-2 py-1 text-left">Nama</th>
                      <th className="px-2 py-1 text-left">Role</th>
                      <th className="px-2 py-1 text-left">Region</th>
                      <th className="px-2 py-1 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviewerPreview.slice(0, 3).map((item, idx) => (
                      <tr key={idx} className="border border-gray-200">
                        <td className="px-2 py-1">{item.full_name}</td>
                        <td className="px-2 py-1">{item.role}</td>
                        <td className="px-2 py-1">{item.region}</td>
                        <td className="px-2 py-1">{item.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {interviewerPreview.length > 3 && (
                  <p className="text-xs text-gray-500 mt-1">... dan {interviewerPreview.length - 3} data lainnya</p>
                )}
              </div>
            )}
          </div>

          {/* INSTRUMENTS SECTION */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📥 Data Instrumen</h3>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInstrumentFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <button
              onClick={downloadInstrumentTemplate}
              className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded mb-3"
            >
              Download Template
            </button>

            {instrumentPreview && instrumentPreview.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Preview ({instrumentPreview.length} data):
                </p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border border-gray-200">
                      <th className="px-2 py-1 text-left">Bagian</th>
                      <th className="px-2 py-1 text-left">Aspek</th>
                      <th className="px-2 py-1 text-left">Indikator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instrumentPreview.slice(0, 3).map((item, idx) => (
                      <tr key={idx} className="border border-gray-200">
                        <td className="px-2 py-1">{item.bagian}</td>
                        <td className="px-2 py-1">{item.aspek}</td>
                        <td className="px-2 py-1 text-xs">{item.indikator?.substring(0, 40)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {instrumentPreview.length > 3 && (
                  <p className="text-xs text-gray-500 mt-1">... dan {instrumentPreview.length - 3} data lainnya</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SCHEDULES SECTION */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📅 Data Jadwal Wawancara</h3>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleScheduleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
          />
          <button
            onClick={downloadScheduleTemplate}
            className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded mb-3"
          >
            Download Template
          </button>

          {schedulePreview && schedulePreview.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Preview ({schedulePreview.length} data):
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border border-gray-200">
                    <th className="px-2 py-1 text-left">Tanggal</th>
                    <th className="px-2 py-1 text-left">Pusat</th>
                    <th className="px-2 py-1 text-left">Cabang</th>
                    <th className="px-2 py-1 text-left">Mentor</th>
                    <th className="px-2 py-1 text-left">Kandidat</th>
                  </tr>
                </thead>
                <tbody>
                  {schedulePreview.slice(0, 3).map((item, idx) => (
                    <tr key={idx} className="border border-gray-200">
                      <td className="px-2 py-1">{item.interview_date}</td>
                      <td className="px-2 py-1 text-xs">{item.pusat_id}</td>
                      <td className="px-2 py-1 text-xs">{item.cabang_id}</td>
                      <td className="px-2 py-1 text-xs">{item.mentor_id}</td>
                      <td className="px-2 py-1 text-xs">{(item.candidate_ids || []).length} kandidat</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {schedulePreview.length > 3 && (
                <p className="text-xs text-gray-500 mt-1">... dan {schedulePreview.length - 3} data lainnya</p>
              )}
            </div>
          )}
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
          disabled={isProcessing || (!candidateFile && !interviewerFile && !instrumentFile && !scheduleFile)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
        >
          {isProcessing ? 'Mengimport...' : 'Import'}
        </button>
      </div>
    </div>
  )
}
