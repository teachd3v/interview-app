import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import DataKandidat from './pages/admin/DataKandidat'
import JadwalWawancara from './pages/admin/JadwalWawancara'
import InterviewerDashboard from './pages/interviewer/InterviewerDashboard'
import FormWawancara from './pages/interviewer/FormWawancara'

export default function App() {
  const role = useAuthStore((state) => state.role)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Admin Routes */}
        {role === 'admin' && (
          <>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/kandidat" element={<DataKandidat />} />
            <Route path="/admin/jadwal" element={<JadwalWawancara />} />
          </>
        )}

        {/* Interviewer Routes */}
        {(role === 'pusat' || role === 'cabang' || role === 'mentor') && (
          <>
            <Route path="/interviewer" element={<InterviewerDashboard />} />
            <Route path="/interviewer/form/:candidateId" element={<FormWawancara />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  )
}
