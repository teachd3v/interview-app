export interface Candidate {
  id: string
  fullName: string
  school: string
  region: string
  birthDate: string
  email: string
}

export interface Interviewer {
  id: string
  fullName: string
  role: 'pusat' | 'cabang' | 'mentor'
  region: string
}

export interface InterviewSchedule {
  id: string
  candidateId: string
  date: string
  pusat: Interviewer | null
  cabang: Interviewer | null
  mentor: Interviewer | null
  status: 'belum' | 'berjalan' | 'selesai'
}

export const mockCandidates: Candidate[] = [
  {
    id: '001',
    fullName: 'Ahmad Rizki Pratama',
    school: 'SMA Negeri 1 Jakarta',
    region: 'DKI Jakarta',
    birthDate: '2003-05-15',
    email: 'ahmad.rizki@email.com',
  },
  {
    id: '002',
    fullName: 'Siti Nurhaliza Wijaya',
    school: 'SMA Negeri 2 Bandung',
    region: 'Jawa Barat',
    birthDate: '2003-08-22',
    email: 'siti.haliza@email.com',
  },
  {
    id: '003',
    fullName: 'Budi Santoso',
    school: 'SMA Negeri 3 Surabaya',
    region: 'Jawa Timur',
    birthDate: '2002-11-10',
    email: 'budi.santoso@email.com',
  },
  {
    id: '004',
    fullName: 'Dewi Kusuma Negara',
    school: 'SMA Negeri 1 Medan',
    region: 'Sumatera Utara',
    birthDate: '2003-03-20',
    email: 'dewi.kusuma@email.com',
  },
  {
    id: '005',
    fullName: 'Muhammad Fajar Hadyan',
    school: 'SMA Negeri 1 Yogyakarta',
    region: 'DI Yogyakarta',
    birthDate: '2002-09-12',
    email: 'muhammad.fajar@email.com',
  },
]

export const mockInterviewers: Interviewer[] = [
  {
    id: 'int-001',
    fullName: 'Dr. Bambang Sutrisno',
    role: 'pusat',
    region: 'DKI Jakarta',
  },
  {
    id: 'int-002',
    fullName: 'Ibu Sinta Wijaya',
    role: 'pusat',
    region: 'DKI Jakarta',
  },
  {
    id: 'int-003',
    fullName: 'Pak Hendra Gunawan',
    role: 'cabang',
    region: 'Jawa Barat',
  },
  {
    id: 'int-004',
    fullName: 'Dr. Eka Putri',
    role: 'cabang',
    region: 'Jawa Timur',
  },
  {
    id: 'int-005',
    fullName: 'Mentor Ahmad Syaiful',
    role: 'mentor',
    region: 'DKI Jakarta',
  },
  {
    id: 'int-006',
    fullName: 'Mentor Sri Rahayu',
    role: 'mentor',
    region: 'Jawa Barat',
  },
]

export const mockSchedules: InterviewSchedule[] = [
  {
    id: 'sch-001',
    candidateId: '001',
    date: '2025-06-01',
    pusat: mockInterviewers[0],
    cabang: null,
    mentor: null,
    status: 'belum',
  },
  {
    id: 'sch-002',
    candidateId: '002',
    date: '2025-06-01',
    pusat: mockInterviewers[1],
    cabang: mockInterviewers[2],
    mentor: mockInterviewers[4],
    status: 'berjalan',
  },
  {
    id: 'sch-003',
    candidateId: '003',
    date: '2025-06-02',
    pusat: mockInterviewers[0],
    cabang: mockInterviewers[3],
    mentor: mockInterviewers[5],
    status: 'selesai',
  },
]
