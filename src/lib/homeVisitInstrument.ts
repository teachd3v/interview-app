export interface HomeVisitQuestion {
  id: string;
  section: 'A' | 'B' | 'C';
  aspect: string;
  indicator: string;
  type: 'Ya/Tidak' | 'Skala 1-4';
  options?: {
    label: string;
    score: number;
  }[];
  keterangan?: string;
}

export const homeVisitInstrument: HomeVisitQuestion[] = [
  // BAGIAN A - WAJIB
  {
    id: 'a1',
    section: 'A',
    aspect: 'Wajib',
    indicator: 'Orangtua/Ibu/Wali bersedia mendukung calon PM dalam aktivitas program YES dari awal sampai akhir',
    type: 'Ya/Tidak',
    keterangan: 'Jika terdapat jawaban tidak, walau hanya satu dari tiga indikator di atas maka dinyatakan Tidak Lolos.'
  },
  {
    id: 'a2',
    section: 'A',
    aspect: 'Wajib',
    indicator: 'Orangtua/Ibu/Wali bersedia bersinergi dengan YES dalam memantau perkembangan calon PM',
    type: 'Ya/Tidak',
    keterangan: 'Jika terdapat jawaban tidak, walau hanya satu dari tiga indikator di atas maka dinyatakan Tidak Lolos.'
  },
  {
    id: 'a3',
    section: 'A',
    aspect: 'Wajib',
    indicator: 'Orangtua/Ibu/Wali bersedia mendukung calon PM untuk melanjutkan pendidikan ke perguruan tinggi',
    type: 'Ya/Tidak',
    keterangan: 'Jika terdapat jawaban tidak, walau hanya satu dari tiga indikator di atas maka dinyatakan Tidak Lolos.'
  },
  
  // BAGIAN B - LATAR BELAKANG KELUARGA
  {
    id: 'b1',
    section: 'B',
    aspect: 'Latar Belakang Keluarga',
    indicator: 'Pekerjaan Orangtua/Ibu/Wali calon penerima manfaat',
    type: 'Skala 1-4',
    options: [
      { label: 'Orangtua/Ibu/Wali bekerja di sektor formal dan bukan satu-satunya tulang punggung keluarga', score: 1 },
      { label: 'Orangtua/Ibu/Wali bekerja di sektor formal dan menjadi satu-satunya tulang punggung keluarga', score: 2 },
      { label: 'Orangtua/Ibu/Wali bekerja di sektor informal dan bukan satu-satunya tulang punggung keluarga', score: 3 },
      { label: 'Orangtua/Ibu/Wali bekerja di sektor informal dan menjadi satu-satunya tulang punggung keluarga', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },
  {
    id: 'b2',
    section: 'B',
    aspect: 'Latar Belakang Keluarga',
    indicator: 'Penghasilan Orangtua/Ibu/Wali calon penerima manfaat',
    type: 'Skala 1-4',
    options: [
      { label: '< Rp4.000.001', score: 1 },
      { label: 'Rp3.000.001 - Rp4.000.000', score: 2 },
      { label: 'Rp1.500.001 - Rp3.000.000', score: 3 },
      { label: '≤ Rp1.500.000', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },
  {
    id: 'b3',
    section: 'B',
    aspect: 'Latar Belakang Keluarga',
    indicator: 'Status tempat tinggal',
    type: 'Skala 1-4',
    options: [
      { label: 'Rumah pribadi yang sederhana dengan jumlah anggota keluarga ≤ 4', score: 1 },
      { label: 'Rumah pribadi yang sederhana dengan jumlah anggota keluarga ≥ 5', score: 2 },
      { label: 'Bukan rumah pribadi tanpa biaya sewa (tumpangan, asrama atau panti asuhan)', score: 3 },
      { label: 'Bukan rumah pribadi dengan biaya sewa (kontrakan)', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },
  {
    id: 'b4',
    section: 'B',
    aspect: 'Latar Belakang Keluarga',
    indicator: 'Peralatan elektronik rumah yang dimiliki',
    type: 'Skala 1-4',
    options: [
      { label: 'Memiliki ≥ 4 peralatan elektronik; memiliki mobil pribadi', score: 1 },
      { label: 'Memiliki ≥ 4 peralatan elektronik; memiliki > 1 motor pribadi', score: 2 },
      { label: 'Memiliki ≥ 4 peralatan elektronik; hanya memiliki 1 motor pribadi', score: 3 },
      { label: 'Hanya memiliki ≤ 3 peralatan elektronik inti; tidak memiliki kendaraan pribadi', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },
  {
    id: 'b5',
    section: 'B',
    aspect: 'Latar Belakang Keluarga',
    indicator: 'Upaya keluarga mengawasi perkembangan belajar calon penerima manfaat',
    type: 'Skala 1-4',
    options: [
      { label: 'Keluarga sama sekali tidak mengontrol perkembangan belajar calon PM', score: 1 },
      { label: 'Keluarga jarang mengontrol perkembangan belajar calon PM (hanya tiap tahun)', score: 2 },
      { label: 'Keluarga sering mengontrol perkembangan belajar calon PM (hanya tiap semester)', score: 3 },
      { label: 'Keluarga selalu mengontrol perkembangan belajar calon PM (setiap bulan)', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },

  // BAGIAN C - LATAR BELAKANG PENERIMA MANFAAT
  {
    id: 'c1',
    section: 'C',
    aspect: 'Latar Belakang Penerima Manfaat',
    indicator: 'Kondisi fisik',
    type: 'Skala 1-4',
    options: [
      { label: 'Difabel atau memiliki penyakit berat yang harus ditangani secara khusus', score: 1 },
      { label: 'Pernah dirawat karena penyakit yang akut, atau memiliki keluhan suatu penyakit berat', score: 2 },
      { label: 'Berbadan sehat dan kondisi fisik kurang stabil (mudah sakit)', score: 3 },
      { label: 'Berbadan sehat dan kondisi fisik stabil', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },
  {
    id: 'c2',
    section: 'C',
    aspect: 'Latar Belakang Penerima Manfaat',
    indicator: 'Akhlak calon penerima manfaat terhadap anggota keluarga',
    type: 'Skala 1-4',
    options: [
      { label: 'Calon PM memiliki akhlak yang tidak baik terhadap anggota keluarga', score: 1 },
      { label: 'Calon PM memiliki akhlak yang cukup/kurang baik terhadap anggota keluarga', score: 2 },
      { label: 'Calon PM memiliki akhlak yang baik terhadap anggota keluarga', score: 3 },
      { label: 'Calon PM memiliki akhlak yang baik terhadap anggota keluarga dan mengajak anggota keluarga yang lain untuk berakhlak yang sama', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },
  {
    id: 'c3',
    section: 'C',
    aspect: 'Latar Belakang Penerima Manfaat',
    indicator: 'Akhlak calon penerima manfaat dengan tetangga dan teman sebaya',
    type: 'Skala 1-4',
    options: [
      { label: 'Calon PM memiliki akhlak yang tidak baik terhadap tetangga dan teman sebaya', score: 1 },
      { label: 'Calon PM memiliki akhlak yang cukup/kurang baik terhadap tetangga dan teman sebaya', score: 2 },
      { label: 'Calon PM memiliki akhlak yang baik terhadap tetangga dan teman sebaya', score: 3 },
      { label: 'Calon PM memiliki akhlak yang baik terhadap tetangga dan teman sebaya, serta mengajak mereka untuk melakukan perbuatan yang sama', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },
  {
    id: 'c4',
    section: 'C',
    aspect: 'Latar Belakang Penerima Manfaat',
    indicator: 'Aktivitas belajar calon penerima manfaat di rumah',
    type: 'Skala 1-4',
    options: [
      { label: 'Tidak pernah belajar', score: 1 },
      { label: 'Hanya belajar saat akan ada ujian', score: 2 },
      { label: 'Mengerjakan PR atau tugas di rumah dan mempersiapkan ujian dengan baik', score: 3 },
      { label: 'Selalu mengulang pelajaran, mengerjakan PR/tugas di rumah, dan mempersiapkan ujian dengan baik', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },
  {
    id: 'c5',
    section: 'C',
    aspect: 'Latar Belakang Penerima Manfaat',
    indicator: 'Keterlibatan calon penerima manfaat dalam kegiatan organisasi, komunitas, kepanitiaan, dan-lain-lain',
    type: 'Skala 1-4',
    options: [
      { label: 'Tidak aktif sama sekali dalam kegiatan organisasi, komunitas atau kepanitiaan', score: 1 },
      { label: 'Pernah aktif dalam sebuah organisasi, komunitas atau kepanitiaan', score: 2 },
      { label: 'Aktif sebagai anggota dalam sebuah organisasi, komunitas atau kepanitiaan', score: 3 },
      { label: 'Aktif sebagai pengurus inti dalam sebuah organisasi, komunitas atau kepanitiaan', score: 4 },
    ],
    keterangan: 'Jika skor di bawah 71 keterangannya tidak disarankan, jika skor di bawah 86 keterangan dipertimbangkan, jika skor diatas 86 keterangannya disarankan'
  },
];
