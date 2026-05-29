import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCandidateStore } from '../../store/candidateStore'
import { useFormResultsStore } from '../../store/formResultsStore'
import { useRegionStore } from '../../store/regionStore'

export default function ValidasiHomeVisit() {
  const navigate = useNavigate()
  const candidates = useCandidateStore((state) => state.candidates)
  const results = useFormResultsStore((state) => state.results)
  const regions = useRegionStore((state) => state.regions)
  
  const updateStatus = useCandidateStore((state) => state.updateHomeVisitStatus)
  const bulkUpdateStatus = useCandidateStore((state) => state.bulkUpdateHomeVisitStatus)

  const [searchTerm, setSearchBar] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    useCandidateStore.getState().loadFromSupabase()
    useFormResultsStore.getState().loadFromSupabase()
    useRegionStore.getState().loadFromSupabase()
  }, [])

  // Filter kandidat yang sudah 3x interview (atau 2x untuk Pidie Jaya) dan lulus Part A
  const eligibleCandidates = candidates.filter(c => {
    const candResults = results.filter(r => r.candidateId === c.id)
    const requiredResults = c.region === 'PIDIE JAYA' ? 2 : 3
    
    if (candResults.length !== requiredResults) return false
    const passInitial = candResults.every(r => r.partAPass)
    if (!passInitial) return false
    
    // Filter berdasarkan input user
    const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = filterRegion === 'all' || c.region === filterRegion
    
    return matchesSearch && matchesRegion
  }).map(c => {
    const candResults = results.filter(r => r.candidateId === c.id)
    const avgScore = candResults.reduce((sum, r) => sum + r.partBPercentage, 0) / candResults.length
    return { ...c, avgScore }
  }).sort((a, b) => b.avgScore - a.avgScore)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === eligibleCandidates.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(eligibleCandidates.map(c => c.id))
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return
    if (confirm(`Loloskan ${selectedIds.length} kandidat terpilih ke tahap Home Visit?`)) {
      await bulkUpdateStatus(selectedIds, 'lolos')
      setSelectedIds([])
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return
    if (confirm(`Gugurkan ${selectedIds.length} kandidat terpilih?`)) {
      await bulkUpdateStatus(selectedIds, 'gagal')
      setSelectedIds([])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚖️ Validasi Home Visit</h1>
            <p className="text-sm text-gray-600 mt-1">Tentukan kandidat yang layak lanjut ke observasi lapangan</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold"
          >
            ← Kembali
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center animate-in slide-in-from-top-4">
            <p className="font-bold">{selectedIds.length} Kandidat Terpilih</p>
            <div className="flex gap-3">
              <button
                onClick={handleBulkReject}
                className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg text-sm font-black transition-colors"
              >
                ❌ GUGURKAN
              </button>
              <button
                onClick={handleBulkApprove}
                className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-black transition-colors"
              >
                ✅ LOLOSKAN KE HOME VISIT
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama kandidat..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchBar(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
            >
              <option value="all">Semua Wilayah</option>
              {regions.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      checked={selectedIds.length === eligibleCandidates.length && eligibleCandidates.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4">Kandidat</th>
                  <th className="px-6 py-4">Wilayah</th>
                  <th className="px-6 py-4 text-center">Avg Skor (%)</th>
                  <th className="px-6 py-4">Status Saat Ini</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eligibleCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada kandidat baru yang memenuhi kualifikasi untuk divalidasi.
                    </td>
                  </tr>
                ) : (
                  eligibleCandidates.map((c) => (
                    <tr key={c.id} className={`transition-colors ${selectedIds.includes(c.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                          checked={selectedIds.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{c.full_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.school}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {c.region}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {c.avgScore.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          c.home_visit_status === 'lolos' ? 'bg-green-100 text-green-700' :
                          c.home_visit_status === 'gagal' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {c.home_visit_status === 'lolos' ? '✓ SIAP VISIT' :
                           c.home_visit_status === 'gagal' ? '✗ GAGAL' :
                           '⏱️ PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => updateStatus(c.id, 'gagal')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Gugurkan"
                          >
                            <span className="text-xl">✗</span>
                          </button>
                          <button
                            onClick={() => updateStatus(c.id, 'lolos')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Loloskan ke Home Visit"
                          >
                            <span className="text-xl">✓</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
