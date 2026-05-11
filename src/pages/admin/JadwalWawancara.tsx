import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useScheduleStore } from '../../store/scheduleStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'

export default function JadwalWawancara() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null)

  const schedules = useScheduleStore((state) => state.schedules)
  const createSchedule = useScheduleStore((state) => state.createSchedule)
  const deleteSchedule = useScheduleStore((state) => state.deleteSchedule)
  const addCandidatesToSchedule = useScheduleStore((state) => state.addCandidatesToSchedule)
  const removeCandidateFromSchedule = useScheduleStore((state) => state.removeCandidateFromSchedule)
  const loadSchedulesFromStorage = useScheduleStore((state) => state.loadFromLocalStorage)

  const candidates = useCandidateStore((state) => state.candidates)
  const loadCandidatesFromStorage = useCandidateStore((state) => state.loadFromLocalStorage)

  const interviewers = useInterviewerStore((state) => state.interviewers)
  const loadInterviewersFromStorage = useInterviewerStore((state) => state.loadFromLocalStorage)

  useEffect(() => {
    loadCandidatesFromStorage()
    loadSchedulesFromStorage()
    loadInterviewersFromStorage()
  }, [loadCandidatesFromStorage, loadSchedulesFromStorage, loadInterviewersFromStorage])

  const getCandidateName = (id: string) => {
    return candidates.find((c) => c.id === id)?.fullName || `Kandidat ${id}`
  }

  const getAvailableCandidates = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId)
    if (!schedule) return candidates

    const assignedIds = new Set(schedule.candidateIds)
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

      <div className="max-w-7xl mx-auto px-6 py-8">
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
                    <h3 className="text-lg font-semibold text-gray-900">📅 {schedule.date}</h3>
                    <p className="text-sm text-gray-600">
                      {schedule.candidateIds.length} kandidat terjadwal
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSchedule(schedule.id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Hapus
                  </button>
                </div>

                {/* Interviewers */}
                <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs font-semibold text-blue-700 mb-1">🏛️ PUSAT</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.pusat?.fullName || 'Belum ditentukan'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs font-semibold text-green-700 mb-1">🏢 CABANG</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.cabang?.fullName || 'Belum ditentukan'}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs font-semibold text-purple-700 mb-1">👨‍🏫 MENTOR</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.mentor?.fullName || 'Belum ditentukan'}
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
                      {schedule.candidateIds.length === 0 ? (
                        <p className="text-gray-500 text-sm mb-3">Belum ada kandidat</p>
                      ) : (
                        <div className="space-y-2 mb-4">
                          {schedule.candidateIds.map((candId) => (
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
                              addCandidatesToSchedule(schedule.id, [e.target.value])
                              e.target.value = ''
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Pilih kandidat...</option>
                          {getAvailableCandidates(schedule.id).map((cand) => (
                            <option key={cand.id} value={cand.id}>
                              {cand.fullName}
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
          onCreate={createSchedule}
          candidates={candidates}
          interviewers={interviewers}
        />
      )}
    </div>
  )
}

interface CreateScheduleModalProps {
  onClose: () => void
  onCreate: (
    date: string,
    pusat: any,
    cabang: any,
    mentor: any,
    candidateIds: string[]
  ) => void
  candidates: any[]
  interviewers: any[]
}

function CreateScheduleModal({ onClose, onCreate, candidates, interviewers }: CreateScheduleModalProps) {
  const [date, setDate] = useState('')
  const [pusatId, setPusatId] = useState<string>('')
  const [cabangId, setCabangId] = useState<string>('')
  const [mentorId, setMentorId] = useState<string>('')
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([])

  const pusat = mockInterviewers.find((i) => i.id === pusatId) || null
  const cabang = mockInterviewers.find((i) => i.id === cabangId) || null
  const mentor = mockInterviewers.find((i) => i.id === mentorId) || null

  const handleToggleCandidate = (candId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    )
  }

  const handleCreate = () => {
    if (!date || !pusatId || !cabangId || !mentorId || selectedCandidateIds.length === 0) {
      alert('Harap lengkapi semua field dan pilih minimal 1 kandidat')
      return
    }

    onCreate(date, pusat, cabang, mentor, selectedCandidateIds)
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
                      {i.fullName}
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
                      {i.fullName}
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
                      {i.fullName}
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
                    <span className="text-sm text-gray-900">{cand.fullName}</span>
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
