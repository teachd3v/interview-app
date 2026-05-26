import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useHomeVisitStore } from '../../store/homeVisitStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'

export default function HasilHomeVisitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const results = useHomeVisitStore((state) => state.results)
  const candidates = useCandidateStore((state) => state.candidates)
  const interviewers = useInterviewerStore((state) => state.interviewers)
  const loadResults = useHomeVisitStore((state) => state.loadFromSupabase)

  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (results.length === 0) {
      loadResults()
    }
    useCandidateStore.getState().loadFromSupabase()
    useInterviewerStore.getState().loadFromSupabase()
  }, [])

  const result = results.find((r) => r.id === id)

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-600 mb-4">Data detail tidak ditemukan</p>
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
  const mentor = interviewers.find((i) => i.id === result.mentorId)

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Detail Observasi Lapangan</h1>
            <p className="text-sm text-gray-600">ID: {result.id}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold"
          >
            ← Kembali
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kandidat</h2>
            <p className="text-xl font-black text-gray-900">{candidate?.full_name || 'Memuat...'}</p>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600 flex items-center gap-2">🏫 {candidate?.school || '-'}</p>
              <p className="text-sm text-gray-600 flex items-center gap-2">📍 {candidate?.region || '-'}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Mentor Visitor</h2>
            <p className="text-xl font-black text-gray-900">{mentor?.full_name || 'Memuat...'}</p>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600 flex items-center gap-2">👨‍🏫 Role: {mentor?.role || '-'}</p>
              <p className="text-sm text-gray-600 flex items-center gap-2">🕒 Submit: {new Date(result.submittedAt).toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Final Result Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className={`p-6 text-center ${result.partAPass ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status Wajib (A)</p>
              <p className={`text-2xl font-black ${result.partAPass ? 'text-green-700' : 'text-red-700'}`}>
                {result.partAPass ? '✓ LOLOS' : '✗ GAGAL'}
              </p>
            </div>
            <div className="p-6 text-center bg-blue-50">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Skor Akhir</p>
              <p className="text-3xl font-black text-blue-700">
                {result.percentage.toFixed(1)}%
              </p>
            </div>
            <div className="p-6 text-center bg-purple-50">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Rekomendasi</p>
              <p className="text-xl font-black text-purple-700 uppercase">
                {result.recommendationStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Instrument Details */}
        <div className="space-y-8">
          {/* Bagian A */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-gray-900 mb-6 border-b pb-4">Bagian A: Kualifikasi Wajib</h2>
            <div className="space-y-6">
              {result.partAResults.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-bold text-gray-700 leading-relaxed">{item.label}</p>
                    <span className={`px-4 py-1 rounded-full text-xs font-black uppercase shrink-0 ${item.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.value ? 'Ya' : 'Tidak'}
                    </span>
                  </div>
                  {item.note && (
                    <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                      <p className="text-xs text-gray-600 italic">" {item.note} "</p>
                    </div>
                  )}
                  {item.evidenceUrls && item.evidenceUrls.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {item.evidenceUrls.map((url, i) => (
                        <img 
                          key={i} 
                          src={url} 
                          className="w-20 h-20 object-cover rounded-lg border border-gray-100 cursor-zoom-in hover:opacity-80 transition-opacity" 
                          alt="bukti"
                          onClick={() => setSelectedImage(url)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bagian B */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-gray-900 mb-6 border-b pb-4">Bagian B: Latar Belakang Keluarga</h2>
            <div className="space-y-10">
              {result.partBResults.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{item.aspect}</p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed">{item.label}</p>
                    </div>
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-black shrink-0">
                      Skor: {item.score}
                    </span>
                  </div>
                  {item.note && (
                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                      <p className="text-xs text-gray-600 italic">" {item.note} "</p>
                    </div>
                  )}
                  {item.evidenceUrls && item.evidenceUrls.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {item.evidenceUrls.map((url, i) => (
                        <img 
                          key={i} 
                          src={url} 
                          className="w-24 h-24 object-cover rounded-lg border border-gray-100 cursor-zoom-in hover:opacity-80 transition-opacity" 
                          alt="bukti"
                          onClick={() => setSelectedImage(url)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bagian C */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-gray-900 mb-6 border-b pb-4">Bagian C: Latar Belakang Penerima Manfaat</h2>
            <div className="space-y-10">
              {result.partCResults.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-purple-600 uppercase mb-1">{item.aspect}</p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed">{item.label}</p>
                    </div>
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-black shrink-0">
                      Skor: {item.score}
                    </span>
                  </div>
                  {item.note && (
                    <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-200">
                      <p className="text-xs text-gray-600 italic">" {item.note} "</p>
                    </div>
                  )}
                  {item.evidenceUrls && item.evidenceUrls.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {item.evidenceUrls.map((url, i) => (
                        <img 
                          key={i} 
                          src={url} 
                          className="w-24 h-24 object-cover rounded-lg border border-gray-100 cursor-zoom-in hover:opacity-80 transition-opacity" 
                          alt="bukti"
                          onClick={() => setSelectedImage(url)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kesimpulan Akhir */}
          <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-xl">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span> Kesimpulan & Catatan Mentor
            </h2>
            <p className="text-gray-300 leading-relaxed italic">
              {result.notes ? `"${result.notes}"` : "(Tidak ada catatan kesimpulan akhir)"}
            </p>
          </div>
        </div>
      </div>

      {/* Image Modal (Lightbox) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in duration-300" 
            alt="full size" 
          />
          <button 
            className="absolute top-6 right-6 text-white text-4xl font-bold"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
