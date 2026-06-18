import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { useHomeVisitStore } from '../../store/homeVisitStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'
import { useRegionStore } from '../../store/regionStore'

export default function HasilHomeVisit() {
  const navigate = useNavigate()
  const results = useHomeVisitStore((state) => state.results)
  const candidates = useCandidateStore((state) => state.candidates)
  const interviewers = useInterviewerStore((state) => state.interviewers)
  const regions = useRegionStore((state) => state.regions)

  const [searchTerm, setSearchBar] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')

  useEffect(() => {
    useHomeVisitStore.getState().loadFromSupabase()
    useCandidateStore.getState().loadFromSupabase()
    useInterviewerStore.getState().loadFromSupabase()
    useRegionStore.getState().loadFromSupabase()
  }, [])

  const getCandidateName = (id: string) => {
    return candidates.find((c) => c.id === id)?.full_name || `Kandidat ${id}`
  }

  const getCandidateSchool = (id: string) => {
    return candidates.find((c) => c.id === id)?.school || '-'
  }

  const getCandidateRegion = (id: string) => {
    return candidates.find((c) => c.id === id)?.region || '-'
  }

  const getCandidateEmail = (id: string) => {
    return candidates.find((c) => c.id === id)?.email || '-'
  }

  const getInterviewerName = (id: string) => {
    return interviewers.find((i) => i.id === id)?.full_name || `Mentor ${id}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Filter logic
  const filteredResults = results.filter((result) => {
    const candidateName = getCandidateName(result.candidateId).toLowerCase()
    const mentorName = getInterviewerName(result.mentorId).toLowerCase()
    const region = getCandidateRegion(result.candidateId)
    
    const matchesSearch = candidateName.includes(searchTerm.toLowerCase()) || 
                         mentorName.includes(searchTerm.toLowerCase())
    const matchesRegion = filterRegion === 'all' || region === filterRegion

    return matchesSearch && matchesRegion
  })

  // Stats
  const totalVisits = filteredResults.length
  const suggested = filteredResults.filter(r => r.recommendationStatus === 'Disarankan').length
  const considered = filteredResults.filter(r => r.recommendationStatus === 'Dipertimbangkan').length
  const notSuggested = filteredResults.filter(r => r.recommendationStatus === 'Tidak Disarankan').length

  const handleExportExcel = () => {
    if (filteredResults.length === 0) return

    const dataToExport = [
      ['REKAPITULASI HASIL OBSERVASI HOME VISIT'],
      [`Filter Wilayah: ${filterRegion === 'all' ? 'Semua Wilayah' : filterRegion}`],
      [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
      [],
      ['Nama Kandidat', 'Email', 'Sekolah', 'Wilayah', 'Mentor (Visitor)', 'Status Rekomendasi', 'Skor (%)', 'Tanggal'],
      ...filteredResults.map((r) => [
        getCandidateName(r.candidateId),
        getCandidateEmail(r.candidateId),
        getCandidateSchool(r.candidateId),
        getCandidateRegion(r.candidateId),
        getInterviewerName(r.mentorId),
        r.recommendationStatus,
        r.percentage.toFixed(2),
        formatDate(r.submittedAt),
      ]),
    ]

    const ws = XLSX.utils.aoa_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Home Visit')
    ws['!cols'] = [
      { wch: 30 }, // Nama Kandidat
      { wch: 30 }, // Email
      { wch: 25 }, // Sekolah
      { wch: 20 }, // Wilayah
      { wch: 25 }, // Mentor (Visitor)
      { wch: 20 }, // Status Rekomendasi
      { wch: 15 }, // Skor (%)
      { wch: 20 }  // Tanggal
    ]
    XLSX.writeFile(wb, `Hasil_Home_Visit_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏠 Hasil Home Visit</h1>
            <p className="text-sm text-gray-600 mt-1">Rekapitulasi data observasi lapangan oleh Mentor</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold"
            >
              📥 Export Excel
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Visit</p>
            <p className="text-3xl font-black text-gray-900">{totalVisits}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm">
            <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">Disarankan</p>
            <p className="text-3xl font-black text-green-700">{suggested}</p>
          </div>
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 shadow-sm">
            <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">Dipertimbangkan</p>
            <p className="text-3xl font-black text-yellow-700">{considered}</p>
          </div>
          <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
            <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Tidak Disarankan</p>
            <p className="text-3xl font-black text-red-700">{notSuggested}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari nama kandidat atau mentor..."
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
                  <th className="px-6 py-4">Kandidat & Sekolah</th>
                  <th className="px-6 py-4">Wilayah</th>
                  <th className="px-6 py-4">Mentor (Visitor)</th>
                  <th className="px-6 py-4 text-center">Skor (%)</th>
                  <th className="px-6 py-4">Rekomendasi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada data hasil home visit yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{getCandidateName(r.candidateId)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{getCandidateSchool(r.candidateId)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {getCandidateRegion(r.candidateId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getInterviewerName(r.mentorId)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-blue-600">
                          {r.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          r.recommendationStatus === 'Disarankan' ? 'bg-green-100 text-green-700' :
                          r.recommendationStatus === 'Dipertimbangkan' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {r.recommendationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/admin/hasil-home-visit-detail/${r.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition-colors"
                        >
                          Lihat Detail
                        </button>
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
