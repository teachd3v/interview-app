import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminDashboard from './pages/admin/AdminDashboard'
import DataKandidat from './pages/admin/DataKandidat'
import DataInterviewer from './pages/admin/DataInterviewer'
import DataInstrument from './pages/admin/DataInstrument'
import JadwalWawancara from './pages/admin/JadwalWawancara'
import HasilAkhir from './pages/admin/HasilAkhir'
import HasilHomeVisit from './pages/admin/HasilHomeVisit'
import HasilHomeVisitDetail from './pages/admin/HasilHomeVisitDetail'
import ValidasiHomeVisit from './pages/admin/ValidasiHomeVisit'
import HasilDetail from './pages/admin/HasilDetail'
import InterviewerDashboard from './pages/interviewer/InterviewerDashboard'
import InterviewerSelectPage from './pages/interviewer/InterviewerSelectPage'
import FormWawancara from './pages/interviewer/FormWawancara'
import FormHomeVisit from './pages/interviewer/FormHomeVisit'
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
            <Route path="/admin/hasil-home-visit" element={<HasilHomeVisit />} />
            <Route path="/admin/validasi-home-visit" element={<ValidasiHomeVisit />} />
            <Route path="/admin/hasil-home-visit-detail/:id" element={<HasilHomeVisitDetail />} />
            <Route path="/admin/hasil-detail/:resultId" element={<HasilDetail />} />
          </>
        )}

        {/* Interviewer Routes */}
        {(role === 'pusat' || role === 'cabang' || role === 'mentor') && (
          <>
            <Route path="/interviewer/select" element={<InterviewerSelectPage />} />
            <Route path="/interviewer" element={<InterviewerDashboard />} />
            <Route path="/interviewer/form/:candidateId" element={<FormWawancara />} />
            <Route path="/interviewer/home-visit/:candidateId" element={<FormHomeVisit />} />
            <Route path="/interviewer/hasil-detail/:resultId" element={<HasilDetail />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}