import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useFormStore } from '../../store/formStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useFormResultsStore, FormResult } from '../../store/formResultsStore'
import { useInstrumentStore } from '../../store/instrumentStore'

export default function FormWawancara() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'partA' | 'partB' | 'partC'>('partA')
  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedResult, setSubmittedResult] = useState<FormResult | null>(null)

  const {
    partA,
    partB,
    notes,
    updatePartA,
    updatePartB,
    setNotes,
    isPartBComplete,
    reset: resetForm,
    initializeFromInstruments,
  } = useFormStore()

  const candidates = useCandidateStore((state) => state.candidates)
  const loadCandidates = useCandidateStore((state) => state.loadFromLocalStorage)

  const addResult = useFormResultsStore((state) => state.addResult)

  const instruments = useInstrumentStore((state) => state.instruments)
  const getInstrumentsByBagian = useInstrumentStore((state) => state.getInstrumentsByBagian)
  const loadInstruments = useInstrumentStore((state) => state.loadFromLocalStorage)

  useEffect(() => {
    loadCandidates()
    loadInstruments()
  }, [])

  useEffect(() => {
    if (instruments.length > 0) {
      initializeFromInstruments(instruments)
    }
  }, [instruments, initializeFromInstruments])

  const candidate = candidates.find((c) => c.id === candidateId)

  useEffect(() => {
    if (!candidate) {
      navigate('/interviewer')
    }
  }, [candidate, navigate])

  if (!candidate) return null

  const isPartAComplete = () => partA.every((item) => item.value !== null)
  const isPartCComplete = () => notes.trim().length > 0

  const handlePartAChange = (id: string, value: boolean) => {
    updatePartA(id, value)
    if (!value) {
      setToast({
        message:
          'Perhatian: Kandidat otomatis tidak lolos karena tidak memenuhi kualifikasi wajib. Anda tetap bisa melanjutkan form.',
        type: 'warning',
      })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleNext = () => {
    if (activeTab === 'partA') {
      if (!isPartAComplete()) {
        setToast({
          message: 'Harap lengkapi semua pertanyaan di Bagian A terlebih dahulu',
          type: 'error',
        })
        return
      }
      setActiveTab('partB')
      setTimeout(() => {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
      }, 0)
    } else if (activeTab === 'partB') {
      if (!isPartBComplete()) {
        setToast({
          message: 'Harap lengkapi semua pertanyaan di Bagian B terlebih dahulu',
          type: 'error',
        })
        return
      }
      setActiveTab('partC')
      setTimeout(() => {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
      }, 0)
    }
  }

  const handleSubmit = () => {
    if (!isPartBComplete()) {
      setToast({
        message: 'Harap lengkapi semua pertanyaan di Bagian B terlebih dahulu',
        type: 'error',
      })
      return
    }

    // Calculate scores
    const partAPass = partA.every((item) => item.value === true)

    // Calculate Part B score (0=tidak, 1=ragu, 2=ya)
    const partBScores = partB.map((item) => {
      const score = item.value === 'yes' ? 2 : item.value === 'maybe' ? 1 : 0
      return { ...item, score }
    })
    const partBTotal = partBScores.reduce((sum, item) => sum + item.score, 0)
    const partBPercentage = (partBTotal / 40) * 100

    // Create result object
    const result: FormResult = {
      id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      candidateId: candidateId || '',
      candidateName: candidate?.fullName || 'Unknown',
      interviewDate: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toISOString(),
      partA: partA.map((item) => ({
        id: item.id,
        label: item.label,
        value: item.value || false,
      })),
      partB: partBScores,
      notes,
      partAPass,
      partBTotal,
      partBPercentage,
    }

    // Save to store
    addResult(result)
    setSubmittedResult(result)

    // Show success modal
    setShowSuccessModal(true)

    // Reset form
    resetForm()
  }

  const partBByAspect = partB.reduce(
    (acc, item) => {
      if (!acc[item.aspect]) acc[item.aspect] = []
      acc[item.aspect].push(item)
      return acc
    },
    {} as Record<string, typeof partB>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Sticky Header */}
      <div className="sticky-header">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{candidate.fullName}</h2>
              <p className="text-sm text-gray-600">
                {candidate.school} • {candidate.region}
              </p>
            </div>
            <button
              onClick={() => navigate('/interviewer')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ✕ Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 p-4 rounded-lg text-white z-50 ${
            toast.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg border border-gray-200 p-4 sticky top-24">
              <p className="text-xs font-semibold text-gray-500 mb-4 uppercase">Navigasi</p>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('partA')}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'partA'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  A. Kualifikasi Wajib
                </button>
                <button
                  onClick={() => setActiveTab('partB')}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'partB'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  B. Kualifikasi Pendukung
                </button>
                <button
                  onClick={() => setActiveTab('partC')}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'partC'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  C. Catatan
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Part A: Kualifikasi Wajib */}
            {activeTab === 'partA' && (
              <div className="form-section">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  A. Kualifikasi Wajib (8 Indikator)
                </h3>
                <div className="space-y-4">
                  {partA.map((indicator) => (
                    <div
                      key={indicator.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <label className="flex-1 text-gray-900 font-medium">{indicator.label}</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePartAChange(indicator.id, true)}
                          className={`px-6 py-2 font-semibold rounded-lg transition-colors ${
                            indicator.value === true
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Ya
                        </button>
                        <button
                          onClick={() => handlePartAChange(indicator.id, false)}
                          className={`px-6 py-2 font-semibold rounded-lg transition-colors ${
                            indicator.value === false
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Part B: Kualifikasi Pendukung */}
            {activeTab === 'partB' && (
              <div className="space-y-6">
                {Object.entries(partBByAspect).map(([aspect, indicators]) => (
                  <div key={aspect} className="form-section">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">{aspect}</h4>
                    <div className="indicator-group">
                      {indicators.map((indicator) => (
                        <div key={indicator.id} className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-medium text-gray-900 mb-3">{indicator.label}</p>
                          <div className="flex gap-2">
                            {['yes', 'maybe', 'no'].map((option) => (
                              <button
                                key={option}
                                onClick={() =>
                                  updatePartB(indicator.id, option as 'yes' | 'maybe' | 'no')
                                }
                                className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-colors ${
                                  indicator.value === option
                                    ? option === 'yes'
                                      ? 'bg-green-600 text-white'
                                      : option === 'maybe'
                                        ? 'bg-yellow-600 text-white'
                                        : 'bg-red-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {option === 'yes' ? 'Ya (2)' : option === 'maybe' ? 'Ragu (1)' : 'Tidak (0)'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Part C: Catatan */}
            {activeTab === 'partC' && (
              <div className="form-section">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">C. Catatan Tambahan</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tulis catatan, observasi, atau hal penting lainnya tentang kandidat..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={12}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="floating-action-bar">
        <div className="max-w-7xl mx-auto px-6 flex justify-end gap-3">
          <button
            onClick={() => navigate('/interviewer')}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            Batal
          </button>
          {activeTab === 'partC' ? (
            <button
              onClick={handleSubmit}
              disabled={!isPartBComplete()}
              className={`px-8 py-2 font-semibold rounded-lg transition-colors text-white ${
                isPartBComplete()
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Submit Nilai
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={activeTab === 'partA' ? !isPartAComplete() : !isPartBComplete()}
              className={`px-8 py-2 font-semibold rounded-lg transition-colors text-white ${
                activeTab === 'partA'
                  ? isPartAComplete()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                  : isPartBComplete()
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Lanjut
            </button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && submittedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wawancara Selesai!</h2>
            <p className="text-gray-600 mb-6">Data tersimpan di browser</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
              <div>
                <p className="text-xs text-gray-500">Kandidat</p>
                <p className="font-semibold text-gray-900">{submittedResult.candidateName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tanggal</p>
                <p className="font-semibold text-gray-900">{submittedResult.interviewDate}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Part A (Wajib)</p>
                  <p className={`text-lg font-bold ${submittedResult.partAPass ? 'text-green-600' : 'text-red-600'}`}>
                    {submittedResult.partAPass ? 'LULUS' : 'TIDAK LULUS'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Part B (Skor)</p>
                  <p className="text-lg font-bold text-blue-600">
                    {submittedResult.partBTotal}/40
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false)
                  navigate('/interviewer')
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
