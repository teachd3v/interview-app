import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

const ADMIN_PASSWORD = 'yes123'

export default function HomePage() {
  const navigate = useNavigate()
  const setRole = useAuthStore((state) => state.setRole)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const handleSelectRole = (selectedRole: 'admin' | 'pusat' | 'cabang' | 'mentor') => {
    // Jika admin, tampilkan password modal dulu
    if (selectedRole === 'admin') {
      setShowPasswordModal(true)
      setAdminPassword('')
      setPasswordError(null)
      return
    }

    setRole(selectedRole)
    // Redirect ke interviewer selection page
    navigate('/interviewer/select')
  }

  const handleAdminPasswordSubmit = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      // Password benar, set role admin dan navigate
      setShowPasswordModal(false)
      setRole('admin')
      navigate('/admin')
    } else {
      // Password salah
      setPasswordError('Password salah! Silakan coba lagi.')
      setAdminPassword('')
    }
  }

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false)
    setAdminPassword('')
    setPasswordError(null)
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

      {/* Password Modal untuk Admin */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🔐 Admin Access</h2>
            <p className="text-gray-600 text-sm mb-6">Masukkan password untuk mengakses admin panel</p>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {passwordError}
              </div>
            )}

            <div className="mb-6">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminPasswordSubmit()
                  }
                }}
                placeholder="Masukkan password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClosePasswordModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleAdminPasswordSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
