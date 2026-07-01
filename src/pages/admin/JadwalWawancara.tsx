import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useScheduleStore } from '../../store/scheduleStore'
import { useRegionStore } from '../../store/regionStore'
import { useCandidateStore } from '../../store/candidateStore'
import { useInterviewerStore } from '../../store/interviewerStore'
import { parseScheduleExcelFile, downloadScheduleTemplate } from '../../utils/excelParser'

// Format tanggal ke format Indonesia: Sabtu, 16 Mei 2026
const formatDateIndonesian = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const dayName = dayNames[date.getDay()]
  const day = date.getDate()
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()

  return `${dayName}, ${day} ${month} ${year}`
}

export default function JadwalWawancara() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state for create/edit modal
  const [formData, setFormData] = useState({
    regionId: '',
    interviewDate: '',
    pusatId: '',
    mitraId: '',
    fasilId: '',
    selectedCandidates: [] as string[],
  })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  const regions = useRegionStore((state) => state.regions)
  const loadRegions = useRegionStore((state) => state.loadFromSupabase)

  const allSchedules = useScheduleStore((state) => state.schedules)
  const addSchedule = useScheduleStore((state) => state.addSchedule)
  const updateSchedule = useScheduleStore((state) => state.updateSchedule)
  const bulkAddSchedules = useScheduleStore((state) => state.bulkAddSchedules)
  const deleteSchedule = useScheduleStore((state) => state.deleteSchedule)
  const removeCandidateFromSchedule = useScheduleStore((state) => state.removeCandidateFromSchedule)

  const candidates = useCandidateStore((state) => state.candidates)
  const interviewers = useInterviewerStore((state) => state.interviewers)

  useEffect(() => {
    loadRegions()
    useCandidateStore.getState().loadFromSupabase()
    useScheduleStore.getState().loadFromSupabase()
    useInterviewerStore.getState().loadFromSupabase()
  }, [loadRegions])

  // Set default selected region
  useEffect(() => {
    if (regions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(regions[0].id)
    }
  }, [regions, selectedRegionId])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const result = await parseScheduleExcelFile(file)
      const { schedules: parsedSchedules, errors } = result

      if (errors.length > 0) {
        const errorMsg = errors.join(', ') || 'Unknown error'
        setToast({ message: `Import failed. ${errorMsg.substring(0, 100)}...`, type: 'error' })
        setIsLoading(false)
        return
      }

      if (parsedSchedules.length === 0) {
        setToast({ message: 'No valid schedules found in file', type: 'error' })
        setIsLoading(false)
        return
      }

      await bulkAddSchedules(parsedSchedules)
      setToast({ message: `Successfully imported ${parsedSchedules.length} schedule(s)`, type: 'success' })
    } catch (error) {
      setToast({ message: `Import error: ${(error as Error).message}`, type: 'error' })
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  const handleAddSchedule = (regionId: string) => {
    setSelectedRegionId(regionId)
    setFormData({
      regionId,
      interviewDate: '',
      pusatId: '',
      mitraId: '',
      fasilId: '',
      selectedCandidates: [],
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  const handleEditSchedule = (schedule: any) => {
    setEditingScheduleId(schedule.id)
    setFormData({
      regionId: schedule.region_id,
      interviewDate: schedule.interview_date,
      pusatId: schedule.pusat_id || '',
      mitraId: schedule.mitra_id || '',
      fasilId: schedule.fasil_id || '',
      selectedCandidates: schedule.candidate_ids || [],
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingScheduleId(null)
    setFormData({
      regionId: '',
      interviewDate: '',
      pusatId: '',
      mitraId: '',
      fasilId: '',
      selectedCandidates: [],
    })
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    if (!formData.regionId) errors.regionId = 'Wilayah harus dipilih'
    if (!formData.interviewDate) errors.interviewDate = 'Tanggal wawancara harus diisi'
    if (!formData.pusatId) errors.pusatId = 'Interviewer Pusat harus dipilih'
    if (!formData.mitraId) errors.mitraId = 'Interviewer Mitra harus dipilih'
    if (!formData.fasilId) errors.fasilId = 'Interviewer Fasil harus dipilih'
    if (formData.selectedCandidates.length === 0) errors.candidates = 'Minimal 1 kandidat harus dipilih'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleFormSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      if (showEditModal && editingScheduleId) {
        // Update existing schedule
        await updateSchedule(editingScheduleId, {
          region_id: formData.regionId,
          interview_date: formData.interviewDate,
          pusat_id: formData.pusatId || undefined,
          mitra_id: formData.mitraId || undefined,
          fasil_id: formData.fasilId || undefined,
          candidate_ids: formData.selectedCandidates,
        })
        setToast({ message: 'Jadwal berhasil diperbarui', type: 'success' })
      } else {
        // Create new schedule
        await addSchedule({
          region_id: formData.regionId,
          interview_date: formData.interviewDate,
          pusat_id: formData.pusatId || undefined,
          mitra_id: formData.mitraId || undefined,
          fasil_id: formData.fasilId || undefined,
          status: 'belum',
          candidate_ids: formData.selectedCandidates,
        })
        setToast({ message: 'Jadwal berhasil ditambahkan', type: 'success' })
      }
      closeModal()
    } catch (error) {
      setToast({ message: `Error: ${(error as Error).message}`, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredCandidates = () => {
    if (!formData.regionId) return []

    const selectedRegion = regions.find((r) => r.id === formData.regionId)
    if (!selectedRegion) return []

    const regionNameUpper = selectedRegion.name.toUpperCase()
    const regionCodeUpper = (selectedRegion.code || '').toUpperCase()

    // Mapping region name to school name
    const regionToSchool: Record<string, string> = {
      'DI YOGYAKARTA': 'UNIVERSITAS GADJAH MADA',
      'PALU': 'UNIVERSITAS TADULAKO',
      'AMBON': 'UNIVERSITAS PATTIMURA',
      'JAMBI': 'UNIVERSITAS JAMBI',
      'PADANG': 'UNIVERSITAS ANDALAS',
    }

    const targetSchool = regionToSchool[regionNameUpper] || ''

    // Collect all candidate IDs already scheduled in other schedules
    const scheduledCandidateIds = new Set<string>()
    allSchedules.forEach((sch) => {
      // If editing, skip the current schedule's candidates
      if (showEditModal && editingScheduleId === sch.id) return
      if (sch.candidate_ids) {
        sch.candidate_ids.forEach((id) => scheduledCandidateIds.add(id))
      }
    })

    return candidates.filter((candidate) => {
      // Always show if already selected in the form/modal state
      if (formData.selectedCandidates.includes(candidate.id)) return true

      // If already scheduled in another schedule, hide
      if (scheduledCandidateIds.has(candidate.id)) return false

      const candidateRegionUpper = (candidate.region || '').toUpperCase()
      const candidateSchoolUpper = (candidate.school || '').toUpperCase()

      return (
        candidateRegionUpper === regionNameUpper ||
        candidateRegionUpper === regionCodeUpper ||
        (targetSchool && candidateSchoolUpper.includes(targetSchool))
      )
    })
  }

  const handleCandidateToggle = (candidateId: string): void => {
    setFormData((prev) => ({
      ...prev,
      selectedCandidates: prev.selectedCandidates.includes(candidateId)
        ? prev.selectedCandidates.filter((id) => id !== candidateId)
        : [...prev.selectedCandidates, candidateId],
    }))
  }

  const getInterviewerName = (id: string | undefined) => {
    if (!id) return 'Belum ditentukan'
    return interviewers.find((i) => i.id === id)?.full_name || `Interviewer ${id}`
  }

  const getCandidateName = (id: string) => {
    return candidates.find((c) => c.id === id)?.full_name || `Kandidat ${id}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Wawancara</h1>
          <div className="flex gap-2">
            <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer transition-colors font-medium">
              📥 Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
            </label>
            <button
              onClick={() => downloadScheduleTemplate()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              📥 Template
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 p-4 rounded-lg text-white z-50 ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Region Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegionId(region.id)}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                selectedRegionId === region.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {region.name}
            </button>
          ))}
        </div>

        {/* Schedules by Region */}
        {selectedRegionId && (
          <div className="space-y-6">
            {allSchedules.filter((s) => s.region_id === selectedRegionId).length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-600 text-lg mb-4">Belum ada jadwal wawancara untuk wilayah ini</p>
                <button
                  onClick={() => handleAddSchedule(selectedRegionId)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  + Tambah Jadwal
                </button>
              </div>
            ) : (
              <>
                {/* Group schedules by date */}
                {allSchedules
                  .filter((s) => s.region_id === selectedRegionId)
                  .sort((a: any, b: any) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime())
                  .map((schedule: any) => (
                    <div key={schedule.id} className="bg-white rounded-lg border border-gray-200 p-6">
                      {/* Date Header */}
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {formatDateIndonesian(schedule.interview_date)}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Hapus jadwal ini?')) {
                                deleteSchedule(schedule.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>

                      {/* Interviewers */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-xs font-semibold text-blue-800 mb-1">Pusat</p>
                          <p className="text-sm font-medium text-gray-900">
                            {getInterviewerName(schedule.pusat_id)}
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-xs font-semibold text-green-800 mb-1">Mitra</p>
                          <p className="text-sm font-medium text-gray-900">
                            {getInterviewerName(schedule.mitra_id)}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <p className="text-xs font-semibold text-purple-800 mb-1">Fasil</p>
                          <p className="text-sm font-medium text-gray-900">
                            {getInterviewerName(schedule.fasil_id)}
                          </p>
                        </div>
                      </div>

                      {/* Candidates */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-sm font-semibold text-gray-900">Daftar Kandidat</p>
                          <button
                            onClick={() => handleEditSchedule(schedule)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            + Tambah Kandidat
                          </button>
                        </div>

                        {schedule.candidate_ids && schedule.candidate_ids.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {schedule.candidate_ids.map((candidateId: string) => (
                              <div
                                key={candidateId}
                                className="bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-2 group"
                              >
                                <span className="text-sm font-medium text-gray-900">
                                  {candidateId} - {getCandidateName(candidateId)}
                                </span>
                                <button
                                  onClick={() => removeCandidateFromSchedule(schedule.id, candidateId)}
                                  className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Belum ada kandidat</p>
                        )}
                      </div>
                    </div>
                  ))}

                {/* Add Schedule Button */}
                <button
                  onClick={() => handleAddSchedule(selectedRegionId)}
                  className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 hover:text-blue-700 hover:border-blue-400 rounded-lg font-semibold transition-colors"
                >
                  + Tambah Jadwal Baru
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Schedule Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {showEditModal && editingScheduleId ? 'Edit Jadwal' : 'Tambah Jadwal'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Region Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Wilayah <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.regionId}
                  onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                  disabled={showEditModal}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    showEditModal ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  } ${formErrors.regionId ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">-- Pilih Wilayah --</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                {formErrors.regionId && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.regionId}</p>
                )}
              </div>

              {/* Interview Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tanggal Wawancara <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.interviewDate}
                  onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.interviewDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.interviewDate && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.interviewDate}</p>
                )}
              </div>

              {/* Interviewers Section */}
              <div className="grid grid-cols-3 gap-4">
                {/* Pusat */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Interviewer Pusat <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.pusatId}
                    onChange={(e) => setFormData({ ...formData, pusatId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.pusatId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Pilih --</option>
                    {interviewers
                      .filter((i) => i.role === 'pusat')
                      .map((interviewer) => (
                        <option key={interviewer.id} value={interviewer.id}>
                          {interviewer.full_name}
                        </option>
                      ))}
                  </select>
                  {formErrors.pusatId && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.pusatId}</p>
                  )}
                </div>

                {/* Mitra */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Interviewer Mitra <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.mitraId}
                    onChange={(e) => setFormData({ ...formData, mitraId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.mitraId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Pilih --</option>
                    {interviewers
                      .filter((i) => i.role === 'mitra')
                      .map((interviewer) => (
                        <option key={interviewer.id} value={interviewer.id}>
                          {interviewer.full_name}
                        </option>
                      ))}
                  </select>
                  {formErrors.mitraId && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.mitraId}</p>
                  )}
                </div>

                {/* Fasil */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Interviewer Fasil <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.fasilId}
                    onChange={(e) => setFormData({ ...formData, fasilId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.fasilId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Pilih --</option>
                    {interviewers
                      .filter((i) => i.role === 'fasil')
                      .map((interviewer) => (
                        <option key={interviewer.id} value={interviewer.id}>
                          {interviewer.full_name}
                        </option>
                      ))}
                  </select>
                  {formErrors.fasilId && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.fasilId}</p>
                  )}
                </div>
              </div>

              {/* Candidates Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Daftar Kandidat <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                  {getFilteredCandidates().length === 0 ? (
                    <p className="text-gray-500 text-sm italic">
                      {!formData.regionId
                        ? 'Harap pilih wilayah terlebih dahulu'
                        : 'Tidak ada kandidat tersedia untuk wilayah ini'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredCandidates().map((candidate) => (
                        <div key={candidate.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`candidate-${candidate.id}`}
                            checked={formData.selectedCandidates.includes(candidate.id)}
                            onChange={() => handleCandidateToggle(candidate.id)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                          <label
                            htmlFor={`candidate-${candidate.id}`}
                            className="ml-3 flex-1 cursor-pointer text-sm text-gray-900"
                          >
                            {candidate.id} - {candidate.full_name}
                            <span className="text-gray-500 ml-2">({candidate.school} • {candidate.region})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formErrors.candidates && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.candidates}</p>
                )}
                {formData.selectedCandidates.length > 0 && (
                  <p className="text-gray-600 text-xs mt-2">
                    {formData.selectedCandidates.length} kandidat dipilih
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="border-t border-gray-200 p-6 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={closeModal}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Menyimpan...' : showEditModal ? 'Perbarui' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
