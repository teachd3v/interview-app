import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCandidateStore } from '../../store/candidateStore'
import { parseExcelFile, downloadCandidateTemplate } from '../../utils/excelParser'

export default function DataKandidat() {
  const [filterRegion, setFilterRegion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const candidates = useCandidateStore((state) => state.candidates)
  const deleteCandidate = useCandidateStore((state) => state.deleteCandidate)
  const updateCandidate = useCandidateStore((state) => state.updateCandidate)
  const addCandidate = useCandidateStore((state) => state.addCandidate)
  const bulkAddCandidates = useCandidateStore((state) => state.bulkAddCandidates)

  useEffect(() => {
    useCandidateStore.getState().loadFromSupabase()
  }, [])

  const filteredCandidates = (filterRegion
    ? candidates.filter((c) => c.region === filterRegion)
    : candidates
  ).sort((a, b) => a.id.localeCompare(b.id))

  const regions = [...new Set(candidates.map((c) => c.region))]

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const { candidates: parsedCandidates, errors } = await parseExcelFile(file)

      if (errors.length > 0) {
        const errorMsg = errors.length > 0 ? `${errors.length} validation error(s): ${errors[0]}` : ''
        setToast({ message: `Import failed. ${errorMsg}`, type: 'error' })
        setIsLoading(false)
        return
      }

      if (parsedCandidates.length === 0) {
        setToast({ message: 'No valid candidates found in file', type: 'error' })
        setIsLoading(false)
        return
      }

      // Filter out duplicates (avoid duplicate IDs)
      const existingIds = new Set(candidates.map((c) => c.id))
      const newCandidates = parsedCandidates.filter((c) => !existingIds.has(c.id))

      if (newCandidates.length > 0) {
        await bulkAddCandidates(newCandidates)
        setToast({ message: `Successfully imported ${newCandidates.length} candidate(s)`, type: 'success' })
      } else {
        setToast({ message: 'No new candidates to import (all duplicates)', type: 'error' })
      }
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
          <h1 className="text-2xl font-bold text-gray-900">Data Kandidat</h1>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Data Kandidat</h2>

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
                Kolom: ID, Nama, JenisKelamin, Wilayah, Kampus, Prodi
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-6">
              <button
                onClick={downloadCandidateTemplate}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                📥 Download Template
              </button>
            </div>
          </div>

          {isLoading && <p className="text-blue-600 mt-2 text-sm">Processing file...</p>}
        </div>

        {/* Filter & Summary */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Wilayah</label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Wilayah</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <p className="text-sm font-medium text-gray-700">
            Showing {filteredCandidates.length} / {candidates.length} kandidat
          </p>
        </div>

        {/* Table */}
        {candidates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">Belum ada data kandidat. Upload file Excel terlebih dahulu.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Jenis Kelamin
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Wilayah
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Kampus</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Prodi</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{candidate.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {candidate.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.gender}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.region}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.school}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.major}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setEditingId(candidate.id)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCandidate(candidate.id)}
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

      {/* Edit Modal */}
      {editingId && (
        <EditCandidateModal
          candidate={candidates.find((c) => c.id === editingId)!}
          onClose={() => setEditingId(null)}
          onUpdate={updateCandidate}
        />
      )}

      {/* Add Modal */}
      {showAddForm && (
        <AddCandidateModal
          onClose={() => setShowAddForm(false)}
          onAdd={addCandidate}
        />
      )}
    </div>
  )
}

interface EditCandidateModalProps {
  candidate: any
  onClose: () => void
  onUpdate: (id: string, updates: any) => Promise<void>
}

function EditCandidateModal({ candidate, onClose, onUpdate }: EditCandidateModalProps) {
  const [full_name, setFull_name] = useState(candidate.full_name)
  const [school, setSchool] = useState(candidate.school)
  const [region, setRegion] = useState(candidate.region)
  const [gender, setGender] = useState(candidate.gender || '')
  const [major, setMajor] = useState(candidate.major || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!full_name || !school || !region || !gender || !major) {
      alert('Harap isi nama, kampus, wilayah, jenis kelamin, dan prodi')
      return
    }

    setIsLoading(true)
    try {
      await onUpdate(candidate.id, {
        full_name,
        school,
        region,
        gender,
        major,
      })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Kandidat</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input
              type="text"
              value={full_name}
              onChange={(e) => setFull_name(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kampus</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prodi</label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface AddCandidateModalProps {
  onClose: () => void
  onAdd: (candidate: any) => Promise<void>
}

function AddCandidateModal({ onClose, onAdd }: AddCandidateModalProps) {
  const [id, setId] = useState('')
  const [full_name, setFull_name] = useState('')
  const [school, setSchool] = useState('')
  const [region, setRegion] = useState('')
  const [gender, setGender] = useState('')
  const [major, setMajor] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!id || !full_name || !school || !region || !gender || !major) {
      alert('Harap isi ID, nama, kampus, wilayah, jenis kelamin, dan prodi')
      return
    }

    setIsLoading(true)
    try {
      await onAdd({
        id,
        full_name,
        school,
        region,
        gender,
        major,
      })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tambah Kandidat Baru</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Kandidat</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Contoh: 001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
            <input
              type="text"
              value={full_name}
              onChange={(e) => setFull_name(e.target.value)}
              placeholder="Nama lengkap"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kampus</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Nama kampus"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Wilayah"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Jenis Kelamin</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prodi</label>
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Program Studi"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Menambah...' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  )
}
