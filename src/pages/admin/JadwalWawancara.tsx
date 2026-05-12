import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useScheduleStore } from '../../store/scheduleStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'
import { parseScheduleExcelFile, downloadScheduleTemplate } from '../../utils/excelParser'

// Format tanggal ke format Indonesia: Sabtu, 16 Mei 2026
const formatDateIndonesian = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const dayName = dayNames[date.getDay()]
  const day = date.getDate()
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()

  return `${dayName}, ${day} ${month} ${year}`
}

export default function JadwalWawancara() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const schedules = useScheduleStore((state) => state.schedules)
  const addSchedule = useScheduleStore((state) => state.addSchedule)
  const updateSchedule = useScheduleStore((state) => state.updateSchedule)
  const bulkAddSchedules = useScheduleStore((state) => state.bulkAddSchedules)
  const deleteSchedule = useScheduleStore((state) => state.deleteSchedule)
  const addCandidateToSchedule = useScheduleStore((state) => state.addCandidateToSchedule)
  const removeCandidateFromSchedule = useScheduleStore((state) => state.removeCandidateFromSchedule)

  const candidates = useCandidateStore((state) => state.candidates)
  const interviewers = useInterviewerStore((state) => state.interviewers)

  useEffect(() => {
    useCandidateStore.getState().loadFromSupabase()
    useScheduleStore.getState().loadFromSupabase()
    useInterviewerStore.getState().loadFromSupabase()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const { schedules: parsedSchedules, errors } = await parseScheduleExcelFile(file)

      if (errors.length > 0) {
        const errorMsg = errors.length > 0 ? `${errors.length} validation error(s): ${errors[0]}` : ''
        setToast({ message: `Import failed. ${errorMsg}`, type: 'error' })
        setIsLoading(false)
        return
      }

      if (parsedSchedules.length === 0) {
        setToast({ message: 'No valid schedules found in file', type: 'error' })
        setIsLoading(false)
        return
      }

      // Validate that all interviewer IDs exist
      const interviewerIds = new Set(interviewers.map((i) => i.id))
      const candidateIds = new Set(candidates.map((c) => c.id))

      const missingIds = {
        interviewers: new Set<string>(),
        candidates: new Set<string>(),
      }

      const validSchedules = parsedSchedules.filter((s) => {
        // Validate interviewers if provided
        if (s.pusat_id && !interviewerIds.has(s.pusat_id)) {
          missingIds.interviewers.add(s.pusat_id)
          return false
        }
        if (s.cabang_id && !interviewerIds.has(s.cabang_id)) {
          missingIds.interviewers.add(s.cabang_id)
          return false
        }
        if (s.mentor_id && !interviewerIds.has(s.mentor_id)) {
          missingIds.interviewers.add(s.mentor_id)
          return false
        }

        // At least one interviewer should be provided
        if (!s.pusat_id && !s.cabang_id && !s.mentor_id) {
          return false
        }

        // Validate all candidate IDs
        if (s.candidate_ids && s.candidate_ids.length > 0) {
          const invalidCandidates = s.candidate_ids.filter((id: string) => !candidateIds.has(id))
          if (invalidCandidates.length > 0) {
            invalidCandidates.forEach((id) => missingIds.candidates.add(id))
            return false
          }
        }
        return true
      })

      if (validSchedules.length === 0) {
        let errorMsg = 'No valid schedules found.'
        if (missingIds.interviewers.size > 0) {
          errorMsg += ` Missing interviewer IDs: ${Array.from(missingIds.interviewers).join(', ')}.`
        }
        if (missingIds.candidates.size > 0) {
          errorMsg += ` Missing candidate IDs: ${Array.from(missingIds.candidates).join(', ')}.`
        }

        // If both are empty, provide more detailed message
        if (missingIds.interviewers.size === 0 && missingIds.candidates.size === 0) {
          errorMsg = 'No valid schedules found. Check browser console for details.'
        }

        setToast({
          message: errorMsg,
          type: 'error',
        })
        setIsLoading(false)
        return
      }

      // Convert parsed format to Schedule format for insertion
      const schedulesToInsert = validSchedules.map((s: any) => ({
        interview_date: s.interview_date,
        pusat_id: s.pusat_id,
        cabang_id: s.cabang_id,
        mentor_id: s.mentor_id,
        status: 'belum' as const,
        candidate_ids: s.candidate_ids || [],
      }))

      await bulkAddSchedules(schedulesToInsert)
      setToast({
        message: `Successfully imported ${validSchedules.length} schedule(s)`,
        type: 'success',
      })
    } catch (error) {
      setToast({ message: `Import error: ${(error as Error).message}`, type: 'error' })
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      try {
        await deleteSchedule(scheduleId)
        setToast({ message: 'Jadwal berhasil dihapus', type: 'success' })
      } catch (error) {
        setToast({ message: `Gagal menghapus jadwal: ${(error as Error).message}`, type: 'error' })
      }
    }
  }

  const getCandidateName = (id: string) => {
    return candidates.find((c) => c.id === id)?.full_name || `Kandidat ${id}`
  }

  const getAvailableCandidates = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (!schedule) return candidates

    const assignedIds = new Set(schedule.candidate_ids)
    return candidates.filter((c) => !assignedIds.has(c.id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Wawancara</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            + Buat Jadwal Baru
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 p-4 rounded-lg text-white z-50 ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Jadwal Wawancara</h2>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File Excel (.xlsx)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kolom: TanggalWawancara, IDInterviewerPusat, IDInterviewerCabang, IDInterviewerMentor, DaftarKandidat
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-6">
              <button
                onClick={downloadScheduleTemplate}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                📥 Download Template
              </button>
            </div>
          </div>

          {isLoading && <p className="text-blue-600 mt-2 text-sm">Processing file...</p>}
        </div>
        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">Belum ada jadwal wawancara.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Buat Jadwal Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">📅 {formatDateIndonesian(schedule.interview_date)}</h3>
                    <p className="text-sm text-gray-600">
                      {(schedule.candidate_ids || []).length} kandidat terjadwal
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setEditingScheduleId(schedule.id)
                        setShowEditModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* Interviewers */}
                <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs font-semibold text-blue-700 mb-1">🏛️ PUSAT</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.pusat_id ? interviewers.find((i) => i.id === schedule.pusat_id)?.full_name || 'N/A' : 'Belum ditentukan'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs font-semibold text-green-700 mb-1">🏢 CABANG</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.cabang_id ? interviewers.find((i) => i.id === schedule.cabang_id)?.full_name || 'N/A' : 'Belum ditentukan'}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs font-semibold text-purple-700 mb-1">👨‍🏫 MENTOR</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.mentor_id ? interviewers.find((i) => i.id === schedule.mentor_id)?.full_name || 'N/A' : 'Belum ditentukan'}
                    </p>
                  </div>
                </div>

                {/* Candidates */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-900">Kandidat:</h4>
                    <button
                      onClick={() =>
                        setExpandedScheduleId(
                          expandedScheduleId === schedule.id ? null : schedule.id
                        )
                      }
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {expandedScheduleId === schedule.id ? 'Sembunyikan' : 'Lihat/Edit'}
                    </button>
                  </div>

                  {expandedScheduleId === schedule.id && (
                    <div className="bg-gray-50 rounded p-4">
                      {(schedule.candidate_ids || []).length === 0 ? (
                        <p className="text-gray-500 text-sm mb-3">Belum ada kandidat</p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {(schedule.candidate_ids || []).map((candId) => (
                            <div
                              key={candId}
                              className="flex justify-between items-center bg-white p-2 rounded border border-gray-200"
                            >
                              <span className="text-sm text-gray-900">{getCandidateName(candId)}</span>
                              <button
                                onClick={() => removeCandidateFromSchedule(schedule.id, candId)}
                                className="text-red-600 hover:text-red-700 text-xs font-medium"
                              >
                                Hapus
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Candidates */}
                      <div className="border-t border-gray-200 pt-3">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Tambah Kandidat:
                        </label>
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addCandidateToSchedule(schedule.id, e.target.value)
                              e.target.value = ''
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Pilih kandidat...</option>
                          {getAvailableCandidates(schedule.id).map((cand) => (
                            <option key={cand.id} value={cand.id}>
                              {cand.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <CreateScheduleModal
          onClose={() => setShowCreateModal(false)}
          onCreate={addSchedule}
          candidates={candidates}
          interviewers={interviewers}
        />
      )}

      {/* Edit Schedule Modal */}
      {showEditModal && editingScheduleId && (
        <EditScheduleModal
          schedule={schedules.find((s) => s.id === editingScheduleId)!}
          onClose={() => {
            setShowEditModal(false)
            setEditingScheduleId(null)
          }}
          onUpdate={updateSchedule}
          candidates={candidates}
          interviewers={interviewers}
        />
      )}
    </div>
  )
}

interface CreateScheduleModalProps {
  onClose: () => void
  onCreate: (schedule: any) => Promise<void>
  candidates: any[]
  interviewers: any[]
}

function CreateScheduleModal({ onClose, onCreate, candidates, interviewers }: CreateScheduleModalProps) {
  const [date, setDate] = useState('')
  const [pusatId, setPusatId] = useState<string>('')
  const [cabangId, setCabangId] = useState<string>('')
  const [mentorId, setMentorId] = useState<string>('')
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])

  const handleToggleCandidate = (candId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    )
  }

  const handleCreate = async () => {
    if (!date || selectedCandidateIds.length === 0) {
      alert('Harap isi tanggal dan pilih minimal 1 kandidat')
      return
    }

    // At least one interviewer should be selected
    if (!pusatId && !cabangId && !mentorId) {
      alert('Pilih minimal 1 interviewer')
      return
    }

    await onCreate({
      interview_date: date,
      pusat_id: pusatId || undefined,
      cabang_id: cabangId || undefined,
      mentor_id: mentorId || undefined,
      status: 'belum',
      candidate_ids: selectedCandidateIds,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Buat Jadwal Wawancara Baru</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {interviewers.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
              ⚠️ Belum ada interviewer yang didaftarkan. Harap tambah data interviewer terlebih dahulu.
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Interviewers */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer Pusat</label>
              <select
                value={pusatId}
                onChange={(e) => setPusatId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Pilih...</option>
                {interviewers
                  .filter((i) => i.role === 'pusat')
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.full_name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewer Cabang
              </label>
              <select
                value={cabangId}
                onChange={(e) => setCabangId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Pilih...</option>
                {interviewers
                  .filter((i) => i.role === 'cabang')
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.full_name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewer Mentor
              </label>
              <select
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Pilih...</option>
                {interviewers
                  .filter((i) => i.role === 'mentor')
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.full_name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Candidates Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Pilih Kandidat</label>
            {candidates.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada kandidat. Import data kandidat terlebih dahulu.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {candidates.map((cand) => (
                  <label key={cand.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCandidateIds.includes(cand.id)}
                      onChange={() => handleToggleCandidate(cand.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900">{cand.full_name}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Terpilih: {selectedCandidateIds.length} kandidat
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Buat Jadwal
          </button>
        </div>
      </div>
    </div>
  )
}

interface EditScheduleModalProps {
  schedule: any
  onClose: () => void
  onUpdate: (id: string, schedule: any) => Promise<void>
  candidates: any[]
  interviewers: any[]
}

function EditScheduleModal({ schedule, onClose, onUpdate, candidates, interviewers }: EditScheduleModalProps) {
  const [date, setDate] = useState(schedule.interview_date)
  const [pusatId, setPusatId] = useState<string>(schedule.pusat_id || '')
  const [cabangId, setCabangId] = useState<string>(schedule.cabang_id || '')
  const [mentorId, setMentorId] = useState<string>(schedule.mentor_id || '')
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(schedule.candidate_ids || [])

  const handleToggleCandidate = (candId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    )
  }

  const handleUpdate = async () => {
    if (!date || selectedCandidateIds.length === 0) {
      alert('Harap isi tanggal dan pilih minimal 1 kandidat')
      return
    }

    // At least one interviewer should be selected
    if (!pusatId && !cabangId && !mentorId) {
      alert('Pilih minimal 1 interviewer')
      return
    }

    await onUpdate(schedule.id, {
      interview_date: date,
      pusat_id: pusatId || undefined,
      cabang_id: cabangId || undefined,
      mentor_id: mentorId || undefined,
      candidate_ids: selectedCandidateIds,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Edit Jadwal Wawancara</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {interviewers.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
              ⚠️ Belum ada interviewer yang didaftarkan. Harap tambah data interviewer terlebih dahulu.
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Interviewers */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Interviewer (minimal 1, boleh kosong jika diubah nanti)</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer Pusat</label>
                <select
                  value={pusatId}
                  onChange={(e) => setPusatId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Pilih...</option>
                  {interviewers
                    .filter((i) => i.role === 'pusat')
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.full_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interviewer Cabang
                </label>
                <select
                  value={cabangId}
                  onChange={(e) => setCabangId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Pilih...</option>
                  {interviewers
                    .filter((i) => i.role === 'cabang')
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.full_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interviewer Mentor
                </label>
                <select
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Pilih...</option>
                  {interviewers
                    .filter((i) => i.role === 'mentor')
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.full_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Candidates Checklist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Pilih Kandidat</label>
            {candidates.length === 0 ? (
              <p className="text-gray-500 text-sm">Belum ada kandidat. Import data kandidat terlebih dahulu.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {candidates.map((cand) => (
                  <label key={cand.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCandidateIds.includes(cand.id)}
                      onChange={() => handleToggleCandidate(cand.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-900">{cand.full_name}</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Terpilih: {selectedCandidateIds.length} kandidat
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handleUpdate}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  )
}
