import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useInstrumentStore, Instrument } from '../../store/instrumentStore'
import { parseInstrumentExcelFile, parseInstrumentCSVFile, downloadInstrumentTemplate } from '../../utils/excelParser'

export default function DataInstrument() {
  const [filterBagian, setFilterBagian] = useState<'A' | 'B' | 'C' | ''>('')
  const [filterAspek, setFilterAspek] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const instruments = useInstrumentStore((state) => state.instruments)
  const addInstrument = useInstrumentStore((state) => state.addInstrument)
  const updateInstrument = useInstrumentStore((state) => state.updateInstrument)
  const deleteInstrument = useInstrumentStore((state) => state.deleteInstrument)
  const bulkAddInstruments = useInstrumentStore((state) => state.bulkAddInstruments)
  const getAspekList = useInstrumentStore((state) => state.getAspekList)

  useEffect(() => {
    useInstrumentStore.getState().loadFromSupabase()
  }, [])

  const filteredInstruments = instruments.filter((i) => {
    if (filterBagian && !i.bagian.toUpperCase().startsWith(filterBagian)) return false
    if (filterAspek && i.aspek !== filterAspek) return false
    return true
  })


  const aspekList = getAspekList()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const isCSV = file.name.endsWith('.csv')
      const { instruments: parsed, errors } = isCSV
        ? await parseInstrumentCSVFile(file)
        : await parseInstrumentExcelFile(file)

      if (errors.length > 0) {
        const errorMsg = errors.length > 0 ? `${errors.length} validation error(s): ${errors[0]}` : ''
        setToast({ message: `Import failed. ${errorMsg}`, type: 'error' })
        setIsLoading(false)
        return
      }

      if (parsed.length === 0) {
        setToast({ message: 'No valid instruments found in file', type: 'error' })
        setIsLoading(false)
        return
      }

      // Filter out duplicates (avoid duplicate IDs)
      const existingIds = new Set(instruments.map((i) => i.id))
      const newInstruments = parsed.filter((i) => !existingIds.has(i.id))

      if (newInstruments.length > 0) {
        await bulkAddInstruments(newInstruments)
        setToast({ message: `Successfully imported ${newInstruments.length} instrument(s)`, type: 'success' })
      } else {
        setToast({ message: 'No new instruments to import (all duplicates)', type: 'error' })
      }
    } catch (error) {
      setToast({ message: `Import error: ${(error as Error).message}`, type: 'error' })
    } finally {
      setIsLoading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Data Instrumen</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            + Tambah Manual
          </button>
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
        {/* Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Instrumen</h2>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File Excel (.xlsx)
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: Excel (.xlsx) atau CSV (.csv) dengan kolom Bagian, Aspek, Indikator, Keterangan
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-6">
              <button
                onClick={downloadInstrumentTemplate}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                📥 Download Template
              </button>
            </div>
          </div>

          {isLoading && <p className="text-blue-600 mt-2 text-sm">Processing file...</p>}
        </div>

        {/* Filter & Summary */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bagian</label>
            <select
              value={filterBagian}
              onChange={(e) => setFilterBagian(e.target.value as 'A' | 'B' | 'C' | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Bagian</option>
              <option value="A">A - Kualifikasi Wajib</option>
              <option value="B">B - Kualifikasi Pendukung</option>
              <option value="C">C - Komitmen Program</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Aspek</label>
            <select
              value={filterAspek}
              onChange={(e) => setFilterAspek(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Aspek</option>
              {aspekList.map((aspek) => (
                <option key={aspek} value={aspek}>
                  {aspek}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex items-end">
            <p className="text-sm font-medium text-gray-700">
              Showing {filteredInstruments.length} / {instruments.length} instrumen
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Bagian</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Aspek</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pertanyaan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Indikator / Rubrik</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Pilihan</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Keterangan</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstruments.map((instrument) => (
                <tr key={instrument.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        instrument.bagian.toUpperCase().startsWith('A')
                          ? 'bg-red-100 text-red-800'
                          : instrument.bagian.toUpperCase().startsWith('B')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {instrument.bagian}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">{instrument.aspek}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium max-w-xs truncate" title={instrument.pertanyaan}>
                    {instrument.pertanyaan || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={instrument.indikator}>
                    {instrument.indikator}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">
                    {instrument.pilihan || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={instrument.keterangan}>
                    {instrument.keterangan || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setEditingId(instrument.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteInstrument(instrument.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingId) && (
        <InstrumentFormModal
          instrument={editingId ? instruments.find((i) => i.id === editingId) : undefined}
          instruments={instruments}
          onClose={() => {
            setShowAddForm(false)
            setEditingId(null)
          }}
          onSave={(instrument) => {
            if (editingId) {
              updateInstrument(editingId, instrument)
              setToast({ message: 'Instrumen updated successfully', type: 'success' })
              setEditingId(null)
            } else {
              addInstrument(instrument)
              setToast({ message: 'Instrumen added successfully', type: 'success' })
              setShowAddForm(false)
            }
          }}
        />
      )}
    </div>
  )
}

interface InstrumentFormModalProps {
  instrument?: Instrument
  instruments: Instrument[]
  onClose: () => void
  onSave: (instrument: Instrument) => void
}

function InstrumentFormModal({ instrument, instruments, onClose, onSave }: InstrumentFormModalProps) {
  const id = instrument?.id || `inst-${Date.now()}`
  
  const existingBagian = Array.from(new Set(instruments.map((i) => i.bagian).filter(Boolean)))
  const defaultBagian = [
    'A. VERIFIKASI DATA SOSIAL-EKONOMI & KELAYAKAN ADMINISTRATIF',
    'B. PRESENTASI DIRI, WAWASAN & KEMAMPUAN KOMUNIKASI',
    'B. MOTIVASI, POTENSI DIRI & KEPEDULIAN SOSIAL',
    'B. NILAI, KARAKTER, RESILIENSI & KEBIASAAN',
    'B. KESIAPAN HIDUP MANDIRI & MANAJEMEN FINANSIAL MAHASISWA',
    'C. KOMITMEN PROGRAM ETOS ID',
  ]
  const unionBagian = Array.from(new Set([...defaultBagian, ...existingBagian]))

  const initialBagian = instrument?.bagian || unionBagian[0]
  const isCustomInitial = !unionBagian.includes(initialBagian)

  const [selectedBagian, setSelectedBagian] = useState(isCustomInitial ? 'custom' : initialBagian)
  const [customBagian, setCustomBagian] = useState(isCustomInitial ? initialBagian : '')
  const [aspek, setAspek] = useState(instrument?.aspek || '')
  const [pertanyaan, setPertanyaan] = useState(instrument?.pertanyaan || '')
  const [indikator, setIndikator] = useState(instrument?.indikator || '')
  const [pilihan, setPilihan] = useState(instrument?.pilihan || '')
  const [keterangan, setKeterangan] = useState(instrument?.keterangan || '')
  const [error, setError] = useState('')
  const aspekOptions = Array.from(new Set([
    'Kesiapan Mengikuti Program & Peraturan',
    'Pendapatan & Tanggungan Keluarga',
    'Kewajiban Finansial (Hutang/Pinjaman/Paylater)',
    'Kondisi Kesehatan Keluarga',
    'Kepemilikan Aset & Akses Teknologi',
    'Jalur Masuk Perguruan Tinggi',
    'Prestasi Akademik & Non-Akademik',
    'Besaran UKT ',
    'Bantuan Lain',
    'Kemampuan Hafalan & Bacaan Al-Qur\'an',
    'Pemahaman Nilai Pergaulan (Pacaran)',
    'Pemahaman Nilai terkait Isu LGBT',
    'Literasi & Kemandirian Finansial',
    'Kesehatan Mental & Manajemen Stres Akademik',
    ...Array.from(new Set(instruments.map((i) => i.aspek).filter(Boolean))),
  ]))

  const handleSubmit = () => {
    setError('')
    const finalBagian = selectedBagian === 'custom' ? customBagian.trim() : selectedBagian

    if (!finalBagian) {
      setError('Harap isi Bagian')
      return
    }

    const bagianUpper = finalBagian.toUpperCase()
    if (!bagianUpper.startsWith('A') && !bagianUpper.startsWith('B') && !bagianUpper.startsWith('C')) {
      setError('Bagian harus diawali huruf A, B, atau C (contoh: "C. Komitmen Program")')
      return
    }


    if (!aspek || !indikator) {
      setError('Harap lengkapi Aspek dan Indikator')
      return
    }

    onSave({
      id,
      bagian: finalBagian,
      aspek,
      pertanyaan,
      indikator,
      pilihan,
      keterangan,
      urutan: instrument?.urutan || 0,
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {instrument ? 'Edit Instrumen' : 'Tambah Instrumen'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bagian (Instansi / Kelompok)</label>
              <select
                value={selectedBagian}
                onChange={(e) => setSelectedBagian(e.target.value)}
                disabled={!!instrument}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 mb-2"
              >
                {unionBagian.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="custom">+ Custom Bagian Baru...</option>
              </select>

              {selectedBagian === 'custom' && (
                <input
                  type="text"
                  placeholder="Ketik Bagian Baru (Harus diawali A atau B)..."
                  value={customBagian}
                  onChange={(e) => setCustomBagian(e.target.value)}
                  disabled={!!instrument}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aspek</label>
              <select
                value={aspek}
                onChange={(e) => setAspek(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Aspek...</option>
                {aspekOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan Panduan</label>
            <textarea
              value={pertanyaan}
              onChange={(e) => setPertanyaan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Deskripsi pertanyaan untuk panduan interviewer..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Indikator / Rubrik Penilaian</label>
            <input
              type="text"
              value={indikator}
              onChange={(e) => setIndikator(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Kriteria penilaian atau statement..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opsi Jawaban / Skor (Pilihan)</label>
              <input
                type="text"
                value={pilihan}
                onChange={(e) => setPilihan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ya; Tidak atau 3, 2, 1..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Skoring, Syarat mutlak, dll..."
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 flex gap-3 justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-medium rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}
