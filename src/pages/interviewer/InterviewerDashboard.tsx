import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useScheduleStore } from '../../store/scheduleStore'
import { useCandidateStore } from '../../store/candidateStore'

export default function InterviewerDashboard() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const role = useAuthStore((state) => state.role)

  const schedules = useScheduleStore((state) => state.schedules)
  const loadSchedules = useScheduleStore((state) => state.loadFromLocalStorage)

  const candidates = useCandidateStore((state) => state.candidates)
  const loadCandidates = useCandidateStore((state) => state.loadFromLocalStorage)

  useEffect(() => {
    loadSchedules()
    loadCandidates()
  }, [loadSchedules, loadCandidates])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getCandidateName = (id: string) => {
    return candidates.find((c) => c.id === id)?.fullName || `Kandidat ${id}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'belum':
        return 'bg-gray-100 text-gray-800'
      case 'berjalan':
        return 'bg-yellow-100 text-yellow-800'
      case 'selesai':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'belum':
        return 'Belum Dimulai'
      case 'berjalan':
        return 'Sedang Berjalan'
      case 'selesai':
        return 'Selesai'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wawancara</h1>
            <p className="text-sm text-gray-600 capitalize">Role: {role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Daftar Jadwal Wawancara</h2>

        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">Belum ada jadwal wawancara yang dijadwalkan.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">📅 {schedule.date}</h3>
                    <p className="text-sm text-gray-600">
                      {schedule.pusat?.fullName} • {schedule.cabang?.fullName} • {schedule.mentor?.fullName}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(schedule.status)}`}>
                    {getStatusText(schedule.status)}
                  </span>
                </div>

                {/* Candidates List */}
                <div className="mb-4 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Kandidat ({schedule.candidateIds.length}):
                  </p>
                  <div className="space-y-2">
                    {schedule.candidateIds.length === 0 ? (
                      <p className="text-sm text-gray-500">Belum ada kandidat dijadwalkan</p>
                    ) : (
                      schedule.candidateIds.map((candId) => (
                        <div
                          key={candId}
                          className="flex justify-between items-center bg-white p-3 rounded border border-gray-200"
                        >
                          <span className="text-sm font-medium text-gray-900">
                            {getCandidateName(candId)} ({candId})
                          </span>
                          <Link
                            to={`/interviewer/form/${candId}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
                          >
                            Mulai Wawancara
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
