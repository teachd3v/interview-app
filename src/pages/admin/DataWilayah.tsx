import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useRegionStore, Region } from '../../store/regionStore'

export default function DataWilayah() {
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const [showForm, setShowForm] = useState(false)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  
  const [formData, setFormData] = useState<{ name: string; code: string; order_number: string }>({
    name: '',
    code: '',
    order_number: ''
  })

  const regions = useRegionStore((state) => state.regions)
  const addRegion = useRegionStore((state) => state.addRegion)
  const updateRegion = useRegionStore((state) => state.updateRegion)
  const deleteRegion = useRegionStore((state) => state.deleteRegion)
  const loadRegions = useRegionStore((state) => state.loadFromSupabase)

  useEffect(() => {
    loadRegions()
  }, [loadRegions])

  // Clear toast after 3s
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const openAddForm = () => {
    setEditingRegion(null)
    setFormData({ name: '', code: '', order_number: '' })
    setShowForm(true)
  }

  const openEditForm = (region: Region) => {
    setEditingRegion(region)
    setFormData({
      name: region.name,
      code: region.code || '',
      order_number: region.order_number?.toString() || ''
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingRegion(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      setToast({ message: 'Nama wilayah wajib diisi', type: 'error' })
      return
    }

    setIsLoading(true)
    try {
      const orderNum = formData.order_number ? parseInt(formData.order_number) : undefined
      const regionData = {
        name: formData.name.toUpperCase(), // Normalize to uppercase
        code: formData.code ? formData.code.toUpperCase() : undefined,
        order_number: isNaN(orderNum as number) ? undefined : orderNum
      }

      if (editingRegion) {
        await updateRegion(editingRegion.id, regionData)
        setToast({ message: 'Wilayah berhasil diupdate', type: 'success' })
      } else {
        await addRegion(regionData)
        setToast({ message: 'Wilayah baru berhasil ditambahkan', type: 'success' })
      }
      closeForm()
    } catch (error) {
      setToast({ message: `Error: ${(error as Error).message}`, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus wilayah ${name}?`)) return

    try {
      await deleteRegion(id)
      setToast({ message: 'Wilayah berhasil dihapus', type: 'success' })
    } catch (error) {
      setToast({ message: `Gagal menghapus wilayah: ${(error as Error).message}`, type: 'error' })
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
          <h1 className="text-2xl font-bold text-gray-900">Data Wilayah</h1>
          <button
            onClick={openAddForm}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            + Tambah Wilayah
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-900">No. Urut</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Nama Wilayah</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Kode</th>
                  <th className="px-6 py-4 font-semibold text-gray-900 w-32">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => (
                  <tr key={region.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {region.order_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {region.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {region.code || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(region)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(region.id, region.name)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {regions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Belum ada data wilayah. Silakan tambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingRegion ? 'Edit Wilayah' : 'Tambah Wilayah'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Wilayah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: BANJARMASIN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: BJM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nomor Urut (Opsional)
                </label>
                <input
                  type="number"
                  value={formData.order_number}
                  onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
