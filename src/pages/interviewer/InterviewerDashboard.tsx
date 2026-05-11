import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { mockSchedules, mockCandidates } from '../../mocks/data'

export default function InterviewerDashboard() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const role = useAuthStore((state) => state.role)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getCandidateName = (id: string) => {
    return mockCandidates.find((c) => c.id === id)?.fullName || 'Unknown'
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Daftar Kandidat Hari Ini</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getCandidateName(schedule.candidateId)}
                  </h3>
                  <p className="text-sm text-gray-600">ID: {schedule.candidateId}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(schedule.status)}`}>
                  {getStatusText(schedule.status)}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-600">
                  <strong>Tanggal:</strong> {schedule.date}
                </p>
              </div>

              <Link
                to={`/interviewer/form/${schedule.candidateId}`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
              >
                Mulai Wawancara
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
