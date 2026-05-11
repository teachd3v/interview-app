import { Link, useState } from 'react-router-dom'
import { mockSchedules, mockCandidates, mockInterviewers } from '../../mocks/data'

export default function JadwalWawancara() {
  const [schedules, setSchedules] = useState(mockSchedules)
  const [editingId, setEditingId] = useState<string | null>(null)

  const getCandidateName = (id: string) => {
    return mockCandidates.find((c) => c.id === id)?.fullName || 'Unknown'
  }

  const handleAssignInterviewer = (scheduleId: string, role: 'pusat' | 'cabang' | 'mentor', interviewerId: string) => {
    setSchedules(
      schedules.map((sch) =>
        sch.id === scheduleId
          ? {
              ...sch,
              [role]: mockInterviewers.find((i) => i.id === interviewerId) || null,
            }
          : sch
      )
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Wawancara</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getCandidateName(schedule.candidateId)}
                  </h3>
                  <p className="text-sm text-gray-600">Tanggal: {schedule.date}</p>
                </div>
                <button
                  onClick={() => setEditingId(editingId === schedule.id ? null : schedule.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {editingId === schedule.id ? 'Selesai' : 'Edit'}
                </button>
              </div>

              {editingId === schedule.id && (
                <div className="space-y-4">
                  {/* Pusat */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interviewer Pusat
                    </label>
                    <select
                      value={schedule.pusat?.id || ''}
                      onChange={(e) => handleAssignInterviewer(schedule.id, 'pusat', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Pilih Interviewer</option>
                      {mockInterviewers
                        .filter((i) => i.role === 'pusat')
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.fullName}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Cabang */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interviewer Cabang
                    </label>
                    <select
                      value={schedule.cabang?.id || ''}
                      onChange={(e) => handleAssignInterviewer(schedule.id, 'cabang', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Pilih Interviewer</option>
                      {mockInterviewers
                        .filter((i) => i.role === 'cabang')
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.fullName}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Mentor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interviewer Mentor
                    </label>
                    <select
                      value={schedule.mentor?.id || ''}
                      onChange={(e) => handleAssignInterviewer(schedule.id, 'mentor', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Pilih Interviewer</option>
                      {mockInterviewers
                        .filter((i) => i.role === 'mentor')
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.fullName}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {!editingId && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs font-semibold text-gray-500 mb-1">PUSAT</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.pusat?.fullName || 'Belum ditentukan'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs font-semibold text-gray-500 mb-1">CABANG</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.cabang?.fullName || 'Belum ditentukan'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-xs font-semibold text-gray-500 mb-1">MENTOR</p>
                    <p className="text-sm font-medium text-gray-900">
                      {schedule.mentor?.fullName || 'Belum ditentukan'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
