import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useFormResultsStore } from '../../store/formResultsStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'
import { useAuthStore } from '../../store/authStore'

export default function HasilDetail() {
  const { resultId } = useParams()
  const navigate = useNavigate()
  const { role } = useAuthStore()
  
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

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Detail Hasil Assessment</h1>
            <p className="text-sm text-gray-600">ID: {result.id}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Kembali
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Info Utama */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Kandidat</h2>
            <p className="text-xl font-bold text-gray-900">{candidate?.full_name || result.candidateName}</p>
            <p className="text-gray-600">{candidate?.school || '-'}</p>
            <p className="text-gray-600">{candidate?.region || '-'}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Interviewer</h2>
            <p className="text-xl font-bold text-gray-900">{interviewer?.full_name || '-'}</p>
            <p className="text-gray-600 capitalize">Role: {interviewer?.role || '-'}</p>
            <p className="text-gray-600">Region: {interviewer?.region || '-'}</p>
          </div>
        </div>

        {/* Skor Ringkasan */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-2 divide-x divide-gray-100">
            <div className={`p-6 text-center ${result.partAPass ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status Syarat (Part A)</p>
              <p className={`text-2xl font-black ${result.partAPass ? 'text-green-700' : 'text-red-700'}`}>
                {result.partAPass ? 'LULUS SYARAT' : 'TIDAK LULUS'}
              </p>
            </div>
            <div className="p-6 text-center bg-blue-50">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Skor Kompetensi (Part B)</p>
              <p className="text-2xl font-black text-blue-700">
                {result.partBPercentage.toFixed(1)} <span className="text-blue-300 font-normal">/ 100</span>
              </p>
            </div>
          </div>
        </div>

        {/* Part A Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Detail Kualifikasi Wajib (Part A)</h2>
          <div className="space-y-3">
            {result.partA.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.value ? 'Ya' : 'Tidak'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Part B Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Detail Kompetensi (Part B)</h2>
          <div className="space-y-6">
            {/* Group by Aspect */}
            {Array.from(new Set(result.partB.map(b => b.aspect))).map(aspect => (
              <div key={aspect}>
                <h3 className="text-sm font-bold text-blue-600 mb-3 bg-blue-50 px-3 py-1 rounded inline-block">{aspect}</h3>
                <div className="space-y-2">
                  {result.partB.filter(b => b.aspect === aspect).map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 ml-4">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-bold ${
                          item.value === 'yes' ? 'text-green-600' : 
                          item.value === 'maybe' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {item.value === 'yes' ? 'Sangat Baik' : 
                           item.value === 'maybe' ? 'Ragu' : 'Kurang'}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded font-bold text-sm min-w-[30px] text-center">
                          {item.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catatan Tambahan */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-bold text-gray-900">Catatan Interviewer</h2>
            {!isEditingNotes ? (
              <button 
                onClick={() => setIsEditingNotes(true)}
                className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1"
              >
                ✏️ Edit Catatan
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingNotes(false)}
                  className="text-gray-500 text-sm font-bold"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveNotes}
                  className="text-green-600 text-sm font-bold"
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
              className="w-full p-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-40"
              placeholder="Tulis catatan..."
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed italic">
              {result.notes || "(Tidak ada catatan)"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
