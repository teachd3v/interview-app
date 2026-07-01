import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useFormResultsStore } from '../../store/formResultsStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'

export default function HasilDetail() {
  const { resultId } = useParams()
  const navigate = useNavigate()

  const results = useFormResultsStore((state) => state.results)
  const candidates = useCandidateStore((state) => state.candidates)
  const interviewers = useInterviewerStore((state) => state.interviewers)
  const updateNotes = useFormResultsStore((state) => state.updateNotes)
  const loadResults = useFormResultsStore((state) => state.loadFromSupabase)

  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState('')

  useEffect(() => {
    if (results.length === 0) {
      loadResults()
    }
  }, [])

  const result = results.find((r) => r.id === resultId)

  useEffect(() => {
    if (result) {
      setEditedNotes(result.notes)
    }
  }, [result])

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-600 mb-4">Data hasil tidak ditemukan</p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 font-bold hover:underline"
          >
            Kembali
          </button>
        </div>
      </div>
    )
  }

  const candidate = candidates.find((c) => c.id === result.candidateId)
  const interviewer = interviewers.find((i) => i.id === result.interviewerId)

  const handleSaveNotes = async () => {
    await updateNotes(result.id, editedNotes)
    setIsEditingNotes(false)
  }

  // ---- Parse Notes untuk catatan per aspek ----
  // Format notes: "[UKT: Rp X]\n\n[Aspek: NamaAspek]\ncatatan\n\n[Aspek: NamaAspek2]\ncatatan2"
  const parseNotes = (notes: string) => {
    const aspectNotes: Record<string, string> = {}
    let uktValue = ''

    const uktMatch = notes.match(/^\[UKT:\s*([^\]]+)\]/)
    if (uktMatch) uktValue = uktMatch[1].trim()

    const aspectRegex = /\[Aspek:\s*([^\]]+)\]\n([\s\S]*?)(?=\n\[Aspek:|$)/g
    let match
    while ((match = aspectRegex.exec(notes)) !== null) {
      aspectNotes[match[1].trim()] = match[2].trim()
    }

    return { uktValue, aspectNotes }
  }

  const { uktValue, aspectNotes } = parseNotes(result.notes || '')

  // ---- Kelompokkan partA per aspek/pertanyaan ----
  const partAByAspect = (result.partA as any[]).reduce((acc, item) => {
    const key = item.pertanyaan || 'Verifikasi Umum'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, any[]>)

  // ---- Kelompokkan partB per bagian → aspek → pertanyaan ----
  const partBByBagian = (result.partB as any[]).reduce((acc, item) => {
    const bagian = item.bagian || 'Evaluasi'
    if (!acc[bagian]) acc[bagian] = {}
    const aspect = item.aspect || 'Umum'
    if (!acc[bagian][aspect]) acc[bagian][aspect] = {}
    const pertanyaan = item.pertanyaan || item.label
    if (!acc[bagian][aspect][pertanyaan]) acc[bagian][aspect][pertanyaan] = []
    acc[bagian][aspect][pertanyaan].push(item)
    return acc
  }, {} as Record<string, Record<string, Record<string, any[]>>>)

  const getValueLabel = (val: string | boolean | null, options?: string) => {
    if (val === null || val === undefined) return { label: '—', color: 'text-gray-400' }
    if (typeof val === 'boolean') {
      return val
        ? { label: 'Ya', color: 'text-green-700' }
        : { label: 'Tidak', color: 'text-red-600' }
    }
    if (val === 'yes') return { label: 'Terpilih ✓', color: 'text-green-700' }
    if (val === 'maybe') return { label: 'Sebagian', color: 'text-yellow-600' }
    if (val === 'no') return { label: 'Tidak', color: 'text-red-600' }
    // For multi-select string values
    if (options && options.split(';').map((o) => o.trim()).includes(String(val))) {
      return { label: String(val), color: 'text-blue-700' }
    }
    return { label: String(val), color: 'text-gray-700' }
  }

  const bagianLabels: Record<string, string> = {
    'B.1': 'B.1 · Presentasi Diri',
    'B.2': 'B.2 · Motivasi',
    'B.3': 'B.3 · Nilai & Karakter',
    'B.4': 'B.4 · Kesiapan Hidup',
  }

  const getBagianLabel = (bagian: string) => {
    for (const [key, label] of Object.entries(bagianLabels)) {
      if (bagian.includes(key) || bagian.includes(label.split('·')[1]?.trim() || '')) return label
    }
    return bagian
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Detail Hasil Wawancara</h1>
            <p className="text-xs text-gray-400 mt-0.5">ID: {result.id}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
          >
            ← Kembali
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Info Kandidat & Interviewer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Kandidat</p>
            <p className="text-xl font-bold text-gray-900">{candidate?.full_name || result.candidateName}</p>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p><span className="font-semibold">Kampus:</span> {candidate?.school || '-'}</p>
              <p><span className="font-semibold">Prodi:</span> {candidate?.major || '-'}</p>
              <p><span className="font-semibold">Jenis Kelamin:</span> {candidate?.gender || '-'}</p>
              <p><span className="font-semibold">Wilayah:</span> {candidate?.region || '-'}</p>
              {uktValue && (
                <p className="mt-2 pt-2 border-t border-dashed">
                  <span className="font-semibold">UKT:</span>{' '}
                  <span className="text-blue-700 font-bold">{uktValue}</span>
                </p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Interviewer</p>
            <p className="text-xl font-bold text-gray-900">{interviewer?.full_name || '-'}</p>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p><span className="font-semibold">Role:</span> <span className="capitalize">{interviewer?.role || '-'}</span></p>
              <p><span className="font-semibold">Wilayah:</span> {interviewer?.region || '-'}</p>
              <p><span className="font-semibold">Tanggal:</span> {new Date(result.submittedAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
            </div>
          </div>
        </div>

        {/* Ringkasan Skor */}
        <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Ringkasan Hasil</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className={`rounded-xl p-4 ${result.partAPass ? 'bg-green-800/60' : 'bg-red-900/60'}`}>
              <p className="text-[10px] text-gray-300 uppercase font-semibold tracking-wider">Status Kelayakan Wajib</p>
              <p className={`text-xl font-black mt-1 ${result.partAPass ? 'text-green-300' : 'text-red-400'}`}>
                {result.partAPass ? 'LULUS VERIFIKASI' : 'TIDAK LAYAK (FAIL)'}
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Total Poin Evaluasi</p>
              <p className="text-xl font-bold text-gray-100 mt-1">
                {result.partBTotal}
                <span className="text-gray-500 font-normal text-sm"> poin</span>
              </p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Skor Persentase</p>
              <p className="text-xl font-bold text-blue-400 mt-1">
                {result.partBPercentage.toFixed(1)}
                <span className="text-gray-500 font-normal text-sm"> / 100</span>
              </p>
            </div>
          </div>
        </div>

        {/* ===== BAGIAN A - VERIFIKASI ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h2 className="text-white font-bold text-base">A · Verifikasi Kualifikasi Wajib</h2>
            <p className="text-blue-100 text-xs mt-0.5">Pengecekan kelayakan dasar kandidat</p>
          </div>
          <div className="p-6 space-y-6">
            {(Object.entries(partAByAspect) as [string, any[]][]).map(([pertanyaan, indicators]) => (
              <div key={pertanyaan}>
                {pertanyaan !== 'Verifikasi Umum' && (
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 border-l-4 border-blue-400 pl-3">
                    {pertanyaan}
                  </h3>
                )}
                <div className="space-y-2">
                  {indicators.map((item: any) => {
                    const isA8Fail = item.id === 'a8' && item.value === true
                    const displayValue = getValueLabel(item.value, item.pilihan)
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isA8Fail
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div>
                          {item.pertanyaan && (
                            <span className="block text-[10px] font-bold text-gray-500 mb-0.5">{item.pertanyaan}</span>
                          )}
                          <span className="text-sm text-gray-700">{item.label}</span>
                          {isA8Fail && (
                            <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                              ⚠ Penyebab Gugur
                            </span>
                          )}
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          {/* Teks value / pilihan ganda */}
                          {item.textValue ? (
                            <span className="text-sm font-bold text-blue-700">{item.textValue}</span>
                          ) : Array.isArray(item.value) ? (
                            <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                              {item.value.map((v: string) => (
                                <span key={v} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{v}</span>
                              ))}
                            </div>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              displayValue.color === 'text-green-700'
                                ? 'bg-green-100 text-green-700'
                                : displayValue.color === 'text-red-600'
                                ? 'bg-red-100 text-red-700'
                                : displayValue.color === 'text-blue-700'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {displayValue.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== BAGIAN B - EVALUASI ===== */}
        {Object.keys(partBByBagian).length > 0 && (
          <div className="space-y-4">
            {Object.entries(partBByBagian).map(([bagian, aspectMap]: [string, any]) => (
              <div key={bagian} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-indigo-700 px-6 py-4">
                  <h2 className="text-white font-bold text-base">{getBagianLabel(bagian)}</h2>
                  <p className="text-indigo-200 text-xs mt-0.5">Evaluasi kompetensi pendukung</p>
                </div>
                <div className="p-6 space-y-6">
                  {Object.entries(aspectMap).map(([aspect, questionMap]: [string, any]) => {
                    const aspectNote = aspectNotes[aspect]
                    return (
                      <div key={aspect} className="border border-gray-100 rounded-xl overflow-hidden">
                        {/* Aspek Header */}
                        <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-indigo-800 border-l-4 border-indigo-500 pl-3">
                            {aspect}
                          </h3>
                          {(() => {
                            const allIndicators = Object.values(questionMap).flat() as any[]
                            const scored = allIndicators.filter((i) => i.value === 'yes')
                            const totalScore = scored.reduce((sum, i) => sum + (i.score || 0), 0)
                            return totalScore > 0 ? (
                              <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                                +{totalScore} poin
                              </span>
                            ) : null
                          })()}
                        </div>

                        <div className="divide-y divide-gray-50">
                          {(Object.entries(questionMap) as [string, any[]][]).map(([pertanyaan, indicators]) => (
                            <div key={pertanyaan} className="px-4 py-4">
                              <p className="text-xs font-bold text-gray-700 mb-3">{pertanyaan}</p>
                              <div className="space-y-2">
                                {indicators.map((item: any) => {
                                  const isSelected = item.value === 'yes'
                                  const optionScore = parseInt(item.pilihan || '')
                                  const scoreDisplay = !isNaN(optionScore) ? optionScore : (isSelected ? 2 : item.value === 'maybe' ? 1 : 0)
                                  return (
                                    <div
                                      key={item.id}
                                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                                        isSelected
                                          ? 'bg-green-50 border border-green-200'
                                          : 'bg-gray-50 border border-gray-100 opacity-60'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${
                                          isSelected ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
                                        }`}>
                                          {isSelected ? '✓' : ''}
                                        </div>
                                        <span className={`text-sm ${isSelected ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                          {item.label}
                                        </span>
                                      </div>
                                      {isSelected && (
                                        <span className="ml-4 shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                          +{scoreDisplay}
                                        </span>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Catatan aspek */}
                        {aspectNote && (
                          <div className="px-4 pb-4 pt-0">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-1">📝 Catatan Aspek ini</p>
                              <p className="text-sm text-yellow-900 whitespace-pre-wrap leading-relaxed">{aspectNote}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== Catatan Interviewer (Full Notes Edit) ===== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="text-base font-bold text-gray-900">📋 Catatan Lengkap Interviewer</h2>
            {!isEditingNotes ? (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1"
              >
                ✏️ Edit
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="text-gray-500 text-sm font-bold hover:underline"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="text-green-600 text-sm font-bold hover:underline"
                >
                  Simpan
                </button>
              </div>
            )}
          </div>

          {isEditingNotes ? (
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              className="w-full p-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-48 text-sm"
              placeholder="Tulis catatan lengkap..."
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm italic">
              {result.notes || '(Tidak ada catatan)'}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
