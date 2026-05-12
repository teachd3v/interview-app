# Interview App - Frontend Prototype

Sistem wawancara LPDP dengan fokus pada UI/UX testing di localhost.

## Stack

- **Vite** - Build tool & dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router v6** - Routing
- **Zustand** - State management
- **Supabase** - Backend & Database

## Struktur Folder

```
src/
├── pages/
│   ├── HomePage.tsx
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── DataKandidat.tsx
│   │   ├── DataInterviewer.tsx
│   │   ├── DataInstrument.tsx
│   │   └── JadwalWawancara.tsx
│   └── interviewer/
│       ├── InterviewerDashboard.tsx
│       ├── InterviewerSelectPage.tsx
│       └── FormWawancara.tsx
├── store/
│   ├── authStore.ts
│   ├── candidateStore.ts
│   ├── interviewerStore.ts
│   ├── scheduleStore.ts
│   ├── instrumentStore.ts
│   ├── formStore.ts
│   └── formResultsStore.ts
├── lib/
│   └── supabase.ts
├── utils/
│   └── excelParser.ts
└── App.tsx
```

## Menjalankan Project

```bash
# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## Fitur Utama

### Admin Panel
- ✅ Data Kandidat (CRUD + bulk import)
- ✅ Data Pewawancara (CRUD + bulk import)
- ✅ Data Instrumen (CRUD + bulk import)
- ✅ Jadwal Wawancara (CRUD + bulk import)

### Interviewer Panel
- ✅ Dashboard dengan jadwal wawancara
- ✅ Form wawancara 4-step:
  - Step 1: Kualifikasi Wajib (Part A) - 8 indicators
  - Step 2: Kualifikasi Pendukung (Part B) - 20 indicators by aspect
  - Step 3: Catatan Tambahan
  - Step 4: Review & Submit
- ✅ 20-minute countdown timer
- ✅ Results saved to Supabase
- ✅ Completion status on dashboard

## Environment Variables

```
VITE_SUPABASE_URL=https://rzzdinkudokfekolbhut.supabase.co
VITE_SUPABASE_KEY=eyJhbGc... (dari .env.local)
```

## Development Notes

- State management menggunakan Zustand
- All data persisted di Supabase PostgreSQL
- Styling menggunakan Tailwind CSS
- Role-based routing (admin, pusat, cabang, mentor)
