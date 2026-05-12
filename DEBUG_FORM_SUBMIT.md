# 🐛 Debug Form Submit Issue

## Langkah Testing:

### 1. Buka Browser Console
- Tekan `F12` atau `Ctrl+Shift+I`
- Go to **Console** tab
- Bersihkan console dengan `clear()` atau klik icon clear

### 2. Pergi ke Interview Form
- Buka dashboard
- Klik "Mulai Wawancara" pada candidate
- Lengkapi semua step form (Part A, B, Notes)
- Sampai step 4 (Review)

### 3. Submit Form & Lihat Console Output

Saat klik "Submit Nilai", seharusnya ada log seperti ini:

```
📝 Submitting result: {
  id: "result-1715528400000-abc123def456"
  candidateId: "001"
  candidateName: "John Doe"
  interviewerId: "int1"  ← PENTING! Harus ada nilai
  scheduleId: null
  interviewDate: "2026-05-12"
  submittedAt: "2026-05-12T08:15:23.456Z"
  partA: [...]
  partB: [...]
  ...
}
👤 InterviewerId: "int1"  ← HARUS ADA!
```

Lalu seharusnya:

```
🔄 Sending payload to Supabase: {
  candidate_id: "001"
  interviewer_id: "int1"
  schedule_id: null
  interview_date: "2026-05-12"
  submitted_at: "2026-05-12T08:15:23.456Z"
  part_a_results: [...]
  part_a_pass: true/false
  part_b_results: [...]
  part_b_total: 30
  part_b_percentage: 75
  notes: "..."
}
```

### 4. Check Output & Error

**Sukses** ✅ - Seharusnya ada:
```
✅ Result successfully saved to Supabase: [
  {
    id: "abc-123-def-456",
    candidate_id: "001",
    part_a_pass: true,
    part_b_total: 30,
    ...
  }
]
📊 Results store updated, total results: 1
```

**Gagal** ❌ - Kalau ada error:
```
❌ Error adding result: {
  message: "...",
  code: "...",
  details: "...",
  hint: "..."
}
```

---

## Common Issues & Solutions:

### ❌ "interviewerId: undefined" atau empty
**Masalah**: Tidak ada value saat submit
**Solusi**:
1. Pastikan sudah klik "Pilih Pewawancara" di `/interviewer/select`
2. Refresh page: `Ctrl+Shift+R` (hard refresh)
3. Check localStorage: Buka DevTools → Application → Storage → Local Storage → lihat `auth-store`

### ❌ "Error: column ... does not exist"
**Masalah**: Field name salah di database
**Solusi**:
1. Check field names di Supabase table `assessment_results`
2. Pastikan snake_case: `part_a_results`, `part_b_total`, dsb
3. Check RLS policies di Supabase - apakah user bisa insert?

### ❌ "Error: permission denied"
**Masalah**: RLS policy blocked
**Solusi**:
1. Di Supabase → assessment_results → RLS Policies
2. Pastikan ada policy yang allow INSERT
3. Atau temporarily disable RLS untuk testing: `ALTER TABLE assessment_results DISABLE ROW LEVEL SECURITY;`

### ❌ "Network error" atau "Failed to fetch"
**Masalah**: Koneksi ke Supabase gagal
**Solusi**:
1. Check `.env.local` - VITE_SUPABASE_URL & VITE_SUPABASE_KEY benar?
2. Check Supabase project status (https://app.supabase.com/)
3. Check browser network tab (F12 → Network) - lihat request ke Supabase

---

## Testing Checklist:

- [ ] Form lengkap semua field
- [ ] Console tidak ada red error messages
- [ ] Log menunjukkan interviewerId ada value (bukan undefined)
- [ ] Payload sent ke Supabase terlihat di console
- [ ] Success message muncul (`✅ Result successfully saved`)
- [ ] Alert tidak muncul dengan error message
- [ ] Success modal muncul
- [ ] Kembali ke dashboard
- [ ] Candidate status berubah ke "✓ Selesai" (dalam 3 detik, auto-refresh)
- [ ] Klik candidate yang sama - button menjadi "✓ Selesai" (disabled)

---

## Last Resort - Manual Check di Supabase:

1. Buka Supabase dashboard
2. Pergi ke **Table Editor** → `assessment_results` table
3. Lihat row terakhir (paling bawah)
4. Check apakah data ada dengan:
   - candidate_id yang benar
   - part_a_pass, part_b_total ada nilai
   - submitted_at = timestamp terbaru

Kalau data ada di Supabase tapi dashboard tidak show, berarti masalah di refresh logic. Kalau tidak ada di Supabase sama sekali, berarti error di submit.

---

## Report Format (jika ada masalah):

Tolong screenshot:
1. Browser console saat submit (dengan semua log terlihat)
2. Error message dari alert (jika ada)
3. Supabase table `assessment_results` (lihat latest rows)
4. `.env.local` VITE_SUPABASE values (blur key saja)

---

**Status**: 🔧 Debugging ready  
**Next**: Follow testing checklist above
