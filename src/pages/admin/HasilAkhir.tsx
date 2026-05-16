import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { useFormResultsStore } from '../../store/formResultsStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'

export default function HasilAkhir() {
  const navigate = useNavigate()
  const results = useFormResultsStore((state) => state.results)
  const candidates = useCandidateStore((state) => state.candidates)
  const interviewers = useInterviewerStore((state) => state.interviewers)
  const loadResults = useFormResultsStore((state) => state.loadFromSupabase)
  const loadCandidates = useCandidateStore((state) => state.loadFromSupabase)
  const loadInterviewers = useInterviewerStore((state) => state.loadFromSupabase)

  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterInterviewer, setFilterInterviewer] = useState<string>('all')
  const [filterCandidate, setFilterCandidate] = useState<string>('all')
  const [isRegionSummaryOpen, setIsRegionSummaryOpen] = useState(false)

  useEffect(() => {
    loadResults()
    loadCandidates()
    loadInterviewers()
  }, [])

  // Reset sub-filters when region changes
  useEffect(() => {
    setFilterInterviewer('all')
    setFilterCandidate('all')
  }, [filterRegion])

  // Get unique regions dari candidates
  const regions = ['all', ...new Set(candidates.map((c) => c.region))]

  // Available Candidates for filter (Filtered by selected Region)
  const availableCandidatesForFilter = candidates.filter(c => 
    filterRegion === 'all' || c.region === filterRegion
  ).filter(c => results.some(r => r.candidateId === c.id)) // Only show candidates who have results

  // Available Interviewers for filter (Filtered by selected Region)
  const interviewerIdsWithResults = new Set(results.filter(r => {
    if (filterRegion === 'all') return true
    const cand = candidates.find(c => c.id === r.candidateId)
    return cand?.region === filterRegion
  }).map(r => r.interviewerId))

  const availableInterviewersForFilter = interviewers.filter(i => interviewerIdsWithResults.has(i.id))

  // Filter results berdasarkan region, interviewer, dan kandidat
  const filteredResults = results.filter((r) => {
    const candidate = candidates.find((c) => c.id === r.candidateId)
    const matchRegion = filterRegion === 'all' || candidate?.region === filterRegion
    const matchInterviewer = filterInterviewer === 'all' || r.interviewerId === filterInterviewer
    const matchCandidate = filterCandidate === 'all' || r.candidateId === filterCandidate
    return matchRegion && matchInterviewer && matchCandidate
  })

  // Calculate stats
  const totalCandidatesCount = candidates.length
  const assessedCount = results.length
  
  // A. Total Kandidat (Calculation comparison)
  const totalKandidatDisplay = `${assessedCount}/${totalCandidatesCount}`
  
  // B. Kandidat Lulus Syarat
  const lulusSyaratCount = results.filter((r) => r.partAPass).length
  
  // C. Skor Rata-rata (Hanya yang lulus Part A)
  const passedResults = results.filter((r) => r.partAPass)
  const avgScore = passedResults.length > 0
    ? (passedResults.reduce((sum, r) => sum + r.partBPercentage, 0) / passedResults.length).toFixed(1)
    : '0'

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace('.', ':') // Mengganti titik pemisah jam ke titik dua khas Indonesia
  }

  const getCandidateName = (id: string) => {
    return candidates.find((c) => c.id === id)?.full_name || `Kandidat ${id}`
  }

  const getCandidateRegion = (id: string) => {
    return candidates.find((c) => c.id === id)?.region || '-'
  }

  const getInterviewerDisplay = (interviewerId: string) => {
    const interviewer = interviewers.find((i) => i.id === interviewerId)
    if (!interviewer) return '-'
    const roleCapitalized = interviewer.role.charAt(0).toUpperCase() + interviewer.role.slice(1)
    return `[${roleCapitalized}] ${interviewer.full_name}`
  }

  // Export semua hasil ke Excel
  const handleExportAllResults = () => {
    if (filteredResults.length === 0) return

    const dataToExport = [
      ['HASIL AKHIR WAWANCARA'],
      [`Filter: ${filterRegion === 'all' ? 'Semua Wilayah' : filterRegion}`],
      [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
      [],
      ['Interviewer', 'Nama Kandidat', 'Wilayah', 'Lulus Syarat', 'Skor Kompetensi', 'Tanggal'],
      ...filteredResults.map((result) => [
        getInterviewerDisplay(result.interviewerId),
        getCandidateName(result.candidateId),
        getCandidateRegion(result.candidateId),
        result.partAPass ? 'Lulus' : 'Tidak Lulus',
        result.partBPercentage.toFixed(1),
        formatDate(result.submittedAt),
      ]),
    ]

    const ws = XLSX.utils.aoa_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Wawancara')

    ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }]

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
        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Total Kandidat</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-600">{totalKandidatDisplay}</p>
              <p className="text-sm text-gray-400">selesai diinterview</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Kandidat Lulus Syarat</p>
            <p className="text-3xl font-bold text-green-600">{lulusSyaratCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Skor Rata-rata Kandidat</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-purple-600">{avgScore}</p>
              <p className="text-sm text-gray-400">(Hanya yang Lulus Syarat)</p>
            </div>
          </div>
        </div>

        {/* Filter and Collapsible Summary */}
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">Wilayah:</label>
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                >
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region === 'all' ? 'Semua Wilayah' : region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                <label className="text-sm font-semibold text-gray-700">Interviewer:</label>
                <select
                  value={filterInterviewer}
                  onChange={(e) => setFilterInterviewer(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm max-w-[200px]"
                >
                  <option value="all">Semua Interviewer</option>
                  {availableInterviewersForFilter.map((i) => (
                    <option key={i.id} value={i.id}>
                      {`[${i.role.charAt(0).toUpperCase() + i.role.slice(1)}] ${i.full_name}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                <label className="text-sm font-semibold text-gray-700">Kandidat:</label>
                <select
                  value={filterCandidate}
                  onChange={(e) => setFilterCandidate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm max-w-[200px]"
                >
                  <option value="all">Semua Kandidat</option>
                  {availableCandidatesForFilter.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={() => setIsRegionSummaryOpen(!isRegionSummaryOpen)}
              className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              {isRegionSummaryOpen ? '🔼 Sembunyikan Ringkasan' : '🔽 Lihat Ringkasan Wilayah'}
            </button>
          </div>

          {/* Collapsible Region Summary */}
          {isRegionSummaryOpen && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-6 animate-in slide-in-from-top duration-300">
              <h2 className="text-lg font-bold text-blue-900 mb-4">Ringkasan per Wilayah</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {regions
                  .filter((r) => r !== 'all')
                  .map((region) => {
                    const regionTotal = candidates.filter(c => c.region === region).length
                    const regionResults = results.filter((r) => {
                      const candidate = candidates.find((c) => c.id === r.candidateId)
                      return candidate?.region === region
                    })
                    const regionPassed = regionResults.filter((r) => r.partAPass).length
                    const regionAvg = regionPassed > 0
                      ? (regionResults.filter(r => r.partAPass).reduce((sum, r) => sum + r.partBTotal, 0) / regionPassed).toFixed(2)
                      : '0'

                    return (
                      <div key={region} className="bg-white rounded-lg border border-blue-100 p-4 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">{region}</h3>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Progress:</span>
                            <span className="font-bold text-blue-700">{regionResults.length}/{regionTotal}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Lulus Syarat:</span>
                            <span className="font-bold text-green-600">{regionPassed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Avg Skor (Lulus):</span>
                            <span className="font-bold text-purple-600">{regionAvg}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredResults.length === 0 ? (
            <div className="p-16 text-center text-gray-500 italic">
              <p className="text-lg">Belum ada hasil wawancara untuk kriteria ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Interviewer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Nama Kandidat
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Wilayah
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Lulus Syarat
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                      Skor Kompetensi
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredResults.map((result) => (
                    <tr 
                      key={result.id} 
                      onClick={() => navigate(`/admin/hasil-detail/${result.id}`)}
                      className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                        {getInterviewerDisplay(result.interviewerId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-bold group-hover:text-blue-700">
                        {getCandidateName(result.candidateId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getCandidateRegion(result.candidateId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            result.partAPass
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.partAPass ? 'Lulus' : 'Tidak'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-bold text-gray-900">
                        {result.partBPercentage.toFixed(1)} <span className="text-gray-400 font-normal">/ 100</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(result.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
