import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useFormResultsStore } from '../../store/formResultsStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'

type RecommendationKey = 'lolos' | 'pertimbangkan' | 'tidak_lolos' | ''

interface ResultAnnotation {
  catatan: string
  rekomendasi: RecommendationKey
}

export default function HasilAkhir() {
  const navigate = useNavigate()
  const results = useFormResultsStore((state) => state.results)
  const candidates = useCandidateStore((state) => state.candidates)
  const interviewers = useInterviewerStore((state) => state.interviewers)
  const loadResults = useFormResultsStore((state) => state.loadFromSupabase)
  const loadCandidates = useCandidateStore((state) => state.loadFromSupabase)
  const loadInterviewers = useInterviewerStore((state) => state.loadFromSupabase)

  const [activeTab, setActiveTab] = useState<'all' | 'rekap'>('all')
  const [filterRegion, setFilterRegion] = useState<string>('all')
  const [filterInterviewer, setFilterInterviewer] = useState<string>('all')
  const [filterCandidate, setFilterCandidate] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'lulus' | 'tidak-lulus'>('all')
  const [isRegionSummaryOpen, setIsRegionSummaryOpen] = useState(false)

  // Annotation state: per result ID
  const [annotations, setAnnotations] = useState<Record<string, ResultAnnotation>>({})
  // Which result's chat modal is open
  const [openChatId, setOpenChatId] = useState<string | null>(null)
  const [tempCatatan, setTempCatatan] = useState('')
  const [tempRekomendasi, setTempRekomendasi] = useState<RecommendationKey>('')
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadResults()
    loadCandidates()
    loadInterviewers()
  }, [])

  // Close chat on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setOpenChatId(null)
      }
    }
    if (openChatId) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openChatId])

  // Reset sub-filters when region changes
  useEffect(() => {
    setFilterInterviewer('all')
    setFilterCandidate('all')
    setFilterStatus('all')
  }, [filterRegion])


  // Helper: cari di partA by keyword pertanyaan ATAU aspek ATAU label
  const findInPartA = (result: any, pertanyaanKw: string[], aspekKw: string[]) => {
    const allA = (result.partA as any[]) || []
    return allA.find((i: any) =>
      pertanyaanKw.some(kw => i.pertanyaan?.toLowerCase().includes(kw)) ||
      aspekKw.some(kw =>
        i.aspect?.toLowerCase().includes(kw) ||
        i.label?.toLowerCase().includes(kw)
      )
    )
  }

  // Helper: cari di partB by keyword pertanyaan ATAU aspek, ambil yang dipilih (value === 'yes')
  const findSelectedInPartB = (result: any, pertanyaanKw: string[], aspekKw: string[]) => {
    const allB = (result.partB as any[]) || []
    const group = allB.filter((i: any) =>
      pertanyaanKw.some(kw => i.pertanyaan?.toLowerCase().includes(kw)) ||
      aspekKw.some(kw => i.aspect?.toLowerCase().includes(kw))
    )
    return group.find((i: any) => i.value === 'yes') || null
  }

  // KIP-K/Lainnya → aspek "Bantuan Lain", pertanyaan mengandung "bantuan/beasiswa lain"
  const getA8Display = (result: any) => {
    const item = findInPartA(result,
      ['bantuan/beasiswa lain', 'beasiswa lain', 'kip-k', 'sudah menerima bantuan'],
      ['bantuan lain']
    )
    if (!item) return '—'
    return item.value === true ? 'Ya' : item.value === false ? 'Tidak' : '—'
  }

  // UKT → aspek "Besaran UKT", pertanyaan "besaran ukt"
  const getA7Display = (result: any) => {
    const item = findInPartA(result,
      ['besaran ukt', 'ukt yang dibayarkan', 'berapa besaran ukt'],
      ['besaran ukt']
    )
    if (!item) return '—'
    return item.textValue || item.value || '—'
  }

  // Tilawah → aspek "Kemampuan Hafalan & Bacaan Al-Qur'an", pertanyaan tentang hafalan/bacaan
  const getTilawahDisplay = (result: any) => {
    const selected = findSelectedInPartB(result,
      ['hafalan', 'bacaan al-qur', 'juz al-qur', 'surat yang sudah dihafal', 'kefasihan'],
      ['kemampuan hafalan', 'hafalan & bacaan', 'bacaan al-qur']
    )
    if (!selected) return '—'
    const score = parseInt(selected.pilihan || '')
    if (score === 3) return { label: 'Baik', score: 3, color: 'text-green-700 bg-green-100' }
    if (score === 2) return { label: 'Cukup Baik', score: 2, color: 'text-yellow-700 bg-yellow-100' }
    if (score === 1) return { label: 'Kurang Baik', score: 1, color: 'text-red-700 bg-red-100' }
    return { label: selected.label, score: '-', color: 'text-gray-600 bg-gray-100' }
  }

  // Pacaran → aspek "Pemahaman Nilai Pergaulan (Pacaran)", pertanyaan tentang pacaran
  const getPacaranDisplay = (result: any) => {
    const selected = findSelectedInPartB(result,
      ['pacaran', 'hubungan pacaran', 'pendapat anda tentang pacaran'],
      ['nilai pergaulan', 'pemahaman nilai pergaulan', 'pacaran']
    )
    if (!selected) return '—'
    const score = parseInt(selected.pilihan || '')
    if (score === 3) return { label: 'Tidak Pacaran', score: 3, color: 'text-green-700 bg-green-100' }
    if (score === 2) return { label: 'Tdk Mengetahui', score: 2, color: 'text-yellow-700 bg-yellow-100' }
    if (score === 1) return { label: 'Ya (Pacaran)', score: 1, color: 'text-red-700 bg-red-100' }
    return { label: selected.label, score: '-', color: 'text-gray-600 bg-gray-100' }
  }


  // Get unique regions dari candidates
  const regions = ['all', ...new Set(candidates.map((c) => c.region))]

  // Logika Leaderboard / Rekapitulasi
  const leaderboard = Object.entries(
    results.reduce((acc: any, curr) => {
      if (!acc[curr.candidateId]) acc[curr.candidateId] = []
      acc[curr.candidateId].push(curr)
      return acc
    }, {})
  )
    .map(([candidateId, candResults]: [string, any]) => {
      const candidate = candidates.find((c) => c.id === candidateId)
      const requiredResults = candidate?.region === 'PIDIE JAYA' ? 2 : 3
      const passAll = candResults.length === requiredResults && candResults.every((r: any) => r.partAPass)
      const avgScore = candResults.reduce((sum: number, r: any) => sum + r.partBPercentage, 0) / candResults.length

      return {
        candidateId,
        candidateName: candidate?.full_name || 'Unknown',
        region: candidate?.region || '-',
        resultsCount: candResults.length,
        passAll,
        avgScore,
        details: candResults,
      }
    })
    .filter((item) => {
      if (!item.passAll) return false
      if (filterRegion !== 'all' && item.region !== filterRegion) return false
      return true
    })
    .sort((a, b) => b.avgScore - a.avgScore)

  const availableCandidatesForFilter = candidates.filter(c =>
    filterRegion === 'all' || c.region === filterRegion
  ).filter(c => results.some(r => r.candidateId === c.id))

  const interviewerIdsWithResults = new Set(results.filter(r => {
    if (filterRegion === 'all') return true
    const cand = candidates.find(c => c.id === r.candidateId)
    return cand?.region === filterRegion
  }).map(r => r.interviewerId))

  const availableInterviewersForFilter = interviewers.filter(i => interviewerIdsWithResults.has(i.id))

  const filteredResults = results.filter((r) => {
    const candidate = candidates.find((c) => c.id === r.candidateId)
    const matchRegion = filterRegion === 'all' || candidate?.region === filterRegion
    const matchInterviewer = filterInterviewer === 'all' || r.interviewerId === filterInterviewer
    const matchCandidate = filterCandidate === 'all' || r.candidateId === filterCandidate
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'lulus' ? r.partAPass : !r.partAPass)

    return matchRegion && matchInterviewer && matchCandidate && matchStatus
  })

  const candidateSummaries = candidates.map((candidate) => {
    const candResults = results.filter(r => r.candidateId === candidate.id)
    const requiredResults = candidate.region === 'PIDIE JAYA' ? 2 : 3
    const isSelesai = candResults.length === requiredResults
    const passAll = isSelesai && candResults.every((r: any) => r.partAPass)
    const failAny = isSelesai && candResults.some((r: any) => !r.partAPass)
    const avgScore = candResults.length > 0
      ? candResults.reduce((sum: number, r: any) => sum + r.partBPercentage, 0) / candResults.length
      : 0

    return { candidateId: candidate.id, region: candidate.region || '-', isSelesai, passAll, failAny, avgScore, resultsCount: candResults.length }
  })

  const filteredSummaries = candidateSummaries.filter(s =>
    filterRegion === 'all' || s.region === filterRegion
  )

  const totalSelesaiCount = filteredSummaries.filter(s => s.isSelesai).length
  const lulusSyaratCount = filteredSummaries.filter(s => s.passAll).length
  const tidakLulusCount = filteredSummaries.filter(s => s.failAny).length
  const totalKandidatInRegion = filterRegion === 'all' ? candidates.length : candidates.filter(c => c.region === filterRegion).length
  const totalKandidatDisplay = `${totalSelesaiCount} / ${totalKandidatInRegion}`
  const passedSummaries = filteredSummaries.filter(s => s.passAll)
  const avgScoreDisplay = passedSummaries.length > 0
    ? (passedSummaries.reduce((sum, s) => sum + s.avgScore, 0) / passedSummaries.length).toFixed(1)
    : '0'

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

  const getCandidateName = (id: string) => candidates.find((c) => c.id === id)?.full_name || `Kandidat ${id}`
  const getCandidateSchool = (id: string) => candidates.find((c) => c.id === id)?.school || '-'
  const getCandidateGender = (id: string) => candidates.find((c) => c.id === id)?.gender || '-'
  const getCandidateMajor = (id: string) => candidates.find((c) => c.id === id)?.major || '-'
  const getCandidateRegion = (id: string) => candidates.find((c) => c.id === id)?.region || '-'
  const getInterviewerDisplay = (interviewerId: string) => {
    const interviewer = interviewers.find((i) => i.id === interviewerId)
    if (!interviewer) return '-'
    return `[${interviewer.role.charAt(0).toUpperCase() + interviewer.role.slice(1)}] ${interviewer.full_name}`
  }

  // Open chat modal
  const openChat = (resultId: string) => {
    const ann = annotations[resultId] || { catatan: '', rekomendasi: '' }
    setTempCatatan(ann.catatan)
    setTempRekomendasi(ann.rekomendasi)
    setOpenChatId(resultId)
  }

  const saveAnnotation = (resultId: string) => {
    setAnnotations(prev => ({ ...prev, [resultId]: { catatan: tempCatatan, rekomendasi: tempRekomendasi } }))
    setOpenChatId(null)
  }

  const rekomendasiConfig: Record<string, { label: string; color: string; bg: string }> = {
    lolos: { label: 'Lolos Tahap Wawancara', color: 'text-green-700', bg: 'bg-green-100 border-green-300' },
    pertimbangkan: { label: 'Perlu Dipertimbangkan', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' },
    tidak_lolos: { label: 'Tidak Lolos Wawancara', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  }

  // Export hasil ke Excel
  const handleExportResults = () => {
    if (activeTab === 'all') {
      if (filteredResults.length === 0) return

      const dataToExport = [
        ['HASIL AKHIR WAWANCARA - SEMUA HASIL'],
        [`Filter Wilayah: ${filterRegion === 'all' ? 'Semua Wilayah' : filterRegion}`],
        [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
        [],
        ['Tanggal', 'Interviewer', 'Nama Kandidat', 'Jenis Kelamin', 'Wilayah', 'Kampus', 'Prodi', 'Skor (%)', 'Daftar KIP-K/Lainnya', 'Tilawah', 'Pacaran', 'UKT', 'Rekomendasi', 'Catatan Akhir'],
        ...filteredResults.map((result) => {
          const tilawah = getTilawahDisplay(result)
          const pacaran = getPacaranDisplay(result)
          const ann = annotations[result.id] || { catatan: '', rekomendasi: '' }
          return [
            formatDateTime(result.submittedAt),
            getInterviewerDisplay(result.interviewerId),
            getCandidateName(result.candidateId),
            getCandidateGender(result.candidateId),
            getCandidateRegion(result.candidateId),
            getCandidateSchool(result.candidateId),
            getCandidateMajor(result.candidateId),
            result.partAPass ? result.partBPercentage.toFixed(1) : 'GUGUR',
            getA8Display(result),
            typeof tilawah === 'object' ? `${tilawah.label} (${tilawah.score})` : tilawah,
            typeof pacaran === 'object' ? `${pacaran.label} (${pacaran.score})` : pacaran,
            getA7Display(result),
            ann.rekomendasi ? (rekomendasiConfig[ann.rekomendasi]?.label || '') : '',
            ann.catatan,
          ]
        }),
      ]

      const ws = XLSX.utils.aoa_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Hasil Wawancara')
      ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 14 }, { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 26 }, { wch: 40 }]
      XLSX.writeFile(wb, `Hasil_Wawancara_Lengkap_${new Date().toISOString().split('T')[0]}.xlsx`)
    } else {
      if (leaderboard.length === 0) return

      const dataToExport = [
        ['HASIL AKHIR WAWANCARA - REKAPITULASI (LEADERBOARD)'],
        [`Filter Wilayah: ${filterRegion === 'all' ? 'Semua Wilayah' : filterRegion}`],
        [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
        [],
        ['Ranking', 'ID Kandidat', 'Nama Kandidat', 'Jenis Kelamin', 'Kampus', 'Prodi', 'Wilayah', 'Rata-rata Skor (%)'],
        ...leaderboard.map((item, index) => [
          index + 1,
          item.candidateId,
          item.candidateName,
          getCandidateGender(item.candidateId),
          getCandidateSchool(item.candidateId),
          getCandidateMajor(item.candidateId),
          item.region,
          item.avgScore.toFixed(2),
        ]),
      ]

      const ws = XLSX.utils.aoa_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi')
      ws['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 20 }]
      XLSX.writeFile(wb, `Rekapitulasi_Leaderboard_${new Date().toISOString().split('T')[0]}.xlsx`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-full mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Hasil Akhir Wawancara</h1>
            <p className="text-sm text-gray-600 mt-1">Rekap hasil assessment semua kandidat</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportResults}
              disabled={activeTab === 'all' ? filteredResults.length === 0 : leaderboard.length === 0}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                (activeTab === 'all' ? filteredResults.length === 0 : leaderboard.length === 0)
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

      <div className="max-w-full mx-auto px-6 py-8">
        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Total Kandidat Selesai</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-blue-600">{totalKandidatDisplay}</p>
              <p className="text-xs text-gray-400">selesai</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-green-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Lulus Verifikasi Wajib (A)</p>
            <p className="text-3xl font-bold text-green-600">{lulusSyaratCount}</p>
            <p className="text-[10px] text-gray-400">Lulus di semua interviewer</p>
          </div>
          <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Tidak Lolos (Gugur)</p>
            <p className="text-3xl font-bold text-red-600">{tidakLulusCount}</p>
            <p className="text-[10px] text-gray-400">Gagal di min. 1 interviewer</p>
          </div>
          <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Skor Rata-rata Lulus</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-purple-600">{avgScoreDisplay}</p>
              <p className="text-xs text-gray-400">%</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-200 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
              activeTab === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
            }`}
          >
            📋 Semua Hasil
          </button>
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all ${
              activeTab === 'rekap' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
            }`}
          >
            🏆 Rekapitulasi (Leaderboard)
          </button>
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

              {activeTab === 'all' && (
                <>
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
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                    <label className="text-sm font-semibold text-gray-700">Status:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      <option value="all">Semua Status</option>
                      <option value="lulus">Lulus Verifikasi</option>
                      <option value="tidak-lulus">Gugur</option>
                    </select>
                  </div>
                </>
              )}
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
                {regions.filter((r) => r !== 'all').map((region) => {
                  const regionSummaries = candidateSummaries.filter(s => s.region === region)
                  const regionTotal = candidates.filter(c => c.region === region).length
                  const regionSelesai = regionSummaries.filter(s => s.isSelesai).length
                  const regionPassed = regionSummaries.filter(s => s.passAll).length
                  const regionFailed = regionSummaries.filter(s => s.failAny).length
                  const regionIncomplete = regionTotal - regionSelesai
                  const regionAvg = regionPassed > 0
                    ? (regionSummaries.filter(s => s.passAll).reduce((sum, s) => sum + s.avgScore, 0) / regionPassed).toFixed(1)
                    : '0'

                  return (
                    <div key={region} className="bg-white rounded-lg border border-blue-100 p-4 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-2 border-b pb-1">{region}</h3>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Selesai:</span>
                          <span className="font-bold text-blue-700">{regionSelesai}/{regionTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Lulus Verifikasi:</span>
                          <span className="font-bold text-green-600">{regionPassed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Gugur:</span>
                          <span className="font-bold text-red-600">{regionFailed}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed pt-1.5 mt-1.5">
                          <span className="text-gray-500">Belum Selesai:</span>
                          <span className="font-bold text-orange-600">{regionIncomplete}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg Skor:</span>
                          <span className="font-bold text-purple-600">{regionAvg}%</span>
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
          {activeTab === 'all' ? (
            filteredResults.length === 0 ? (
              <div className="p-16 text-center text-gray-500 italic">
                <p className="text-lg">Belum ada hasil wawancara untuk kriteria ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Interviewer</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Nama Kandidat</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Jenis Kelamin</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Wilayah</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Kampus</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Prodi</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Skor</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">KIP-K/Lainnya</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Tilawah</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Pacaran</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">UKT</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredResults.map((result) => {
                      const tilawah = getTilawahDisplay(result)
                      const pacaran = getPacaranDisplay(result)
                      const a8 = getA8Display(result)
                      const ukt = getA7Display(result)
                      const ann = annotations[result.id]
                      const rekConfig = ann?.rekomendasi ? rekomendasiConfig[ann.rekomendasi] : null

                      return (
                        <tr
                          key={result.id}
                          className="hover:bg-blue-50/50 transition-colors group"
                        >
                          {/* Tanggal */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                            {formatDate(result.submittedAt)}
                          </td>

                          {/* Interviewer */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                            {getInterviewerDisplay(result.interviewerId)}
                          </td>

                          {/* Nama Kandidat — klik ke detail */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/admin/hasil-detail/${result.id}`)}
                              className="font-bold text-gray-900 hover:text-blue-700 text-left group-hover:underline transition-colors"
                            >
                              {getCandidateName(result.candidateId)}
                            </button>
                            {rekConfig && (
                              <div className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block ${rekConfig.bg} ${rekConfig.color}`}>
                                {rekConfig.label}
                              </div>
                            )}
                          </td>

                          {/* Jenis Kelamin */}
                          <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">
                            {getCandidateGender(result.candidateId)}
                          </td>

                          {/* Wilayah */}
                          <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                            {getCandidateRegion(result.candidateId)}
                          </td>

                          {/* Kampus */}
                          <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate" title={getCandidateSchool(result.candidateId)}>
                            {getCandidateSchool(result.candidateId)}
                          </td>

                          {/* Prodi */}
                          <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px] truncate" title={getCandidateMajor(result.candidateId)}>
                            {getCandidateMajor(result.candidateId)}
                          </td>

                          {/* Skor */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {result.partAPass ? (
                              <span className="font-bold text-blue-700">
                                {result.partBPercentage.toFixed(1)}<span className="text-gray-400 font-normal text-[10px]">/100</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">GUGUR</span>
                            )}
                          </td>

                          {/* KIP-K / Lainnya (A8) */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a8 === 'Ya' ? 'bg-red-100 text-red-700' :
                              a8 === 'Tidak' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {a8}
                            </span>
                          </td>

                          {/* Tilawah (B28) */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {typeof tilawah === 'object' ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tilawah.color}`}>
                                {tilawah.score} · {tilawah.label}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">{tilawah}</span>
                            )}
                          </td>

                          {/* Pacaran (B31) */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {typeof pacaran === 'object' ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pacaran.color}`}>
                                {pacaran.score} · {pacaran.label}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">{pacaran}</span>
                            )}
                          </td>

                          {/* UKT (A7) */}
                          <td className="px-4 py-3 text-center whitespace-nowrap text-xs font-semibold text-gray-700">
                            {ukt !== '—' ? <span className="text-blue-700">Rp {ukt}</span> : <span className="text-gray-400">—</span>}
                          </td>

                          {/* Aksi */}
                          <td className="px-4 py-3 text-center whitespace-nowrap relative">
                            <button
                              onClick={() => openChat(result.id)}
                              title="Catatan & Rekomendasi"
                              className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all ${
                                ann?.rekomendasi || ann?.catatan
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                              }`}
                            >
                              💬
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            leaderboard.length === 0 ? (
              <div className="p-16 text-center text-gray-500 italic">
                <p className="text-lg">Belum ada kandidat yang lulus kriteria rekapitulasi</p>
                <p className="text-sm mt-2">Kandidat harus diinterview oleh semua interviewer dan lulus Verifikasi Wajib (Bagian A) pada semuanya.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kandidat</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Wilayah</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Rata-rata Skor (%)</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Detail Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaderboard.map((item, index) => (
                      <tr key={item.candidateId} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-200 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{item.candidateName}</p>
                          <p className="text-xs text-gray-500">ID: {item.candidateId}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.region}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-blue-600">{item.avgScore.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-1">
                            {item.details.map((r: any) => {
                              const int = interviewers.find(i => i.id === r.interviewerId)
                              const roleCode = int?.role.charAt(0).toUpperCase() || '?'
                              return (
                                <div
                                  key={r.id}
                                  title={`${getInterviewerDisplay(r.interviewerId)}: ${r.partBPercentage.toFixed(1)}%`}
                                  className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200"
                                >
                                  {roleCode}
                                </div>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Chat / Annotation Modal */}
      {openChatId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div ref={chatRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">💬 Catatan & Rekomendasi Akhir</h3>
              <button onClick={() => setOpenChatId(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">✕</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Catatan Akhir</label>
              <textarea
                value={tempCatatan}
                onChange={(e) => setTempCatatan(e.target.value)}
                rows={4}
                placeholder="Tulis catatan evaluasi akhir untuk kandidat ini..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">Rekomendasi Akhir</label>
              <div className="space-y-2">
                {(Object.entries(rekomendasiConfig) as [RecommendationKey, typeof rekomendasiConfig[string]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setTempRekomendasi(key)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                      tempRekomendasi === key
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tempRekomendasi === key ? '● ' : '○ '}{cfg.label}
                  </button>
                ))}
                {tempRekomendasi && (
                  <button
                    onClick={() => setTempRekomendasi('')}
                    className="text-xs text-gray-400 hover:text-red-500 mt-1 transition-colors"
                  >
                    ✕ Hapus rekomendasi
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setOpenChatId(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => saveAnnotation(openChatId)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
