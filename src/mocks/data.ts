export interface Candidate {
  id: string
  fullName: string
  gender: string
  region: string
  school: string
  major: string
}

export interface Interviewer {
  id: string
  fullName: string
  role: 'pusat' | 'mitra' | 'fasil'
  region: string
}

export interface InterviewSchedule {
  id: string
  candidateId: string
  date: string
  pusat: Interviewer | null
  mitra: Interviewer | null
  fasil: Interviewer | null
  status: 'belum' | 'berjalan' | 'selesai'
}

export const mockCandidates: Candidate[] = [
  {
    id: '001',
    fullName: 'Ahmad Rizki Pratama',
    gender: 'Laki-laki',
    region: 'DKI Jakarta',
    school: 'Universitas Indonesia',
    major: 'Teknik Informatika',
  },
  {
    id: '002',
    fullName: 'Siti Nurhaliza Wijaya',
    gender: 'Perempuan',
    region: 'Jawa Barat',
    school: 'Institut Teknologi Bandung',
    major: 'Sistem Informasi',
  },
  {
    id: '003',
    fullName: 'Budi Santoso',
    gender: 'Laki-laki',
    region: 'Jawa Timur',
    school: 'Universitas Airlangga',
    major: 'Manajemen',
  },
  {
    id: '004',
    fullName: 'Dewi Kusuma Negara',
    gender: 'Perempuan',
    region: 'Sumatera Utara',
    school: 'Universitas Sumatera Utara',
    major: 'Akuntansi',
  },
  {
    id: '005',
    fullName: 'Muhammad Fajar Hadyan',
    gender: 'Laki-laki',
    region: 'DI Yogyakarta',
    school: 'Universitas Gadjah Mada',
    major: 'Psikologi',
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
    role: 'mitra',
    region: 'Jawa Barat',
  },
  {
    id: 'int-004',
    fullName: 'Dr. Eka Putri',
    role: 'mitra',
    region: 'Jawa Timur',
  },
  {
    id: 'int-005',
    fullName: 'Fasil Ahmad Syaiful',
    role: 'fasil',
    region: 'DKI Jakarta',
  },
  {
    id: 'int-006',
    fullName: 'Fasil Sri Rahayu',
    role: 'fasil',
    region: 'Jawa Barat',
  },
]

export const mockSchedules: InterviewSchedule[] = [
  {
    id: 'sch-001',
    candidateId: '001',
    date: '2025-06-01',
    pusat: mockInterviewers[0],
    mitra: null,
    fasil: null,
    status: 'belum',
  },
  {
    id: 'sch-002',
    candidateId: '002',
    date: '2025-06-01',
    pusat: mockInterviewers[1],
    mitra: mockInterviewers[2],
    fasil: mockInterviewers[4],
    status: 'berjalan',
  },
  {
    id: 'sch-003',
    candidateId: '003',
    date: '2025-06-02',
    pusat: mockInterviewers[0],
    mitra: mockInterviewers[3],
    fasil: mockInterviewers[5],
    status: 'selesai',
  },
]
