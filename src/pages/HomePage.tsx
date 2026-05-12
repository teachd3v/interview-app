import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
  const navigate = useNavigate()
  const setRole = useAuthStore((state) => state.setRole)

  const handleSelectRole = (selectedRole: 'admin' | 'pusat' | 'cabang' | 'mentor') => {
    setRole(selectedRole)

    // Redirect ke dashboard sesuai role
    if (selectedRole === 'admin') {
      navigate('/admin')
    } else {
      // Redirect ke interviewer selection page
      navigate('/interviewer/select')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Interview App</h1>
          <p className="text-blue-100">Platform Penilaian Wawancara</p>
        </div>

        <p className="text-center text-blue-100 mb-8 text-lg">
          Pilih peran Anda untuk melanjutkan
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Card */}
          <button
            onClick={() => handleSelectRole('admin')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all text-center"
          >
            <div className="text-5xl mb-4">👨‍💼</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin</h2>
            <p className="text-gray-600 text-sm">
              Kelola instrumen, pewawancara, dan jadwal wawancara
            </p>
          </button>

          {/* Pusat Card */}
          <button
            onClick={() => handleSelectRole('pusat')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all text-center"
          >
            <div className="text-5xl mb-4">🏛️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pusat</h2>
            <p className="text-gray-600 text-sm">
              Lakukan penilaian wawancara untuk kandidat
            </p>
          </button>

          {/* Cabang Card */}
          <button
            onClick={() => handleSelectRole('cabang')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all text-center"
          >
            <div className="text-5xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cabang</h2>
            <p className="text-gray-600 text-sm">
              Lakukan penilaian wawancara untuk kandidat
            </p>
          </button>

          {/* Mentor Card */}
          <button
            onClick={() => handleSelectRole('mentor')}
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all text-center"
          >
            <div className="text-5xl mb-4">👨‍🏫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mentor</h2>
            <p className="text-gray-600 text-sm">
              Lakukan penilaian wawancara untuk kandidat
            </p>
          </button>
        </div>

        <p className="text-center text-blue-100 text-sm mt-12">
          Interview App v1.0 | Platform Penilaian Wawancara
        </p>
      </div>
    </div>
  )
}
