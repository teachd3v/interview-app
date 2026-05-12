import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { useFormResultsStore } from '../../store/formResultsStore'
import { useCandidateStore } from '../../store/candidateStore'

export default function HasilAkhir() {
  const navigate = useNavigate()
  const results = useFormResultsStore((state) => state.results)
  const candidates = useCandidateStore((state) => state.candidates)
  const loadResults = useFormResultsStore((state) => state.loadFromSupabase)
  const loadCandidates = useCandidateStore((state) => state.loadFromSupabase)

  const [filterRegion, setFilterRegion] = useState<string>('all')

  useEffect(() => {
    loadResults()
    loadCandidates()
  }, [])

  // Get unique regions dari candidates
  const regions = ['all', ...new Set(candidates.map((c) => c.region))]

  // Filter results berdasarkan region
  const filteredResults = filterRegion === 'all'
    ? results
    : results.filter((r) => {
        const candidate = candidates.find((c) => c.id === r.candidateId)
        return candidate?.region === filterRegion
      })

  // Calculate stats
  const totalAssessed = filteredResults.length
  const totalPassed = filteredResults.filter((r) => r.partAPass).length
  const avgScore = filteredResults.length > 0
    ? (filteredResults.reduce((sum, r) => sum + r.partBTotal, 0) / filteredResults.length).toFixed(2)
    : 0
  const passRate = totalAssessed > 0 ? ((totalPassed / totalAssessed) * 100).toFixed(1) : 0

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getCandidateName = (id: string) => {
    return candidates.find((c) => c.id === id)?.full_name || `Kandidat ${id}`
  }

  const getCandidateRegion = (id: string) => {
    return candidates.find((c) => c.id === id)?.region || '-'
  }

  // Export semua hasil ke Excel
  const handleExportAllResults = () => {
    if (filteredResults.length === 0) return

    const dataToExport = [
      ['HASIL AKHIR WAWANCARA'],
      [`Filter: ${filterRegion === 'all' ? 'Semua Wilayah' : filterRegion}`],
      [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
      [],
      ['Nama Kandidat', 'Wilayah', 'Part A', 'Part B (Skor)', 'Persentase', 'Tanggal'],
      ...filteredResults.map((result) => [
        getCandidateName(result.candidateId),
        getCandidateRegion(result.candidateId),
        result.partAPass ? 'Lulus' : 'Tidak Lulus',
        `${result.partBTotal}/40`,
        `${result.partBPercentage.toFixed(1)}%`,
        formatDate(result.submittedAt),
      ]),
      [],
      ['RINGKASAN STATISTIK'],
      ['Total Dinilai:', filteredResults.length],
      ['Lulus Part A:', filteredResults.filter((r) => r.partAPass).length],
      ['Tidak Lulus Part A:', filteredResults.filter((r) => !r.partAPass).length],
      ['Pass Rate:', `${passRate}%`],
      ['Rata-rata Skor B:', avgScore],
    ]

    const ws = XLSX.utils.aoa_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Wawancara')

    // Auto-size columns
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }]

    const fileName = `Hasil_Wawancara_${filterRegion === 'all' ? 'Semua' : filterRegion}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Hasil Akhir Wawancara</h1>
            <p className="text-sm text-gray-600 mt-1">Rekap hasil assessment semua kandidat</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportAllResults}
              disabled={filteredResults.length === 0}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                filteredResults.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              📥 Export Excel
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Total Dinilai</p>
            <p className="text-3xl font-bold text-blue-600">{totalAssessed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Lulus Part A</p>
            <p className="text-3xl font-bold text-green-600">{totalPassed}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Pass Rate</p>
            <p className="text-3xl font-bold text-indigo-600">{passRate}%</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Rata-rata Skor B</p>
            <p className="text-3xl font-bold text-purple-600">{avgScore}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <label className="text-sm font-medium text-gray-700 block mb-2">Filter Wilayah:</label>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {regions.map((region) => (
              <option key={region} value={region}>
                {region === 'all' ? 'Semua Wilayah' : region}
              </option>
            ))}
          </select>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredResults.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              <p className="text-lg">Belum ada hasil wawancara</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Nama Kandidat
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Wilayah
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Part A
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Part B (Skor)
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Persentase
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {getCandidateName(result.candidateId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getCandidateRegion(result.candidateId)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full font-semibold ${
                            result.partAPass
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {result.partAPass ? '✓ Lulus' : '✗ Tidak'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                        {result.partBTotal}/40
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {result.partBPercentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(result.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary by Region */}
        {filterRegion === 'all' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ringkasan Per Wilayah</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regions
                .filter((r) => r !== 'all')
                .map((region) => {
                  const regionResults = results.filter((r) => {
                    const candidate = candidates.find((c) => c.id === r.candidateId)
                    return candidate?.region === region
                  })
                  const regionPassed = regionResults.filter((r) => r.partAPass).length
                  const regionAvg = regionResults.length > 0
                    ? (regionResults.reduce((sum, r) => sum + r.partBTotal, 0) / regionResults.length).toFixed(2)
                    : 0

                  return (
                    <div key={region} className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">{region}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dinilai:</span>
                          <span className="font-semibold">{regionResults.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lulus Part A:</span>
                          <span className="font-semibold text-green-600">{regionPassed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rata-rata B:</span>
                          <span className="font-semibold text-blue-600">{regionAvg}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
