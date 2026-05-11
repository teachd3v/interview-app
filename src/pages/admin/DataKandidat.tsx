import { Link } from 'react-router-dom'
import { useState } from 'react'
import { mockCandidates } from '../../mocks/data'

export default function DataKandidat() {
  const [filterRegion, setFilterRegion] = useState('')

  const filteredCandidates = filterRegion
    ? mockCandidates.filter((c) => c.region === filterRegion)
    : mockCandidates

  const regions = [...new Set(mockCandidates.map((c) => c.region))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/admin" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
            ← Admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Data Kandidat</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter Wilayah</label>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Wilayah</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Asal Sekolah
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Wilayah
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{candidate.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {candidate.fullName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{candidate.school}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{candidate.region}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{candidate.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-gray-600">Total: {filteredCandidates.length} kandidat</p>
      </div>
    </div>
  )
}
