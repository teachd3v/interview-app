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
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [aspectNotes, setAspectNotes] = useState<Record<string, string>>({})
  const [uktValue, setUktValue] = useState('')
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
    updatePartA,
    updatePartB,
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

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  if (!candidate) return null

  // Get all unique sections from instruments (e.g. A. VERIFIKASI..., B. PRESENTASI...)
  const sections = [...new Set(instruments.map((i) => i.bagian))].sort()

  const getShortTitle = (bagian: string) => {
    if (bagian.startsWith('A')) return 'Wajib (A)'
    if (bagian.includes('PRESENTASI DIRI')) return 'Komunikasi (B.1)'
    if (bagian.includes('MOTIVASI')) return 'Motivasi (B.2)'
    if (bagian.includes('NILAI')) return 'Karakter (B.3)'
    if (bagian.includes('KESIAPAN HIDUP')) return 'Kesiapan (B.4)'
    return bagian.replace(/^[A-Z]\.\s+/, '')
  }

  const steps = [
    ...sections.map((sec, idx) => ({
      num: idx + 1,
      title: getShortTitle(sec),
      icon: sec.startsWith('A') ? '✓' : '★',
      type: 'section',
      sectionName: sec
    })),
    { num: sections.length + 1, title: 'Review', icon: '👁️', type: 'review', sectionName: '' }
  ]

  const stepConfig = steps.find((s) => s.num === currentStep)

  const isPartAComplete = () => partA.every((item) => item.value !== null && item.value !== '')

  // Disqualification logic is removed.
  const isPartAFailed = () => false

  const isCurrentStepComplete = () => {
    if (!stepConfig) return false
    if (stepConfig.type === 'section') {
      if (stepConfig.sectionName.toUpperCase().startsWith('A')) {
        return isPartAComplete()
      } else {
        const currentSectionPartB = partB.filter(item => item.bagian === stepConfig.sectionName)
        return currentSectionPartB.every(item => item.value !== null)
      }
    }
    return true
  }

  const handlePartAChange = (id: string, value: any) => {
    updatePartA(id, value)
  }

  const handleNext = () => {
    if (!stepConfig) return

    if (stepConfig.type === 'section') {
      if (stepConfig.sectionName.toUpperCase().startsWith('A')) {
        if (!isPartAComplete()) {
          setToast({
            message: 'Harap lengkapi semua verifikasi di bagian Wajib (A) terlebih dahulu',
            type: 'error',
          })
          return
        }
      } else {
        if (!isCurrentStepComplete()) {
          setToast({
            message: 'Harap lengkapi semua pertanyaan di step ini terlebih dahulu',
            type: 'error',
          })
          return
        }
      }
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep === 1) {
      navigate('/interviewer')
      return
    }
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = () => {
    const failedPartA = false

    if (!isPartAComplete()) {
      setToast({
        message: 'Harap lengkapi semua verifikasi di bagian Wajib (A) terlebih dahulu',
        type: 'error',
      })
      return
    }

    if (!isPartBComplete()) {
      setToast({
        message: 'Harap lengkapi seluruh pertanyaan evaluasi terlebih dahulu',
        type: 'error',
      })
      return
    }

    const partAPass = true

    const partBScores = partB.map((item) => {
      let score = 0
      const optionScore = parseInt(item.pilihan || '')
      if (!isNaN(optionScore)) {
        score = item.value === 'yes' ? optionScore : 0
      } else {
        score = item.value === 'yes' ? 2 : item.value === 'maybe' ? 1 : 0
      }
      return { ...item, score }
    })


    // Calculate maximum score dynamically based on questions
    const partBGroups = new Map<string, typeof partB>()
    partB.forEach((item) => {
      const q = item.pertanyaan || ''
      if (!partBGroups.has(q)) partBGroups.set(q, [])
      partBGroups.get(q)!.push(item)
    })

    let maxTotalScore = 0
    partBGroups.forEach((options) => {
      let maxQScore = 0
      options.forEach((opt) => {
        const optionScore = parseInt(opt.pilihan || '')
        if (!isNaN(optionScore)) {
          if (optionScore > maxQScore) maxQScore = optionScore
        } else {
          maxQScore = 2
        }
      })
      maxTotalScore += maxQScore
    })

    if (maxTotalScore === 0) maxTotalScore = 40

    const partBTotal = partBScores.reduce((sum, item) => sum + item.score, 0)
    const partBPercentage = (partBTotal / maxTotalScore) * 100

    const compiledAspectNotes = Object.entries(aspectNotes)
      .filter(([_, note]) => note.trim() !== '')
      .map(([aspect, note]) => `[Aspek: ${aspect}]\n${note}`)
      .join('\n\n')

    const uktPrefix = uktValue ? `[UKT: Rp ${uktValue}]\n\n` : ''
    const finalNotes = uktPrefix + compiledAspectNotes

    const result: any = {
      id: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      candidateId: candidateId || '',
      candidateName: candidate?.full_name || 'Unknown',
      interviewerId: interviewerId || '',
      scheduleId: scheduleId, // From schedule_candidates table
      interviewDate: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toISOString(),
      partA: partA.map((item) => {
        // Detect UKT item by pertanyaan or aspek keyword (not hardcoded 'a7' since IDs are now UUIDs)
        const isUktItem =
          item.pertanyaan?.toLowerCase().includes('ukt') ||
          item.label?.toLowerCase().includes('ukt') ||
          item.aspect?.toLowerCase().includes('besaran ukt')
        return {
          id: item.id,
          label: item.label,
          pertanyaan: item.pertanyaan,    // simpan agar bisa di-lookup
          aspect: item.aspect,            // simpan agar bisa di-lookup
          pilihan: item.pilihan,
          value: item.value,
          textValue: isUktItem ? uktValue : undefined,
        }
      }),
      partB: failedPartA ? partB.map(item => ({ ...item, value: 'no', score: 0 })) : partBScores,
      notes: finalNotes,
      partAPass,
      partBTotal: failedPartA ? 0 : partBTotal,
      partBPercentage: failedPartA ? 0 : partBPercentage,
    }

    addResult(result)
    setSubmittedResult(result)
    setShowSuccessModal(true)
    resetForm()
    setUktValue('')
    setAspectNotes({})
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
          <div className="flex justify-between items-center gap-1 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center flex-1 min-w-[100px]">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                      currentStep === step.num
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                        : currentStep > step.num
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.num ? '✓' : step.icon}
                  </div>
                  <p className="text-[10px] font-semibold text-gray-600 mt-2 text-center whitespace-nowrap">
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all ${
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
        <div className="bg-white rounded-lg border border-gray-200 p-8 min-h-[500px] flex flex-col justify-between">
          <div>
            {stepConfig && stepConfig.type === 'section' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">
                  {stepConfig.sectionName}
                </h2>

                {stepConfig.sectionName.startsWith('A') ? (
                  (() => {
                    const currentSectionPartA = partA.filter(item => item.bagian === stepConfig.sectionName)
                    const partAByAspect = currentSectionPartA.reduce(
                      (acc, item) => {
                        const aspectName = item.aspect || 'Umum'
                        if (!acc[aspectName]) acc[aspectName] = []
                        acc[aspectName].push(item)
                        return acc
                      },
                      {} as Record<string, typeof partA>
                    )

                    const formatRupiah = (val: string) => {
                      const clean = val.replace(/\D/g, '')
                      if (!clean) return ''
                      return new Intl.NumberFormat('id-ID').format(parseInt(clean))
                    }

                    return (
                      <div className="space-y-8">
                        {Object.entries(partAByAspect).map(([aspectName, indicators]) => (
                          <div key={aspectName} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm space-y-6">
                            <h3 className="text-md font-bold text-gray-900 border-l-4 border-blue-500 pl-3 py-1 mb-4 bg-blue-50/50 rounded-r">
                              {aspectName}
                            </h3>

                            <div className="space-y-4">
                              {indicators.map((indicator) => {
                                 const isUkt = indicator.pilihan === '-';
                                 const isA8 = indicator.id === 'a8' || indicator.pertanyaan?.toLowerCase().includes('bantuan/beasiswa') || indicator.label?.toLowerCase().includes('bantuan/beasiswa');
                                 const options = isUkt ? [] : (isA8 ? [
                                   'Ya, Diterima Beasiswa',
                                   'Ya, Sedang Mendaftar Beasiswa',
                                   'Tidak Mendaftar dan Menerima Beasiswa'
                                 ] : (indicator.pilihan || 'Ya; Tidak').split(';').map(o => o.trim()));
                                 const isStandardBoolean = !isA8 && options.length === 2 && (options.includes('Ya') || options.includes('Sesuai'));


                                return (
                                  <div key={indicator.id} className="p-4 bg-gray-50 rounded-xl border border-gray-150">
                                    {indicator.pertanyaan && (
                                      <h4 className="text-xs font-bold text-gray-800 mb-2">{indicator.pertanyaan}</h4>
                                    )}
                                    <p className="text-xs text-gray-600 mb-4">{indicator.label}</p>
                                    
                                    <div className="flex gap-2 justify-end flex-wrap">
                                      {isUkt ? (
                                        <div className="w-full max-w-xs flex gap-2 items-center">
                                          <span className="text-xs text-gray-600 font-medium">Rp</span>
                                          <input
                                            type="text"
                                            placeholder="Jumlah UKT dalam Rupiah..."
                                            value={uktValue}
                                            onChange={(e) => {
                                              const formatted = formatRupiah(e.target.value);
                                              setUktValue(formatted);
                                              handlePartAChange(indicator.id, formatted);
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                          />
                                        </div>
                                      ) : (
                                        options.map((opt) => {
                                          let isSelected = false;
                                          let onClickHandler = () => {};
                                          let activeColor = 'bg-blue-600 text-white';

                                          if (isStandardBoolean) {
                                            const isPositive = opt !== 'Tidak' && opt !== 'Tidak Sesuai';
                                            isSelected = indicator.value === isPositive;
                                            onClickHandler = () => handlePartAChange(indicator.id, isPositive);
                                            activeColor = isPositive ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
                                          } else {
                                            isSelected = indicator.value === opt;
                                            onClickHandler = () => handlePartAChange(indicator.id, opt);
                                            activeColor = 'bg-blue-600 text-white';
                                          }


                                          return (
                                            <button
                                              key={opt}
                                              onClick={onClickHandler}
                                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                                isSelected
                                                  ? activeColor
                                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                              }`}
                                            >
                                              {opt}
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Aspect Notes input for Part A */}
                            <div className="mt-4 pt-4 border-t border-gray-150">
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                📝 Catatan untuk Aspek: {aspectName}
                              </label>
                              <textarea
                                value={aspectNotes[aspectName] || ''}
                                onChange={(e) => setAspectNotes(prev => ({ ...prev, [aspectName]: e.target.value }))}
                                placeholder={`Tulis catatan observasi khusus untuk aspek ${aspectName} di sini...`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-sans"
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()
                ) : (
                  (() => {
                    const currentSectionPartB = partB.filter(item => item.bagian === stepConfig.sectionName)
                    const currentSectionPartBByAspect = currentSectionPartB.reduce(
                      (acc, item) => {
                        const aspectName = item.aspect || 'Umum'
                        if (!acc[aspectName]) acc[aspectName] = []
                        acc[aspectName].push(item)
                        return acc
                      },
                      {} as Record<string, typeof partB>
                    )

                    return (
                      <div className="space-y-8">
                        {Object.entries(currentSectionPartBByAspect).map(([aspect, indicators]) => {
                          const groupedQuestions: Record<string, typeof indicators> = {};
                          const ungrouped: typeof indicators = [];
                          
                          indicators.forEach((ind) => {
                            if (ind.pertanyaan) {
                              if (!groupedQuestions[ind.pertanyaan]) groupedQuestions[ind.pertanyaan] = [];
                              groupedQuestions[ind.pertanyaan].push(ind);
                            } else {
                              ungrouped.push(ind);
                            }
                          });

                          return (
                            <div key={aspect} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm space-y-6">
                              <h3 className="text-md font-bold text-gray-900 border-l-4 border-blue-500 pl-3 py-1 mb-4 bg-blue-50/50 rounded-r">
                                {aspect}
                              </h3>
                              
                              <div className="space-y-4">
                                {Object.entries(groupedQuestions).map(([qText, options]) => {
                                  return (
                                    <div key={qText} className="p-4 bg-gray-50 rounded-xl border border-gray-155 space-y-3">
                                      <h4 className="text-xs font-bold text-gray-800">{qText}</h4>
                                      
                                      <div className="grid grid-cols-1 gap-2">
                                        {options.sort((a, b) => parseInt(b.pilihan || '0') - parseInt(a.pilihan || '0')).map((option) => {
                                          const isSelected = option.value === 'yes';
                                          return (
                                            <button
                                              key={option.id}
                                              onClick={() => updatePartB(option.id)}
                                              className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-2.5 ${
                                                isSelected
                                                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-100'
                                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                                              }`}
                                            >
                                              <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                                isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                                              }`}>
                                                {isSelected && <span className="text-[10px]">✓</span>}
                                              </div>
                                              <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-900">{option.label}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">Skor Opsi: {option.pilihan}</p>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}

                                {ungrouped.map((indicator) => (
                                  <div key={indicator.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-xs font-semibold text-gray-800 mb-2">{indicator.label}</p>
                                    <div className="flex gap-2">
                                      {[
                                        { val: 'yes', label: 'Ya (2)', color: 'green' },
                                        { val: 'maybe', label: 'Ragu (1)', color: 'yellow' },
                                        { val: 'no', label: 'Tidak (0)', color: 'red' },
                                      ].map(({ val, label, color }) => (
                                        <button
                                          key={val}
                                          onClick={() => updatePartB(indicator.id)}
                                          className={`flex-1 py-1.5 text-[10px] font-semibold rounded transition-colors ${
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

                              {/* Aspect Notes input */}
                              <div className="mt-4 pt-4 border-t border-gray-150">
                                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                                  📝 Catatan untuk Aspek: {aspect}
                                </label>
                                <textarea
                                  value={aspectNotes[aspect] || ''}
                                  onChange={(e) => setAspectNotes(prev => ({ ...prev, [aspect]: e.target.value }))}
                                  placeholder={`Tulis catatan observasi khusus untuk aspek ${aspect} di sini...`}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none font-sans"
                                  rows={2}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  })()
                )}
              </div>
            )}

            {stepConfig && stepConfig.type === 'review' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">Review Hasil Wawancara</h2>
                <div className="space-y-6">
                  {sections.map((secName) => {
                    const isPartASection = secName.startsWith('A')
                    if (isPartASection) {
                      const currentSectionPartA = partA.filter(item => item.bagian === secName)
                      const partAByAspect = currentSectionPartA.reduce(
                        (acc, item) => {
                          const aspectName = item.aspect || 'Umum'
                          if (!acc[aspectName]) acc[aspectName] = []
                          acc[aspectName].push(item)
                          return acc
                        },
                        {} as Record<string, typeof partA>
                      )

                      return (
                        <div key={secName} className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                          <h3 className="font-bold text-gray-900 border-b pb-2 text-sm uppercase tracking-wider text-blue-600">
                            {secName}
                          </h3>
                          {Object.entries(partAByAspect).map(([aspectName, items]) => (
                            <div key={aspectName} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                              <h4 className="font-bold text-gray-800 text-xs">{aspectName}</h4>
                              <div className="space-y-2">
                                {items.map((item) => (
                                  <div key={item.id} className="flex justify-between items-start gap-4 text-xs">
                                    <span className="text-gray-600">{item.pertanyaan || item.label}</span>
                                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                      item.value === true || (typeof item.value === 'string' && item.value !== '')
                                        ? 'bg-green-100 text-green-700'
                                        : item.value === false
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {typeof item.value === 'boolean'
                                        ? (item.value ? 'Ya / Sesuai' : 'Tidak / Tidak Sesuai')
                                        : (item.value || '-')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {aspectNotes[aspectName] && (
                                <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                                  <span className="font-semibold text-gray-700">Catatan: </span>
                                  <span className="text-gray-600 italic">{aspectNotes[aspectName]}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    } else {
                      const currentSectionPartB = partB.filter(item => item.bagian === secName)
                      const partBByAspect = currentSectionPartB.reduce(
                        (acc, item) => {
                          const aspectName = item.aspect || 'Umum'
                          if (!acc[aspectName]) acc[aspectName] = []
                          acc[aspectName].push(item)
                          return acc
                        },
                        {} as Record<string, typeof partB>
                      )

                      return (
                        <div key={secName} className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                          <h3 className="font-bold text-gray-900 border-b pb-2 text-sm uppercase tracking-wider text-blue-600">
                            {secName}
                          </h3>
                          {Object.entries(partBByAspect).map(([aspectName, items]) => {
                            return (
                              <div key={aspectName} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                                <h4 className="font-bold text-gray-800 text-xs">{aspectName}</h4>
                                <div className="space-y-2">
                                  {items.map((item) => {
                                    const isSelected = item.value === 'yes'
                                    if (!isSelected) return null
                                    return (
                                      <div key={item.id} className="flex justify-between items-start gap-4 text-xs bg-blue-50/30 p-2 rounded">
                                        <span className="text-gray-700 font-medium">{item.pertanyaan || item.label}</span>
                                        <div className="text-right">
                                          <span className="font-semibold text-blue-600 block text-[11px]">{item.label}</span>
                                          <span className="text-[10px] text-gray-500">Skor: {item.pilihan}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                                {aspectNotes[aspectName] && (
                                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
                                    <span className="font-semibold text-gray-700">Catatan: </span>
                                    <span className="text-gray-600 italic">{aspectNotes[aspectName]}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    }
                  })}

                  {/* Summary Box */}
                  <div className="bg-gray-900 text-white rounded-xl p-6 space-y-4">
                    <h3 className="font-bold border-b border-gray-750 pb-2 text-sm uppercase tracking-wider text-blue-400">
                      Ringkasan Evaluasi
                    </h3>
                    
                    {(() => {
                      const getPartBScore = (item: typeof partB[0]) => {
                        const optionScore = parseInt(item.pilihan || '')
                        if (!isNaN(optionScore)) {
                          return item.value === 'yes' ? optionScore : 0
                        }
                        return item.value === 'yes' ? 2 : item.value === 'maybe' ? 1 : 0
                      }

                      const partBTotalScore = partB.reduce((sum, item) => sum + getPartBScore(item), 0)
                      
                      const partBGroups = new Map<string, typeof partB>()
                      partB.forEach((item) => {
                        const q = item.pertanyaan || ''
                        if (!partBGroups.has(q)) partBGroups.set(q, [])
                        partBGroups.get(q)!.push(item)
                      })

                      let maxTotalScore = 0
                      partBGroups.forEach((options) => {
                        let maxQScore = 0
                        options.forEach((opt) => {
                          const optionScore = parseInt(opt.pilihan || '')
                          if (!isNaN(optionScore)) {
                            if (optionScore > maxQScore) maxQScore = optionScore
                          } else {
                            maxQScore = 2
                          }
                        })
                        maxTotalScore += maxQScore
                      })

                      if (maxTotalScore === 0) maxTotalScore = 40
                      const percentageVal = Math.min(100, Math.round((partBTotalScore / maxTotalScore) * 100))

                      const failedPartA = isPartAFailed()

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Status Kelayakan Wajib</p>
                            <p className={`text-lg font-extrabold mt-1 ${
                              !failedPartA ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {!failedPartA ? 'LULUS VERIFIKASI' : 'TIDAK LAYAK (FAIL)'}
                            </p>
                          </div>
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Total Poin Evaluasi</p>
                            <p className="text-lg font-bold text-gray-100 mt-1">
                              {failedPartA ? 0 : partBTotalScore}/{maxTotalScore}
                            </p>
                          </div>
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Skor Persentase</p>
                            <p className="text-lg font-bold text-blue-400 mt-1">
                              {failedPartA ? 0 : percentageVal}/100
                            </p>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 mt-8 pt-6 border-t border-gray-150">
            <button
              onClick={currentStep === 1 ? () => navigate('/interviewer') : handlePrev}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
            >
              {currentStep === 1 ? 'Batal' : 'Kembali'}
            </button>

            <div className="flex gap-3">
              {currentStep < steps.length && !isPartAFailed() ? (
                <button
                  onClick={handleNext}
                  disabled={!isCurrentStepComplete()}
                  className={`px-8 py-2 font-semibold rounded-lg transition-colors text-sm text-white ${
                    !isCurrentStepComplete()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Lanjut
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={currentStep === 1 && !isPartAComplete()}
                  className={`px-8 py-2 font-semibold rounded-lg transition-colors text-sm text-white ${
                    currentStep === 1 && !isPartAComplete()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Submit Nilai
                </button>
              )}
            </div>
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
