import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setRole = useAuthStore((state) => state.setRole)

  const handleLogin = (role: 'admin' | 'pusat' | 'cabang' | 'mentor') => {
    setRole(role)
    if (role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/interviewer')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Interview App</h1>
          <p className="text-gray-600">Sistem Wawancara LPDP</p>
        </div>

        <p className="text-center text-gray-700 mb-8 font-semibold">
          Pilih role untuk login:
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleLogin('admin')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            👤 Masuk sebagai Admin
          </button>

          <button
            onClick={() => handleLogin('pusat')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            🏛️ Masuk sebagai Pusat
          </button>

          <button
            onClick={() => handleLogin('cabang')}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            🏢 Masuk sebagai Cabang
          </button>

          <button
            onClick={() => handleLogin('mentor')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            👨‍🏫 Masuk sebagai Mentor
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-gray-700">
          <p>
            <strong>Demo Mode:</strong> Gunakan tombol di atas untuk mensimulasikan login sebagai berbagai role tanpa autentikasi.
          </p>
        </div>
      </div>
    </div>
  )
}
