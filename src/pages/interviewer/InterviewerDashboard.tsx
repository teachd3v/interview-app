import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useScheduleStore } from '../../store/scheduleStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'
import { useFormResultsStore } from '../../store/formResultsStore'
import { useRegionStore } from '../../store/regionStore'

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

export default function InterviewerDashboard() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const role = useAuthStore((state) => state.role)
  const interviewerId = useAuthStore((state) => state.interviewerId)
  const interviewerName = useAuthStore((state) => state.interviewerName)

  const allSchedules = useScheduleStore((state) => state.schedules)
  const candidates = useCandidateStore((state) => state.candidates)
  const interviewers = useInterviewerStore((state) => state.interviewers)
  const results = useFormResultsStore((state) => state.results)
  const regions = useRegionStore((state) => state.regions)

  useEffect(() => {
    // Load data on mount
    useRegionStore.getState().loadFromSupabase()
    useCandidateStore.getState().loadFromSupabase()
    useScheduleStore.getState().loadFromSupabase()
    useInterviewerStore.getState().loadFromSupabase()
    useFormResultsStore.getState().loadFromSupabase()

    // Refresh results setiap 3 detik untuk detect perubahan terbaru
    const refreshInterval = setInterval(() => {
      useFormResultsStore.getState().loadFromSupabase()
    }, 3000)

    // Listen untuk window focus - refresh saat user kembali ke tab
    const handleFocus = () => {
      useFormResultsStore.getState().loadFromSupabase()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(refreshInterval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Redirect ke select page jika belum memilih interviewer
  useEffect(() => {
    if (!interviewerId || !role || role === 'admin') {
      navigate('/interviewer/select')
    }
  }, [interviewerId, role, navigate])

  // Filter schedules berdasarkan role dan interviewer ID, sorted by date (ascending)
  const schedules = allSchedules
    .filter((schedule) => {
      if (role === 'pusat') {
        return schedule.pusat_id === interviewerId
      } else if (role === 'cabang') {
        return schedule.cabang_id === interviewerId
      } else if (role === 'mentor') {
        return schedule.mentor_id === interviewerId
      }
      return false
    })
    .sort((a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleChangeInterviewer = () => {
    navigate('/interviewer/select')
  }

  const getCandidateName = (id: string) => {
    return candidates.find((c) => c.id === id)?.full_name || `Kandidat ${id}`
  }

  const getInterviewerName = (id: string | undefined) => {
    if (!id) return 'Belum ditentukan'
    return interviewers.find((i) => i.id === id)?.full_name || `Interviewer ${id}`
  }

  const getRegionName = (regionId: string | undefined) => {
    if (!regionId) return 'Region tidak diketahui'
    return regions.find((r) => r.id === regionId)?.name || `Region ${regionId}`
  }

  const hasBeenInterviewed = (candidateId: string) => {
    return results.some((r) => r.candidateId === candidateId && r.interviewerId === interviewerId)
  }

  const getInterviewResult = (candidateId: string) => {
    return results.find((r) => r.candidateId === candidateId && r.interviewerId === interviewerId)
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
            <h1 className="text-2xl font-bold text-gray-900">📋 Jadwal Wawancara</h1>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Pewawancara:</span> {interviewerName} <span className="text-gray-400">({role})</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleChangeInterviewer}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              Ubah Pewawancara
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">📅 {formatDateIndonesian(schedule.interview_date)}</h3>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                        📍 {getRegionName(schedule.region_id)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      🏛️ {getInterviewerName(schedule.pusat_id)} • 🏢 {getInterviewerName(schedule.cabang_id)} • 👨‍🏫 {getInterviewerName(schedule.mentor_id)}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(schedule.status)}`}>
                    {getStatusText(schedule.status)}
                  </span>
                </div>

                {/* Candidates List */}
                <div className="mb-4 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Kandidat ({(schedule.candidate_ids || []).length}):
                  </p>
                  <div className="space-y-2">
                    {(schedule.candidate_ids || []).length === 0 ? (
                      <p className="text-sm text-gray-500">Belum ada kandidat dijadwalkan</p>
                    ) : (
                      (schedule.candidate_ids || []).map((candId) => (
                        <div
                          key={candId}
                          className="flex justify-between items-center bg-white p-3 rounded border border-gray-200"
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {getCandidateName(candId)} ({candId})
                            </span>
                            {hasBeenInterviewed(candId) && getInterviewResult(candId) && (
                              <div className="mt-1 flex gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                  getInterviewResult(candId)?.partAPass
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {getInterviewResult(candId)?.partAPass ? '✓ Lulus' : '✗ Tidak Lulus'}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
                                  {getInterviewResult(candId)?.partBTotal}/40
                                </span>
                              </div>
                            )}
                          </div>
                          {hasBeenInterviewed(candId) ? (
                            <Link
                              to={`/interviewer/hasil-detail/${getInterviewResult(candId)?.id}`}
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
                            >
                              Lihat Hasil
                            </Link>
                          ) : (
                            <Link
                              to={`/interviewer/form/${candId}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
                            >
                              Mulai Wawancara
                            </Link>
                          )}
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
