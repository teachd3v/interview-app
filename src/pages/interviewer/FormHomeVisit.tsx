import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { useAuthStore } from '../../store/authStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useHomeVisitStore } from '../../store/homeVisitStore'
import { homeVisitInstrument } from '../../lib/homeVisitInstrument'

export default function FormHomeVisit() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const { interviewerId, interviewerName } = useAuthStore((state) => ({ 
    interviewerId: state.interviewerId,
    interviewerName: state.interviewerName
  }))

  // Form state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'error' } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Answers state
  const [partAAnswers, setPartAAnswers] = useState<Record<string, boolean | null>>({})
  const [partBAnswers, setPartBAnswers] = useState<Record<string, number | null>>({})
  const [partCAnswers, setPartCAnswers] = useState<Record<string, number | null>>({})
  
  // Qualitative Notes state
  const [partANotes, setPartANotes] = useState<Record<string, string>>({})
  const [partBNotes, setPartBNotes] = useState<Record<string, string>>({})
  const [partCNotes, setPartCNotes] = useState<Record<string, string>>({})
  
  // Photo Evidence state
  type PhotoState = { file: File | null; preview: string | null }
  const [fotoVisit, setFotoVisit] = useState<PhotoState>({ file: null, preview: null })
  const [fotoOrtu, setFotoOrtu] = useState<PhotoState>({ file: null, preview: null })
  const [fotoPeserta, setFotoPeserta] = useState<PhotoState>({ file: null, preview: null })

  const [fotoDepan, setFotoDepan] = useState<PhotoState>({ file: null, preview: null })
  const [fotoDalam, setFotoDalam] = useState<PhotoState>({ file: null, preview: null })
  const [fotoBelakang, setFotoBelakang] = useState<PhotoState>({ file: null, preview: null })
  
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({})
  const [generalNotes, setGeneralNotes] = useState('')

  const candidates = useCandidateStore((state) => state.candidates)
  const addResult = useHomeVisitStore((state) => state.addResult)

  useEffect(() => {
    useCandidateStore.getState().loadFromSupabase()
    
    // Check for existing results to pre-populate (Edit Mode)
    const existingResult = useHomeVisitStore.getState().results.find(r => r.candidateId === candidateId)
    
    // Initialize answers and notes
    const initialA: Record<string, boolean | null> = {}
    const initialB: Record<string, number | null> = {}
    const initialC: Record<string, number | null> = {}
    const initialANotes: Record<string, string> = {}
    const initialBNotes: Record<string, string> = {}
    const initialCNotes: Record<string, string> = {}
    
    homeVisitInstrument.forEach(q => {
      if (q.section === 'A') {
        const existing = existingResult?.partAResults.find(r => r.id === q.id)
        initialA[q.id] = existing ? existing.value : null
        initialANotes[q.id] = existing?.note || ''
      }
      else if (q.section === 'B') {
        const existing = existingResult?.partBResults.find(r => r.id === q.id)
        initialB[q.id] = existing ? existing.score : null
        initialBNotes[q.id] = existing?.note || ''
      }
      else if (q.section === 'C') {
        const existing = existingResult?.partCResults.find(r => r.id === q.id)
        initialC[q.id] = existing ? existing.score : null
        initialCNotes[q.id] = existing?.note || ''
      }
    })
    
    setPartAAnswers(initialA)
    setPartBAnswers(initialB)
    setPartCAnswers(initialC)
    setPartANotes(initialANotes)
    setPartBNotes(initialBNotes)
    setPartCNotes(initialCNotes)

    if (existingResult) {
      setGeneralNotes(existingResult.notes || '')
      
      // Load existing photos into preview
      const getUrl = (results: any[], id: string) => results.find(r => r.id === id)?.evidenceUrls?.[0]
      
      const urlVisit = getUrl(existingResult.partAResults, 'foto_visit')
      const urlOrtu = getUrl(existingResult.partAResults, 'foto_ortu')
      const urlPeserta = getUrl(existingResult.partAResults, 'foto_peserta')
      
      const urlDepan = getUrl(existingResult.partBResults, 'foto_depan')
      const urlDalam = getUrl(existingResult.partBResults, 'foto_dalam')
      const urlBelakang = getUrl(existingResult.partBResults, 'foto_belakang')

      if (urlVisit) setFotoVisit({ file: null, preview: urlVisit })
      if (urlOrtu) setFotoOrtu({ file: null, preview: urlOrtu })
      if (urlPeserta) setFotoPeserta({ file: null, preview: urlPeserta })
      if (urlDepan) setFotoDepan({ file: null, preview: urlDepan })
      if (urlDalam) setFotoDalam({ file: null, preview: urlDalam })
      if (urlBelakang) setFotoBelakang({ file: null, preview: urlBelakang })
      
      setUploadedUrls({
        visit: urlVisit || '',
        ortu: urlOrtu || '',
        peserta: urlPeserta || '',
        depan: urlDepan || '',
        dalam: urlDalam || '',
        belakang: urlBelakang || ''
      })
    }
  }, [candidateId])

  const candidate = candidates.find((c) => c.id === candidateId)

  useEffect(() => {
    if (!candidate && candidates.length > 0) {
      navigate('/interviewer')
    }
  }, [candidate, candidates, navigate])

  if (!candidate) return null

  const questionsA = homeVisitInstrument.filter(q => q.section === 'A')
  const questionsB = homeVisitInstrument.filter(q => q.section === 'B')
  const questionsC = homeVisitInstrument.filter(q => q.section === 'C')

  const isStep1Complete = () => questionsA.every(q => partAAnswers[q.id] !== null)
  const isStep2Complete = () => questionsB.every(q => partBAnswers[q.id] !== null)
  const isStep3Complete = () => questionsC.every(q => partCAnswers[q.id] !== null)

  const handlePhotoChange = (file: File | null, setter: React.Dispatch<React.SetStateAction<PhotoState>>) => {
    if (!file) return;
    
    // Validasi: Format & Ukuran (5MB)
    const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)
    if (!isValidType) {
      setToast({ message: 'Format file harus JPG/PNG/WEBP', type: 'error' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Ukuran file maksimal 5MB', type: 'error' })
      return
    }

    setter(prev => {
      if (prev.preview) URL.revokeObjectURL(prev.preview)
      return {
        file,
        preview: URL.createObjectURL(file)
      }
    })
  }

  const uploadSingleFile = async (file: File | null, prefix: string) => {
    if (!file) return null
    const { supabase } = await import('../../lib/supabase')
    const fileExt = file.name.split('.').pop()
    const fileName = `${candidateId}/${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('home_visit_evidence')
      .upload(fileName, file)

    if (uploadError) {
      console.error(`Error uploading ${prefix}:`, uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('home_visit_evidence')
      .getPublicUrl(fileName)
    
    return publicUrl
  }

  const handleNext = () => {
    if (currentStep === 1 && !isStep1Complete()) {
      setToast({ message: 'Harap lengkapi semua pertanyaan Bagian A', type: 'error' })
      return
    }
    if (currentStep === 2 && !isStep2Complete()) {
      setToast({ message: 'Harap lengkapi semua pertanyaan Bagian B', type: 'error' })
      return
    }
    if (currentStep === 3 && !isStep3Complete()) {
      setToast({ message: 'Harap lengkapi semua pertanyaan Bagian C', type: 'error' })
      return
    }
    setCurrentStep((prev) => (prev + 1) as any)
    setToast(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePrev = () => {
    setCurrentStep((prev) => (prev - 1) as any)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const calculateResults = () => {
    const partAPass = questionsA.every(q => partAAnswers[q.id] === true)
    
    const partBResults = questionsB.map(q => ({
      id: q.id,
      label: q.indicator,
      aspect: q.aspect,
      score: partBAnswers[q.id] || 0,
      note: partBNotes[q.id]
    }))
    
    const partCResults = questionsC.map(q => ({
      id: q.id,
      label: q.indicator,
      aspect: q.aspect,
      score: partCAnswers[q.id] || 0,
      note: partCNotes[q.id]
    }))
    
    const totalScore = [...partBResults, ...partCResults].reduce((sum, r) => sum + r.score, 0)
    const percentage = (totalScore / 40) * 100
    
    let recommendationStatus = 'Disarankan'
    if (percentage < 71) recommendationStatus = 'Tidak Disarankan'
    else if (percentage < 86) recommendationStatus = 'Dipertimbangkan'
    
    return { partAPass, partBResults, partCResults, totalScore, percentage, recommendationStatus }
  }

  const handleSubmit = async () => {
    try {
      setIsUploading(true)
      const results = calculateResults()
      
      // 1. Upload new photos or reuse existing URLs
      const urlVisit = fotoVisit.file ? await uploadSingleFile(fotoVisit.file, 'foto_visit') : uploadedUrls.visit
      const urlOrtu = fotoOrtu.file ? await uploadSingleFile(fotoOrtu.file, 'foto_ortu') : uploadedUrls.ortu
      const urlPeserta = fotoPeserta.file ? await uploadSingleFile(fotoPeserta.file, 'foto_peserta') : uploadedUrls.peserta
      
      const urlDepan = fotoDepan.file ? await uploadSingleFile(fotoDepan.file, 'foto_depan') : uploadedUrls.depan
      const urlDalam = fotoDalam.file ? await uploadSingleFile(fotoDalam.file, 'foto_dalam') : uploadedUrls.dalam
      const urlBelakang = fotoBelakang.file ? await uploadSingleFile(fotoBelakang.file, 'foto_belakang') : uploadedUrls.belakang

      // Update local storage for Excel Export
      const finalUrls = {
        visit: urlVisit || '',
        ortu: urlOrtu || '',
        peserta: urlPeserta || '',
        depan: urlDepan || '',
        dalam: urlDalam || '',
        belakang: urlBelakang || ''
      }
      setUploadedUrls(finalUrls)

      // 2. Prepare Part A Results
      const partAResults = questionsA.map((q) => ({
        id: q.id,
        label: q.indicator,
        value: partAAnswers[q.id] || false,
        note: partANotes[q.id]
      }))

      // Inject General Photos into Part A
      if (urlVisit) partAResults.push({ id: 'foto_visit', label: 'Foto saat Home Visit', value: true, evidenceUrls: [urlVisit] } as any)
      if (urlOrtu) partAResults.push({ id: 'foto_ortu', label: 'Foto bersama orang tua peserta', value: true, evidenceUrls: [urlOrtu] } as any)
      if (urlPeserta) partAResults.push({ id: 'foto_peserta', label: 'Foto bersama peserta', value: true, evidenceUrls: [urlPeserta] } as any)

      // 3. Prepare Part B Results
      const partBResults = questionsB.map((q) => ({
        id: q.id,
        label: q.indicator,
        aspect: q.aspect,
        score: partBAnswers[q.id] || 0,
        note: partBNotes[q.id]
      }))

      // Inject General Photos into Part B
      if (urlDepan) partBResults.push({ id: 'foto_depan', label: 'Foto Bagian Depan Rumah', aspect: 'Dokumentasi', score: 0, evidenceUrls: [urlDepan] } as any)
      if (urlDalam) partBResults.push({ id: 'foto_dalam', label: 'Foto Dalam Rumah', aspect: 'Dokumentasi', score: 0, evidenceUrls: [urlDalam] } as any)
      if (urlBelakang) partBResults.push({ id: 'foto_belakang', label: 'Foto Belakang Rumah', aspect: 'Dokumentasi', score: 0, evidenceUrls: [urlBelakang] } as any)

      // 4. Prepare Part C Results
      const partCResults = questionsC.map((q) => ({
        id: q.id,
        label: q.indicator,
        aspect: q.aspect,
        score: partCAnswers[q.id] || 0,
        note: partCNotes[q.id]
      }))
      
      const payload = {
        candidateId: candidateId || '',
        mentorId: interviewerId || '',
        submittedAt: new Date().toISOString(),
        partAResults: partAResults,
        partAPass: results.partAPass,
        partBResults: partBResults,
        partCResults: partCResults,
        totalScore: results.totalScore,
        percentage: results.percentage,
        recommendationStatus: results.recommendationStatus,
        notes: generalNotes
      }

      await addResult(payload)
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Submission failed:', error)
      setToast({ message: 'Gagal mengunggah data. Cek koneksi Anda.', type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleExportExcel = async () => {
    const results = calculateResults()
    
    const dataToExport = [
      ['HASIL OBSERVASI HOME VISIT'],
      [],
      ['Informasi Kandidat'],
      ['Nama:', candidate.full_name],
      ['ID Kandidat:', candidate.id],
      ['Email:', candidate.email],
      ['Wilayah:', candidate.region],
      ['Mentor/Visitor:', interviewerName],
      ['Tanggal:', new Date().toLocaleDateString('id-ID')],
      [],
      ['BAGIAN A (WAJIB)', '', 'Catatan'],
      ...questionsA.map(q => [
        q.indicator, 
        partAAnswers[q.id] ? 'Ya' : 'Tidak', 
        partANotes[q.id] || '-'
      ]),
      ['Status Bagian A:', results.partAPass ? 'LOLOS' : 'TIDAK LOLOS'],
      [],
      ['DOKUMENTASI FOTO BAGIAN A'],
      ['Foto saat Home Visit:', uploadedUrls.visit || (fotoVisit.file ? 'Tersedia di Sistem' : '-')],
      ['Foto bersama Orang Tua:', uploadedUrls.ortu || (fotoOrtu.file ? 'Tersedia di Sistem' : '-')],
      ['Foto bersama Peserta:', uploadedUrls.peserta || (fotoPeserta.file ? 'Tersedia di Sistem' : '-')],
      [],
      ['BAGIAN B & C (PENILAIAN)', 'Skor', 'Catatan'],
      ...questionsB.map(q => [
        q.indicator, 
        partBAnswers[q.id], 
        partBNotes[q.id] || '-'
      ]),
      ...questionsC.map(q => [
        q.indicator, 
        partCAnswers[q.id], 
        partCNotes[q.id] || '-'
      ]),
      [],
      ['DOKUMENTASI FOTO BAGIAN B'],
      ['Foto Depan Rumah:', uploadedUrls.depan || (fotoDepan.file ? 'Tersedia di Sistem' : '-')],
      ['Foto Dalam Rumah:', uploadedUrls.dalam || (fotoDalam.file ? 'Tersedia di Sistem' : '-')],
      ['Foto Belakang Rumah:', uploadedUrls.belakang || (fotoBelakang.file ? 'Tersedia di Sistem' : '-')],
      [],
      ['Ringkasan Akhir'],
      ['Total Skor:', `${results.totalScore}/40`],
      ['Persentase:', `${results.percentage.toFixed(2)}%`],
      ['Rekomendasi:', results.recommendationStatus],
      [],
      ['CATATAN UMUM'],
      [generalNotes || '-']
    ]

    const ws = XLSX.utils.aoa_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Home Visit')
    
    ws['!cols'] = [{ wch: 50 }, { wch: 15 }, { wch: 40 }]
    
    XLSX.writeFile(wb, `HomeVisit_${candidate.full_name.replace(/\s+/g, '_')}.xlsx`)
  }

  const PhotoUploadBox = ({ 
    label, 
    state, 
    setter
  }: { 
    label: string; 
    state: PhotoState; 
    setter: React.Dispatch<React.SetStateAction<PhotoState>>;
  }) => (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <div className="relative group">
        {state.preview ? (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-blue-100 shadow-inner bg-gray-50">
            <img src={state.preview} alt="preview" className="w-full h-full object-cover" />
            <button
              onClick={() => setter({ file: null, preview: null })}
              className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-all">
            <span className="text-3xl mb-2">📸</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase mb-3 text-center">Pilih Metode Unggah</span>
            
            <div className="grid grid-cols-2 gap-2 w-full">
              <label className="flex flex-col items-center justify-center py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all active:scale-95">
                <span className="text-xl">📷</span>
                <span className="text-[9px] font-black text-blue-600 uppercase mt-1">Kamera</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] || null, setter)}
                />
              </label>
              
              <label className="flex flex-col items-center justify-center py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all active:scale-95">
                <span className="text-xl">📂</span>
                <span className="text-[9px] font-black text-gray-600 uppercase mt-1">Galeri</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] || null, setter)}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const steps = [
    { num: 1, title: 'Wajib', icon: '⚠️' },
    { num: 2, title: 'Keluarga', icon: '👨‍👩‍👧‍👦' },
    { num: 3, title: 'Penerima', icon: '👤' },
    { num: 4, title: 'Review', icon: '👁️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-black text-gray-900">Mengunggah Data & Bukti...</h2>
          <p className="text-sm text-gray-500 mt-2 text-center px-6">Mohon tunggu sebentar, data sedang dikirim ke sistem.</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">
              {candidate.full_name}
            </h1>
            <p className="text-xs md:text-sm text-gray-600">🏠 Home Visit • {candidate.region}</p>
          </div>
          <button
            onClick={() => navigate('/interviewer')}
            className="text-gray-500 hover:text-gray-900 font-medium text-xs md:text-sm bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            ✕ Tutup
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-sm ${
                      currentStep === step.num
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                        : currentStep > step.num
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.num ? '✓' : step.icon}
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-tight hidden md:block">
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded-full ${currentStep > step.num ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-8 min-h-[400px]">
          {/* Step 1: Part A */}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Bagian A: Kualifikasi Wajib</h2>
              <p className="text-sm text-gray-500 mb-6">Alasan khusus wajib dicantumkan jika ada temuan unik.</p>
              
              <div className="space-y-6 mb-12">
                {questionsA.map((q) => (
                  <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <p className="text-sm font-bold text-gray-800 leading-relaxed">{q.indicator}</p>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setPartAAnswers(prev => ({ ...prev, [q.id]: true }))}
                          className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            partAAnswers[q.id] === true ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Ya
                        </button>
                        <button
                          onClick={() => setPartAAnswers(prev => ({ ...prev, [q.id]: false }))}
                          className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            partAAnswers[q.id] === false ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={partANotes[q.id]}
                      onChange={(e) => setPartANotes(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Tambahkan catatan kualitatif untuk poin ini..."
                      className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] bg-white transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Consolidated Photo Uploads for Part A */}
              <div className="pt-8 border-t-2 border-dashed border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">📸</div>
                  <div>
                    <h3 className="font-black text-gray-900">Dokumentasi Foto Wajib</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Harap unggah bukti foto berikut</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <PhotoUploadBox label="Foto saat Home Visit" state={fotoVisit} setter={setFotoVisit} />
                  <PhotoUploadBox label="Foto bersama Ortu" state={fotoOrtu} setter={setFotoOrtu} />
                  <PhotoUploadBox label="Foto bersama Peserta" state={fotoPeserta} setter={setFotoPeserta} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Part B */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Bagian B: Latar Belakang Keluarga</h2>
              <div className="space-y-10 mb-12">
                {questionsB.map((q) => (
                  <div key={q.id} className="space-y-4">
                    <p className="text-sm font-black text-gray-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] shrink-0">
                        {q.id.toUpperCase()}
                      </span>
                      {q.indicator}
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {q.options?.map((opt) => (
                        <button
                          key={opt.score}
                          onClick={() => setPartBAnswers(prev => ({ ...prev, [q.id]: opt.score }))}
                          className={`group flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            partBAnswers[q.id] === opt.score
                              ? 'bg-blue-50 border-blue-600 ring-4 ring-blue-50 scale-[1.01]'
                              : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="mt-1 shrink-0">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              partBAnswers[q.id] === opt.score ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                            }`}>
                              {partBAnswers[q.id] === opt.score && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm leading-relaxed ${partBAnswers[q.id] === opt.score ? 'text-blue-900 font-bold' : 'text-gray-600 font-medium'}`}>
                              {opt.label}
                            </p>
                          </div>
                          <div className={`shrink-0 px-3 py-1 rounded-lg text-xs font-black transition-all ${
                            partBAnswers[q.id] === opt.score ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            Skor: {opt.score}
                          </div>
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={partBNotes[q.id]}
                      onChange={(e) => setPartBNotes(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Berikan alasan mengapa Anda memilih skor ini..."
                      className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] bg-white transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Consolidated Photo Uploads for Part B */}
              <div className="pt-8 border-t-2 border-dashed border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">🏠</div>
                  <div>
                    <h3 className="font-black text-gray-900">Foto Kondisi Rumah</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Harap unggah foto bagian rumah</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <PhotoUploadBox label="Foto Depan Rumah" state={fotoDepan} setter={setFotoDepan} />
                  <PhotoUploadBox label="Foto Dalam Rumah" state={fotoDalam} setter={setFotoDalam} />
                  <PhotoUploadBox label="Foto Belakang Rumah" state={fotoBelakang} setter={setFotoBelakang} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Part C */}
          {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Bagian C: Latar Belakang PM</h2>
              <div className="space-y-10">
                {questionsC.map((q) => (
                  <div key={q.id} className="space-y-4">
                    <p className="text-sm font-black text-gray-800 flex items-center gap-2">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-[10px] shrink-0">
                        {q.id.toUpperCase()}
                      </span>
                      {q.indicator}
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {q.options?.map((opt) => (
                        <button
                          key={opt.score}
                          onClick={() => setPartCAnswers(prev => ({ ...prev, [q.id]: opt.score }))}
                          className={`group flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            partCAnswers[q.id] === opt.score
                              ? 'bg-purple-50 border-purple-600 ring-4 ring-purple-50 scale-[1.01]'
                              : 'bg-white border-gray-100 hover:border-purple-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="mt-1 shrink-0">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              partCAnswers[q.id] === opt.score ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'
                            }`}>
                              {partCAnswers[q.id] === opt.score && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm leading-relaxed ${partCAnswers[q.id] === opt.score ? 'text-purple-900 font-bold' : 'text-gray-600 font-medium'}`}>
                              {opt.label}
                            </p>
                          </div>
                          <div className={`shrink-0 px-3 py-1 rounded-lg text-xs font-black transition-all ${
                            partCAnswers[q.id] === opt.score ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            Skor: {opt.score}
                          </div>
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={partCNotes[q.id]}
                      onChange={(e) => setPartCNotes(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Tambahkan detail observasi untuk poin ini..."
                      className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] bg-white transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review & General Notes */}
          {currentStep === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Review & Finalisasi</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wajib (A)</p>
                    <p className={`text-xl font-black mt-1 ${calculateResults().partAPass ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateResults().partAPass ? '✓ LOLOS' : '✗ GAGAL'}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center shadow-sm">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Skor Akhir</p>
                    <p className="text-2xl font-black text-blue-700 mt-1">{calculateResults().percentage.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center shadow-sm">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Rekomendasi</p>
                    <p className="text-xl font-black text-purple-700 mt-1">{calculateResults().recommendationStatus}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-gray-900 border-l-4 border-blue-600 pl-3">Tinjauan Dokumentasi Foto</h3>
                  
                  {/* Part A Photos Review */}
                  <div className="grid grid-cols-3 gap-2">
                    {[fotoVisit, fotoOrtu, fotoPeserta].map((photo, i) => photo.preview && (
                      <div key={i} className="space-y-1">
                        <img src={photo.preview} className="w-full aspect-video object-cover rounded-lg border border-gray-200" alt="ev" />
                        <p className="text-[8px] text-center font-bold text-gray-400 uppercase">
                          {i === 0 ? 'Home Visit' : i === 1 ? 'Ortu' : 'Peserta'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Part B Photos Review */}
                  <div className="grid grid-cols-3 gap-2">
                    {[fotoDepan, fotoDalam, fotoBelakang].map((photo, i) => photo.preview && (
                      <div key={i} className="space-y-1">
                        <img src={photo.preview} className="w-full aspect-video object-cover rounded-lg border border-gray-200" alt="ev" />
                        <p className="text-[8px] text-center font-bold text-gray-400 uppercase">
                          {i === 0 ? 'Depan' : i === 1 ? 'Dalam' : 'Belakang'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 border-l-4 border-blue-600 pl-3 pt-4">Tinjauan Catatan Kualitatif</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Section A Review */}
                    {questionsA.map(q => partANotes[q.id] && (
                      <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{q.indicator}</p>
                        <p className="text-xs text-gray-600 italic">"{partANotes[q.id]}"</p>
                      </div>
                    ))}
                    {/* Section B Review */}
                    {questionsB.map(q => partBNotes[q.id] && (
                      <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{q.indicator}</p>
                        <p className="text-xs text-gray-600 italic">"{partBNotes[q.id]}"</p>
                      </div>
                    ))}
                    {/* Section C Review */}
                    {questionsC.map(q => partCNotes[q.id] && (
                      <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{q.indicator}</p>
                        <p className="text-xs text-gray-600 italic">"{partCNotes[q.id]}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <label className="block text-sm font-black text-gray-800 mb-3">Kesimpulan Akhir Mentor:</label>
                <textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Berikan kesimpulan menyeluruh mengenai layak atau tidaknya kandidat ini..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none min-h-[150px] text-sm bg-gray-50 transition-all focus:bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation - Responsive stacked on mobile */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          <button
            onClick={currentStep === 1 ? () => navigate('/interviewer') : handlePrev}
            className="w-full sm:w-auto px-10 py-3 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-2xl transition-all hover:bg-gray-50 active:scale-95 text-center"
          >
            {currentStep === 1 ? 'Batalkan' : 'Sebelumnya'}
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="w-full sm:w-auto px-14 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 text-center"
            >
              Lanjutkan
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="w-full sm:w-auto px-14 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-xl shadow-green-100 transition-all active:scale-95 text-center"
            >
              Simpan Permanen
            </button>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-10 text-center animate-in zoom-in duration-300">
            <div className="text-7xl mb-6">🏡</div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Selesai!</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">Data observasi telah berhasil masuk ke sistem pusat.</p>

            <div className="space-y-3">
              <button
                onClick={handleExportExcel}
                className="w-full px-4 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
              >
                📥 Download Excel
              </button>
              <button
                onClick={() => navigate('/interviewer?tab=homevisit')}
                className="w-full px-4 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast - Centered bottom for mobile */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-600 text-white font-black rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 z-50 text-sm whitespace-nowrap">
          {toast.message}
        </div>
      )}
    </div>
  )
}
