import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import BulkImportModal from '../../components/BulkImportModal'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [showBulkImport, setShowBulkImport] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              ⬆️ Bulk Import
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Data Kandidat Card */}
          <Link
            to="/admin/kandidat"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">👥</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Kandidat</h2>
            <p className="text-sm text-gray-600">Kelola data kandidat</p>
          </Link>

          {/* Data Interviewer Card */}
          <Link
            to="/admin/interviewer"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">👨‍💼</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Interviewer</h2>
            <p className="text-sm text-gray-600">Kelola data pewawancara</p>
          </Link>

          {/* Data Instrumen Card */}
          <Link
            to="/admin/instrumen"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">📋</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Instrumen</h2>
            <p className="text-sm text-gray-600">Kelola pertanyaan wawancara</p>
          </Link>

          {/* Jadwal Wawancara Card */}
          <Link
            to="/admin/jadwal"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">📅</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Jadwal Wawancara</h2>
            <p className="text-sm text-gray-600">Atur jadwal wawancara</p>
          </Link>

          {/* Hasil Akhir Card */}
          <Link
            to="/admin/hasil"
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-2">📊</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Hasil Akhir</h2>
            <p className="text-sm text-gray-600">Rekap hasil wawancara</p>
          </Link>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal onClose={() => setShowBulkImport(false)} />
      )}
    </div>
  )
}
