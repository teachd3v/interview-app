import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCandidateStore } from '../../store/candidateStore'
import { parseExcelFile, downloadCandidateTemplate } from '../../utils/excelParser'

export default function DataKandidat() {
  const [filterRegion, setFilterRegion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const candidates = useCandidateStore((state) => state.candidates)
  const setCandidates = useCandidateStore((state) => state.setCandidates)
  const deleteCandidate = useCandidateStore((state) => state.deleteCandidate)
  const loadFromLocalStorage = useCandidateStore((state) => state.loadFromLocalStorage)

  useEffect(() => {
    loadFromLocalStorage()
  }, [loadFromLocalStorage])

  const filteredCandidates = filterRegion
    ? candidates.filter((c) => c.region === filterRegion)
    : candidates

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

      // Merge with existing candidates (avoid duplicates by ID)
      const existingIds = new Set(candidates.map((c) => c.id))
      const newCandidates = parsedCandidates.filter((c) => !existingIds.has(c.id))
      const merged = [...candidates, ...newCandidates]

      setCandidates(merged)
      setToast({ message: `Successfully imported ${newCandidates.length} candidate(s)`, type: 'success' })
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
          <div></div>
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
                Kolom: ID, Nama, Sekolah, Wilayah, Email, TglLahir
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
                    Asal Sekolah
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Wilayah
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{candidate.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {candidate.fullName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.school}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.region}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{candidate.email}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => deleteCandidate(candidate.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
