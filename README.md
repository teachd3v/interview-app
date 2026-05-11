# Interview App - Frontend Prototype

Sistem wawancara LPDP dengan fokus pada UI/UX testing di localhost.

## Stack

- **Vite** - Build tool & dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router v6** - Routing
- **Zustand** - State management

## Struktur Folder

```
src/
├── components/        # Reusable UI components (coming soon)
├── pages/
│   ├── LoginPage.tsx
│   ├── admin/
│   │   ├── AdminDashboard.tsx
│   │   ├── DataKandidat.tsx
│   │   └── JadwalWawancara.tsx
│   └── interviewer/
│       ├── InterviewerDashboard.tsx
│       └── FormWawancara.tsx
├── store/
│   ├── authStore.ts    # Auth state (role)
│   └── formStore.ts    # Form state (Part A, B, C)
├── mocks/
│   └── data.ts         # Mock candidates, interviewers, schedules
├── App.tsx             # Router setup
├── main.tsx            # Entry point
└── index.css           # Tailwind + custom styles
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

## Feature Testing

### Login Page
- Klik salah satu tombol untuk mock login sebagai berbagai role:
  - **Admin**: Dashboard admin dengan menu data kandidat & jadwal
  - **Pusat/Cabang/Mentor**: Dashboard wawancara dengan form

### Admin Panel
- **Data Kandidat**: Tabel dengan filter wilayah
- **Jadwal Wawancara**: Assign interviewer ke jadwal

### Interviewer Panel (PRIORITY)
- **Dashboard**: Daftar kandidat yang akan diwawancara
- **Form Wawancara**:
  - **Part A**: 8 indikator kualifikasi wajib (toggle Ya/Tidak)
  - **Part B**: 20 indikator kualifikasi pendukung, grouped by aspect (Ya/Ragu/Tidak)
  - **Part C**: Textarea untuk catatan
  - **Sticky header**: Info kandidat tetap terlihat saat scroll
  - **Sidebar navigation**: Lompat antar bagian form
  - **Floating action bar**: Tombol Batal & Submit

## Next Steps

1. ✅ Setup project structure & mock data
2. ✅ Create basic pages & forms
3. ⏳ Fine-tune Form UX (polish styling, responsiveness)
4. ⏳ Add component library (shadcn/ui)
5. ⏳ Add more animations & interactions
6. ⏳ Connect to Supabase backend

## Development Notes

- Mock data dapat di-update di `src/mocks/data.ts`
- State form di-manage dengan Zustand di `src/store/formStore.ts`
- Tailwind custom colors di `tailwind.config.js`
- Semua styling menggunakan Tailwind CSS (no component library yet)
