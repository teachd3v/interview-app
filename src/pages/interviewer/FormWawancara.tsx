import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { useAuthStore } from '../../store/authStore'
import { useFormStore } from '../../store/formStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useFormResultsStore, FormResult } from '../../store/formResultsStore'
import { useInstrumentStore } from '../../store/instrumentStore'

export default function FormWawancara() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const { interviewerId, interviewerName, role } = useAuthStore((state) => ({ 
    interviewerId: state.interviewerId,
    interviewerName: state.interviewerName,
    role: state.role
  }))

  // Form state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [currentAspectIndex, setCurrentAspectIndex] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittedResult, setSubmittedResult] = useState<FormResult | null>(null)
  const [scheduleId, setScheduleId] = useState<string | null>(null)

  // Timer state
  const [timerStarted, setTimerStarted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(20 * 60) // 20 minutes in seconds

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
  const addResult = useFormResultsStore((state) => state.addResult)

  const instruments = useInstrumentStore((state) => state.instruments)

  useEffect(() => {
    useCandidateStore.getState().loadFromSupabase()
    useInstrumentStore.getState().loadFromSupabase()

    // Fetch schedule_id dari schedule_candidates table
    const fetchScheduleId = async () => {
      if (!candidateId) return

      try {
        const { supabase } = await import('../../lib/supabase')
        const { data, error } = await supabase
          .from('schedule_candidates')
          .select('schedule_id')
          .eq('candidate_id', candidateId)
          .single()

        if (error) {
          console.error('Could not find schedule for candidate:', error.message)
          setScheduleId(null)
          return
        }

        if (data) {
          setScheduleId(data.schedule_id)
        }
      } catch (error) {
        console.warn('Error fetching schedule_id:', error)
        setScheduleId(null)
      }
    }

    fetchScheduleId()
  }, [candidateId])

  useEffect(() => {
    if (instruments.length > 0) {
      initializeFromInstruments(instruments)
    }
  }, [instruments, initializeFromInstruments])

  // Timer countdown effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (timerStarted && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && timerStarted) {
      setToast({
        message: 'Waktu 20 menit telah habis!',
        type: 'warning',
      })
    }
    return () => clearInterval(interval)
  }, [timerStarted, timeRemaining])

  const candidate = candidates.find((c) => c.id === candidateId)

  useEffect(() => {
    if (!candidate) {
      navigate('/interviewer')
    }
  }, [candidate, navigate])

  if (!candidate) return null

  // Get Part B instruments grouped by aspect (moved early so it can be used in helper functions)
  const partBByAspect = partB.reduce(
    (acc, item) => {
      if (!acc[item.aspect]) acc[item.aspect] = []
      acc[item.aspect].push(item)
      return acc
    },
    {} as Record<string, typeof partB>
  )

  const isPartAComplete = () => partA.every((item) => item.value !== null)

  // Check if Part A has any "Tidak" (false) answers
  const isPartAFailed = () => partA.some((item) => item.value === false)

  // Get current aspect and check if it's complete
  const aspectKeys = Object.keys(partBByAspect)
  const currentAspect = aspectKeys[currentAspectIndex]
  const currentAspectIndicators = currentAspect ? partBByAspect[currentAspect] : []
  const isCurrentAspectComplete = () => currentAspectIndicators.every((item) => item.value !== null)

  const handlePartAChange = (id: string, value: boolean) => {
    updatePartA(id, value)
    if (!value) {
      setToast({
        message: 'Perhatian: Kandidat otomatis tidak lolos karena tidak memenuhi kualifikasi wajib.',
        type: 'warning',
      })
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!isPartAComplete()) {
        setToast({
          message: 'Harap lengkapi semua pertanyaan di Step 1 terlebih dahulu',
          type: 'error',
        })
        return
      }

      // Check if Part A has any "Tidak" (failed)
      if (isPartAFailed()) {
        // Set all Part B answers to 'no' (0 score)
        partB.forEach((item) => {
          updatePartB(item.id, 'no')
        })
        // Skip directly to Review (Step 4)
        setCurrentStep(4)
        setToast({
          message: '⚠️ Kandidat tidak lulus kualifikasi wajib. Lanjut ke review dengan skor 0/0.',
          type: 'warning',
        })
        return
      }

      setCurrentStep(2)
      setCurrentAspectIndex(0)
    } else if (currentStep === 2) {
      const aspectKeys = Object.keys(partBByAspect)
      if (currentAspectIndex < aspectKeys.length - 1) {
        setCurrentAspectIndex(currentAspectIndex + 1)
      } else {
        if (!isPartBComplete()) {
          setToast({
            message: 'Harap lengkapi semua pertanyaan di Step 2 terlebih dahulu',
            type: 'error',
          })
          return
        }
        setCurrentStep(3)
      }
    } else if (currentStep === 3) {
      setCurrentStep(4)
    }
  }

  const handlePrev = () => {
    if (currentStep === 2 && currentAspectIndex > 0) {
      setCurrentAspectIndex(currentAspectIndex - 1)
    } else if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4)
      if (currentStep === 3) {
        setCurrentAspectIndex(Object.keys(partBByAspect).length - 1)
      }
    }
  }

  const handleSubmit = () => {
    if (!isPartBComplete()) {
      setToast({
        message: 'Harap lengkapi semua pertanyaan terlebih dahulu',
        type: 'error',
      })
      return
    }

    const partAPass = partA.every((item) => item.value === true)

    const partBScores = partB.map((item) => {
      const score = item.value === 'yes' ? 2 : item.value === 'maybe' ? 1 : 0
      return { ...item, score }
    })
    const partBTotal = partBScores.reduce((sum, item) => sum + item.score, 0)
    const partBPercentage = (partBTotal / 40) * 100

    const result: any = {
      id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      candidateId: candidateId || '',
      candidateName: candidate?.full_name || 'Unknown',
      interviewerId: interviewerId || '',
      scheduleId: scheduleId, // From schedule_candidates table
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

    addResult(result)
    setSubmittedResult(result)
    setShowSuccessModal(true)
    resetForm()
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Export hasil ke Excel
  const handleExportExcel = () => {
    if (!submittedResult) return

    const dataToExport = [
      ['HASIL WAWANCARA'],
      [],
      ['Informasi Kandidat'],
      ['Nama:', submittedResult.candidateName],
      ['ID Kandidat:', submittedResult.candidateId],
      ['Tanggal Wawancara:', submittedResult.interviewDate],
      ['Pewawancara ID:', submittedResult.interviewerId],
      [],
      ['KUALIFIKASI WAJIB (Part A)'],
      ...submittedResult.partA.map((item) => [
        item.label,
        item.value ? 'Ya' : 'Tidak',
      ]),
      ['Status Part A:', submittedResult.partAPass ? 'LULUS' : 'TIDAK LULUS'],
      [],
      ['KUALIFIKASI PENDUKUNG (Part B)'],
      ...submittedResult.partB.map((item) => [
        item.label,
        item.value === 'yes' ? 'Ya (2)' : item.value === 'maybe' ? 'Ragu (1)' : 'Tidak (0)',
        item.score,
      ]),
      ['Total Skor Part B:', `${submittedResult.partBTotal}/40`],
      ['Persentase:', `${submittedResult.partBPercentage.toFixed(2)}%`],
      [],
      ['CATATAN TAMBAHAN'],
      [submittedResult.notes || '(Tidak ada catatan)'],
    ]

    const ws = XLSX.utils.aoa_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Wawancara')

    // Auto-size columns
    ws['!cols'] = [{ wch: 35 }, { wch: 30 }, { wch: 10 }]

    const fileName = `Hasil_Wawancara_${submittedResult.candidateName.replace(/\s+/g, '_')}_${submittedResult.interviewDate}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // Step titles
  const steps = [
    { num: 1, title: 'Kualifikasi Wajib', icon: '✓' },
    { num: 2, title: 'Kualifikasi Pendukung', icon: '★' },
    { num: 3, title: 'Catatan', icon: '📝' },
    { num: 4, title: 'Review', icon: '👁️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.full_name}</h1>
            <div className="flex flex-col">
              <p className="text-sm text-gray-600">{candidate.school} • {candidate.region}</p>
              <p className="text-xs text-blue-600 font-bold mt-1 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded inline-block w-fit">
                👤 Penilai: {interviewerName} ({role})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Timer */}
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold font-mono ${timeRemaining <= 300 && timerStarted ? 'text-red-600' : 'text-blue-600'}`}>
                ⏱️ {formatTime(timeRemaining)}
              </div>
              {!timerStarted ? (
                <button
                  onClick={() => setTimerStarted(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm"
                >
                  Mulai
                </button>
              ) : (
                <button
                  onClick={() => setTimerStarted(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg text-sm"
                >
                  Pause
                </button>
              )}
            </div>
            <button
              onClick={() => navigate('/interviewer')}
              className="text-gray-600 hover:text-gray-900 font-medium text-sm"
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

      {/* Stepper */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                      currentStep === step.num
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                        : currentStep > step.num
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.num ? '✓' : step.icon}
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-2 text-center whitespace-nowrap">
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.num ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 min-h-[500px] flex flex-col">
          {/* Step 1: Part A */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Kualifikasi Wajib (8 Indikator)</h2>
              <div className="space-y-3 flex-1">
                {partA.map((indicator) => (
                  <div key={indicator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <label className="flex-1 text-sm font-medium text-gray-900">{indicator.label}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePartAChange(indicator.id, true)}
                        className={`px-4 py-1 text-sm font-semibold rounded transition-colors ${
                          indicator.value === true
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Ya
                      </button>
                      <button
                        onClick={() => handlePartAChange(indicator.id, false)}
                        className={`px-4 py-1 text-sm font-semibold rounded transition-colors ${
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

          {/* Step 2: Part B with Aspect Sub-Stepper */}
          {currentStep === 2 && (
            <div className="flex flex-col h-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Kualifikasi Pendukung - Aspek per Aspek</h2>

              {/* Aspect Sub-Stepper */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Object.entries(partBByAspect).map(([aspect], index) => (
                    <button
                      key={aspect}
                      onClick={() => setCurrentAspectIndex(index)}
                      className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-all ${
                        currentAspectIndex === index
                          ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {aspect}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {currentAspectIndex + 1} dari {Object.entries(partBByAspect).length} aspek
                </p>
              </div>

              {/* Current Aspect Content */}
              <div className="flex-1">
                {Object.entries(partBByAspect).map(([aspect, indicators], index) => (
                  index === currentAspectIndex && (
                    <div key={aspect}>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{aspect}</h3>
                      <div className="space-y-3">
                        {indicators.map((indicator) => (
                          <div key={indicator.id} className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 mb-3">{indicator.label}</p>
                            <div className="flex gap-2">
                              {[
                                { val: 'yes', label: 'Ya (2)', color: 'green' },
                                { val: 'maybe', label: 'Ragu (1)', color: 'yellow' },
                                { val: 'no', label: 'Tidak (0)', color: 'red' },
                              ].map(({ val, label, color }) => (
                                <button
                                  key={val}
                                  onClick={() => updatePartB(indicator.id, val as 'yes' | 'maybe' | 'no')}
                                  className={`flex-1 py-2 text-xs font-semibold rounded transition-colors ${
                                    indicator.value === val
                                      ? `bg-${color}-600 text-white`
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Notes */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Catatan Tambahan</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tulis catatan, observasi, atau hal penting lainnya tentang kandidat..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none flex-1"
                rows={10}
              />
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Review Hasil Wawancara</h2>
              <div className="space-y-6 flex-1">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Kualifikasi Wajib (Part A)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {partA.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        {item.value === true ? (
                          <span className="text-green-600 font-bold">✓</span>
                        ) : (
                          <span className="text-red-600 font-bold">✗</span>
                        )}
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                      partA.every(x => x.value === true) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {partA.every(x => x.value === true) ? '✓ LULUS' : '✗ TIDAK LULUS'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Kualifikasi Pendukung (Part B)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Poin Mentah</p>
                      <p className="text-2xl font-bold text-gray-500">
                        {partB.reduce((sum, item) => sum + (item.value === 'yes' ? 2 : item.value === 'maybe' ? 1 : 0), 0)}/40
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Skor Akhir</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round((partB.reduce((sum, item) => sum + (item.value === 'yes' ? 2 : item.value === 'maybe' ? 1 : 0), 0) / 40) * 100)}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Status</p>
                      <p className={`text-lg font-bold ${
                        partB.reduce((sum, item) => sum + (item.value === 'yes' ? 2 : item.value === 'maybe' ? 1 : 0), 0) >= 20 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {partB.reduce((sum, item) => sum + (item.value === 'yes' ? 2 : item.value === 'maybe' ? 1 : 0), 0) >= 20 ? 'Baik' : 'Perlu Evaluasi'}
                      </p>
                    </div>
                  </div>
                </div>

                {notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Catatan</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3 mt-6">
          <button
            onClick={currentStep === 1 ? () => navigate('/interviewer') : handlePrev}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
          >
            {currentStep === 1 ? 'Batal' : 'Kembali'}
          </button>

          <div className="flex gap-3">
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !isPartAComplete()) ||
                  (currentStep === 2 && !isCurrentAspectComplete())
                }
                className={`px-8 py-2 font-semibold rounded-lg transition-colors text-white ${
                  (currentStep === 1 && !isPartAComplete()) || (currentStep === 2 && !isCurrentAspectComplete())
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {currentStep === 2 && currentAspectIndex < Object.keys(partBByAspect).length - 1
                  ? 'Aspek Berikutnya'
                  : currentStep === 2
                  ? 'Selesai Part B'
                  : 'Lanjut'}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                Submit Nilai
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && submittedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wawancara Selesai!</h2>
            <p className="text-gray-600 mb-6">Data tersimpan di Supabase</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3">
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
                  <p className="text-xs text-gray-500">Skor (0-100)</p>
                  <p className="text-lg font-bold text-blue-600">{submittedResult.partBPercentage.toFixed(1)}/100</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportExcel}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                📥 Export Excel
              </button>
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
