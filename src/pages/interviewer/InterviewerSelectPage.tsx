import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useInterviewerStore } from '../../store/interviewerStore'

const roleEmojis: { [key: string]: string } = {
  pusat: '🏛️',
  mitra: '🤝',
  fasil: '📋',
}

const roleLabels: { [key: string]: string } = {
  pusat: 'Pusat',
  mitra: 'Mitra',
  fasil: 'Fasil',
}

export default function InterviewerSelectPage() {
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const setInterviewer = useAuthStore((state) => state.setInterviewer)

  const interviewers = useInterviewerStore((state) => state.interviewers)

  useEffect(() => {
    useInterviewerStore.getState().loadFromSupabase()
  }, [])

  useEffect(() => {
    // Redirect ke home jika role belum dipilih
    if (!role || role === 'admin') {
      navigate('/')
    }
  }, [role, navigate])

  const filteredInterviewers = interviewers.filter((interviewer) => interviewer.role === role)

  const handleSelectInterviewer = (id: string, name: string) => {
    setInterviewer(id, name)
    navigate('/interviewer')
  }

  const handleBack = () => {
    navigate('/')
  }

  if (!role || role === 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            ← Kembali
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Pilih Pewawancara</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {roleEmojis[role]} Daftar Pewawancara {roleLabels[role]}
          </h2>
          <p className="text-gray-600">Pilih nama Anda untuk melanjutkan ke jadwal wawancara</p>
        </div>

        {filteredInterviewers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">
              Belum ada pewawancara dengan role {roleLabels[role]}.
            </p>
            <button
              onClick={handleBack}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInterviewers.map((interviewer) => (
              <button
                key={interviewer.id}
                onClick={() => handleSelectInterviewer(interviewer.id, interviewer.full_name)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-400 transition-all text-left"
              >
                <div className="text-4xl mb-4">{roleEmojis[interviewer.role]}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{interviewer.full_name}</h3>
                <p className="text-sm text-gray-500 mb-1">
                  ID: {interviewer.id}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    Pilih
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
