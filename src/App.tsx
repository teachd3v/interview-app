import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminDashboard from './pages/admin/AdminDashboard'
import DataKandidat from './pages/admin/DataKandidat'
import DataInterviewer from './pages/admin/DataInterviewer'
import DataInstrument from './pages/admin/DataInstrument'
import JadwalWawancara from './pages/admin/JadwalWawancara'
import HasilAkhir from './pages/admin/HasilAkhir'
import InterviewerDashboard from './pages/interviewer/InterviewerDashboard'
import InterviewerSelectPage from './pages/interviewer/InterviewerSelectPage'
import FormWawancara from './pages/interviewer/FormWawancara'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { role } = useAuthStore((state) => ({
    role: state.role
  }))

  return (
    <BrowserRouter>
      <Routes>
        {/* Home Page - Pilih Role */}
        <Route path="/" element={<HomePage />} />

        {/* Admin Routes */}
        {role === 'admin' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/kandidat" element={<DataKandidat />} />
            <Route path="/admin/interviewer" element={<DataInterviewer />} />
            <Route path="/admin/instrumen" element={<DataInstrument />} />
            <Route path="/admin/jadwal" element={<JadwalWawancara />} />
            <Route path="/admin/hasil" element={<HasilAkhir />} />
          </>
        )}

        {/* Interviewer Routes */}
        {(role === 'pusat' || role === 'cabang' || role === 'mentor') && (
          <>
            <Route path="/interviewer/select" element={<InterviewerSelectPage />} />
            <Route path="/interviewer" element={<InterviewerDashboard />} />
            <Route path="/interviewer/form/:candidateId" element={<FormWawancara />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}