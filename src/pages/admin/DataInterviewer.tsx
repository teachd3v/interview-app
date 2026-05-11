import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useInterviewerStore, Interviewer } from '../../store/interviewerStore'
import { parseInterviewerExcelFile } from '../../utils/excelParser'

export default function DataInterviewer() {
  const [filterRole, setFilterRole] = useState<'pusat' | 'cabang' | 'mentor' | ''>('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const interviewers = useInterviewerStore((state) => state.interviewers)
  const setInterviewers = useInterviewerStore((state) => state.setInterviewers)
  const addInterviewer = useInterviewerStore((state) => state.addInterviewer)
  const updateInterviewer = useInterviewerStore((state) => state.updateInterviewer)
  const deleteInterviewer = useInterviewerStore((state) => state.deleteInterviewer)
  const loadFromLocalStorage = useInterviewerStore((state) => state.loadFromLocalStorage)

  useEffect(() => {
    loadFromLocalStorage()
  }, [loadFromLocalStorage])

  const filteredInterviewers = filterRole
    ? interviewers.filter((i) => i.role === filterRole)
    : interviewers

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const { interviewers: parsedInterviewers, errors } = await parseInterviewerExcelFile(file)

      if (errors.length > 0) {
        const errorMsg = errors.length > 0 ? `${errors.length} validation error(s): ${errors[0]}` : ''
        setToast({ message: `Import failed. ${errorMsg}`, type: 'error' })
        setIsLoading(false)
        return
      }

      if (parsedInterviewers.length === 0) {
        setToast({ message: 'No valid interviewers found in file', type: 'error' })
        setIsLoading(false)
        return
      }

      const existingIds = new Set(interviewers.map((i) => i.id))
      const newInterviewers = parsedInterviewers.filter((i) => !existingIds.has(i.id))
      const merged = [...interviewers, ...newInterviewers]

      setInterviewers(merged)
      setToast({ message: `Successfully imported ${newInterviewers.length} interviewer(s)`, type: 'success' })
    } catch (error) {
      setToast({ message: `Import error: ${(error as Error).message}`, type: 'error' })
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Data Interviewer</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            + Tambah Manual
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 p-4 rounded-lg text-white z-50 ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Data Interviewer</h2>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File Excel (.xlsx)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Kolom: ID, Nama, Role (pusat/cabang/mentor), Region, Email
              </p>
            </div>
          </div>

          {isLoading && <p className="text-blue-600 mt-2 text-sm">Processing file...</p>}
        </div>

        {/* Filter & Summary */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as 'pusat' | 'cabang' | 'mentor' | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Role</option>
              <option value="pusat">Pusat</option>
              <option value="cabang">Cabang</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>

          <p className="text-sm font-medium text-gray-700">
            Showing {filteredInterviewers.length} / {interviewers.length} interviewer(s)
          </p>
        </div>

        {/* Table */}
        {interviewers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">Belum ada data interviewer. Upload file Excel atau tambah manual.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Tambah Interviewer Pertama
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Region</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterviewers.map((interviewer) => (
                  <tr key={interviewer.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{interviewer.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {interviewer.fullName}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          interviewer.role === 'pusat'
                            ? 'bg-blue-100 text-blue-800'
                            : interviewer.role === 'cabang'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {interviewer.role.charAt(0).toUpperCase() + interviewer.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{interviewer.region}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{interviewer.email}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setEditingId(interviewer.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteInterviewer(interviewer.id)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingId) && (
        <InterviewerFormModal
          interviewer={editingId ? interviewers.find((i) => i.id === editingId) : undefined}
          onClose={() => {
            setShowAddForm(false)
            setEditingId(null)
          }}
          onSave={(interviewer) => {
            if (editingId) {
              updateInterviewer(editingId, interviewer)
              setToast({ message: 'Interviewer updated successfully', type: 'success' })
              setEditingId(null)
            } else {
              addInterviewer(interviewer)
              setToast({ message: 'Interviewer added successfully', type: 'success' })
              setShowAddForm(false)
            }
          }}
        />
      )}
    </div>
  )
}

interface InterviewerFormModalProps {
  interviewer?: Interviewer
  onClose: () => void
  onSave: (interviewer: Interviewer) => void
}

function InterviewerFormModal({ interviewer, onClose, onSave }: InterviewerFormModalProps) {
  const [id, setId] = useState(interviewer?.id || '')
  const [fullName, setFullName] = useState(interviewer?.fullName || '')
  const [role, setRole] = useState<'pusat' | 'cabang' | 'mentor'>(interviewer?.role || 'pusat')
  const [region, setRegion] = useState(interviewer?.region || '')
  const [email, setEmail] = useState(interviewer?.email || '')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    setError('')

    if (!id || !fullName || !role || !region || !email) {
      setError('Harap lengkapi semua field')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid')
      return
    }

    onSave({
      id,
      fullName,
      role,
      region,
      email,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {interviewer ? 'Edit Interviewer' : 'Tambah Interviewer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={!!interviewer}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="int-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nama lengkap..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'pusat' | 'cabang' | 'mentor')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="pusat">Pusat</option>
              <option value="cabang">Cabang</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region/Wilayah</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="DKI Jakarta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
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
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
