'use strict';

const DEMO_TIMESTAMP = '2026-07-27T12:00:00.000Z';

const teacher = {
  id: 1,
  NIP: '2026001001',
  name: 'Rani Prameswari, M.Pd.',
  password: 'GuruDemo2026',
};

const demoClass = {
  id: 1,
  name: '1A',
  SPP: 450000,
};

const students = [
  {
    id: 1,
    NIM: '2026071001',
    name: 'Ari Wibowo',
    age: '10',
    gender: 'Male',
    birthDate: '2015-05-12',
    photoIndex: 0,
  },
  {
    id: 101,
    NIM: '2026071002',
    name: 'Naya Putri',
    age: '10',
    gender: 'Female',
    birthDate: '2015-11-27',
    photoIndex: 1,
  },
  {
    id: 102,
    NIM: '2026071003',
    name: 'Raka Pratama',
    age: '10',
    gender: 'Male',
    birthDate: '2015-02-18',
    photoIndex: 2,
  },
  {
    id: 103,
    NIM: '2026071004',
    name: 'Sinta Maharani',
    age: '10',
    gender: 'Female',
    birthDate: '2015-07-09',
    photoIndex: 3,
  },
  {
    id: 104,
    NIM: '2026071005',
    name: 'Dimas Saputra',
    age: '10',
    gender: 'Male',
    birthDate: '2015-09-21',
    photoIndex: 4,
  },
  {
    id: 105,
    NIM: '2026071006',
    name: 'Bima Aditya',
    age: '10',
    gender: 'Male',
    birthDate: '2015-03-30',
    photoIndex: 5,
  },
  {
    id: 106,
    NIM: '2026071007',
    name: 'Laila Rahma',
    age: '10',
    gender: 'Female',
    birthDate: '2015-06-14',
    photoIndex: 6,
  },
  {
    id: 107,
    NIM: '2026071008',
    name: 'Fajar Nugraha',
    age: '10',
    gender: 'Male',
    birthDate: '2015-08-08',
    photoIndex: 7,
  },
];

const parent = {
  id: 1,
  NIM: '2026071001',
  password: 'OrangTua2026',
  email: 'parent.2026071001@issa.local',
  studentNim: '2026071001',
};

const lessons = [
  {
    code: 'MAT',
    name: 'Matematika',
    KKM: 75,
    desc: 'Bilangan, pecahan, representasi diagram, dan pemecahan masalah.',
  },
  {
    code: 'BIN',
    name: 'Bahasa Indonesia',
    KKM: 73,
    desc: 'Membaca pemahaman, menulis, menyimak, dan presentasi.',
  },
  {
    code: 'IPA',
    name: 'Ilmu Pengetahuan Alam',
    KKM: 75,
    desc: 'Pengamatan, proyek sains, dan eksperimen sederhana.',
  },
  {
    code: 'IPS',
    name: 'Ilmu Pengetahuan Sosial',
    KKM: 74,
    desc: 'Lingkungan sosial dan kehidupan bermasyarakat.',
  },
  {
    code: 'PP',
    name: 'Pendidikan Pancasila',
    KKM: 75,
    desc: 'Nilai kebersamaan, tanggung jawab, dan partisipasi.',
  },
  {
    code: 'SENI',
    name: 'Seni Budaya',
    KKM: 72,
    desc: 'Ekspresi visual, pameran karya, dan apresiasi seni.',
  },
  {
    code: 'BIG',
    name: 'Bahasa Inggris',
    KKM: 72,
    desc: 'Kosakata dan komunikasi dasar.',
  },
];

const assignments = [
  {
    code: 'MAT-BASE',
    name: 'Latihan Bilangan',
    type: 'Task',
    desc: 'Latihan dasar untuk membaca strategi perhitungan.',
  },
  {
    code: 'PEC-REP',
    name: 'Latihan Representasi Pecahan',
    type: 'Task',
    desc: 'Menggunakan gambar dan diagram untuk merepresentasikan pecahan.',
  },
  {
    code: 'PEC-QUIZ',
    name: 'Kuis Pecahan',
    type: 'Quiz',
    desc: 'Kuis pecahan dengan pemeriksaan langkah penyelesaian.',
  },
  {
    code: 'READ-BASE',
    name: 'Membaca Pemahaman Awal',
    type: 'Task',
    desc: 'Membaca teks pendek dan menjawab pertanyaan faktual.',
  },
  {
    code: 'READ-NEXT',
    name: 'Membaca Pemahaman Lanjutan',
    type: 'Quiz',
    desc: 'Membaca teks dan menjelaskan alasan jawaban.',
  },
  {
    code: 'SCIENCE',
    name: 'Proyek Sains',
    type: 'Project',
    desc: 'Proyek sains berbasis pengamatan dan catatan proses.',
  },
  {
    code: 'PRESENT',
    name: 'Presentasi Kelompok',
    type: 'Project',
    desc: 'Presentasi hasil kerja kelompok secara terstruktur.',
  },
  {
    code: 'REFLECT',
    name: 'Refleksi Mingguan',
    type: 'Task',
    desc: 'Refleksi singkat mengenai dukungan dan strategi yang dicoba.',
  },
];

const schedules = [
  ['Monday', 'MAT'],
  ['Monday', 'BIN'],
  ['Tuesday', 'IPA'],
  ['Tuesday', 'BIG'],
  ['Wednesday', 'MAT'],
  ['Wednesday', 'PP'],
  ['Thursday', 'BIN'],
  ['Thursday', 'SENI'],
  ['Friday', 'IPS'],
  ['Friday', 'IPA'],
];

const activities = [
  {
    name: 'Pameran Karya Kelas',
    date: '2026-07-10T08:00:00.000Z',
    desc: 'Pameran karya siswa yang menampilkan proses, gambar, dan catatan proyek.',
  },
  {
    name: 'Presentasi Proyek Sains',
    date: '2026-07-14T08:00:00.000Z',
    desc: 'Presentasi kelas mengenai pengamatan pada proyek sains.',
  },
  {
    name: 'Kegiatan Literasi Pagi',
    date: '2026-07-17T00:30:00.000Z',
    desc: 'Kegiatan literasi dengan membaca mandiri dan berbagi ringkasan.',
  },
  {
    name: 'Pertemuan Orang Tua',
    date: '2026-07-20T08:00:00.000Z',
    desc: 'Pertemuan untuk meninjau record pembelajaran dan konteks dukungan.',
  },
  {
    name: 'Presentasi Kelas',
    date: '2026-07-22T08:00:00.000Z',
    desc: 'Siswa menyampaikan hasil kerja kelompok secara bergiliran.',
  },
  {
    name: 'Apresiasi Belajar Bulanan',
    date: '2026-07-24T08:00:00.000Z',
    desc: 'Refleksi pencapaian dan dukungan yang akan dicoba berikutnya.',
  },
];

function score(studentNim, lessonCode, assignmentCode, value, recordedAt, desc) {
  return {
    studentNim,
    lessonCode,
    assignmentCode,
    value,
    recordedAt,
    desc,
  };
}

const scores = [
  score('2026071001', 'MAT', 'MAT-BASE', 92, '2026-06-25T08:00:00.000Z', 'Ari menyelesaikan latihan bilangan dan memeriksa kembali jawabannya.'),
  score('2026071001', 'MAT', 'PEC-REP', 84, '2026-07-10T08:00:00.000Z', 'Ari memakai diagram untuk membandingkan pecahan.'),
  score('2026071001', 'MAT', 'PEC-QUIZ', 87, '2026-07-24T08:00:00.000Z', 'Nilai terbaru Kuis Pecahan.'),
  score('2026071001', 'BIN', 'READ-BASE', 82, '2026-07-01T08:00:00.000Z', 'Jawaban membaca disampaikan dengan runtut.'),
  score('2026071001', 'IPA', 'SCIENCE', 88, '2026-07-14T08:00:00.000Z', 'Catatan pengamatan proyek sains lengkap.'),
  score('2026071001', 'SENI', 'PRESENT', 84, '2026-07-18T08:00:00.000Z', 'Ari menjelaskan pilihan gambar pada karya kelompok.'),
  score('2026071001', 'BIG', 'REFLECT', 78, '2026-07-21T08:00:00.000Z', 'Refleksi singkat diselesaikan sesuai instruksi.'),

  score('2026071002', 'BIN', 'READ-BASE', 68, '2026-06-26T08:00:00.000Z', 'Naya mencoba menandai kata kunci pada bacaan.'),
  score('2026071002', 'BIN', 'READ-NEXT', 74, '2026-07-10T08:00:00.000Z', 'Naya menggunakan catatan singkat sebelum menjawab.'),
  score('2026071002', 'BIN', 'REFLECT', 80, '2026-07-24T08:00:00.000Z', 'Hasil membaca menunjukkan peningkatan bertahap.'),
  score('2026071002', 'MAT', 'MAT-BASE', 72, '2026-07-02T08:00:00.000Z', 'Latihan awal mendekati KKM.'),
  score('2026071002', 'MAT', 'PEC-REP', 77, '2026-07-16T08:00:00.000Z', 'Representasi pecahan diselesaikan lebih konsisten.'),
  score('2026071002', 'IPA', 'SCIENCE', 79, '2026-07-18T08:00:00.000Z', 'Naya mengikuti urutan pengamatan proyek.'),
  score('2026071002', 'PP', 'PRESENT', 81, '2026-07-22T08:00:00.000Z', 'Naya menyampaikan bagian presentasinya.'),

  score('2026071003', 'MAT', 'MAT-BASE', 82, '2026-06-29T08:00:00.000Z', 'Nilai matematika berada pada baseline yang stabil.'),
  score('2026071003', 'MAT', 'PEC-QUIZ', 84, '2026-07-24T08:00:00.000Z', 'Nilai tetap stabil pada periode dengan attendance campuran.'),
  score('2026071003', 'BIN', 'READ-NEXT', 78, '2026-07-08T08:00:00.000Z', 'Raka menjawab pertanyaan bacaan dengan cukup konsisten.'),
  score('2026071003', 'IPA', 'SCIENCE', 83, '2026-07-14T08:00:00.000Z', 'Pengamatan proyek tercatat lengkap.'),
  score('2026071003', 'IPS', 'REFLECT', 80, '2026-07-17T08:00:00.000Z', 'Refleksi diselesaikan setelah kembali hadir.'),
  score('2026071003', 'PP', 'PRESENT', 81, '2026-07-21T08:00:00.000Z', 'Bagian presentasi disampaikan sesuai pembagian tugas.'),
  score('2026071003', 'BIG', 'READ-BASE', 77, '2026-07-23T08:00:00.000Z', 'Kosakata dasar digunakan dalam jawaban.'),

  score('2026071004', 'MAT', 'MAT-BASE', 79, '2026-06-30T08:00:00.000Z', 'Hasil berada di atas KKM.'),
  score('2026071004', 'MAT', 'PEC-REP', 81, '2026-07-13T08:00:00.000Z', 'Representasi pecahan disusun bersama kelompok.'),
  score('2026071004', 'BIN', 'READ-NEXT', 80, '2026-07-09T08:00:00.000Z', 'Sinta menjelaskan alasan jawaban.'),
  score('2026071004', 'IPA', 'SCIENCE', 82, '2026-07-14T08:00:00.000Z', 'Kontribusi proyek kelompok tercatat.'),
  score('2026071004', 'PP', 'PRESENT', 83, '2026-07-22T08:00:00.000Z', 'Presentasi kelompok berlangsung runtut.'),
  score('2026071004', 'SENI', 'PRESENT', 85, '2026-07-10T08:00:00.000Z', 'Karya kelompok disiapkan untuk pameran.'),
  score('2026071004', 'BIG', 'REFLECT', 76, '2026-07-23T08:00:00.000Z', 'Refleksi mingguan diselesaikan.'),

  score('2026071005', 'MAT', 'MAT-BASE', 76, '2026-07-03T08:00:00.000Z', 'Satu dari sedikit record akademik Dimas.'),
  score('2026071005', 'BIN', 'READ-BASE', 74, '2026-07-17T08:00:00.000Z', 'Record membaca tersedia, konteks tambahan belum tersedia.'),

  score('2026071006', 'MAT', 'MAT-BASE', 83, '2026-06-29T08:00:00.000Z', 'Baseline matematika stabil.'),
  score('2026071006', 'MAT', 'PEC-QUIZ', 84, '2026-07-24T08:00:00.000Z', 'Hasil terbaru dekat dengan baseline.'),
  score('2026071006', 'BIN', 'READ-NEXT', 81, '2026-07-08T08:00:00.000Z', 'Pemahaman bacaan stabil.'),
  score('2026071006', 'IPA', 'SCIENCE', 82, '2026-07-14T08:00:00.000Z', 'Proyek sains diselesaikan sesuai instruksi.'),
  score('2026071006', 'IPS', 'REFLECT', 80, '2026-07-17T08:00:00.000Z', 'Refleksi mingguan ringkas dan faktual.'),
  score('2026071006', 'PP', 'PRESENT', 82, '2026-07-22T08:00:00.000Z', 'Presentasi disampaikan sesuai bagian.'),
  score('2026071006', 'BIG', 'READ-BASE', 79, '2026-07-23T08:00:00.000Z', 'Kosakata digunakan secara konsisten.'),

  score('2026071007', 'MAT', 'MAT-BASE', 80, '2026-06-30T08:00:00.000Z', 'Latihan matematika diselesaikan.'),
  score('2026071007', 'MAT', 'PEC-REP', 82, '2026-07-13T08:00:00.000Z', 'Representasi pecahan disusun dengan rapi.'),
  score('2026071007', 'BIN', 'READ-NEXT', 83, '2026-07-09T08:00:00.000Z', 'Jawaban bacaan disertai alasan.'),
  score('2026071007', 'IPA', 'SCIENCE', 84, '2026-07-14T08:00:00.000Z', 'Catatan proyek sains tersedia.'),
  score('2026071007', 'PP', 'PRESENT', 81, '2026-07-22T08:00:00.000Z', 'Laila menyampaikan bagian presentasi.'),
  score('2026071007', 'SENI', 'PRESENT', 84, '2026-07-10T08:00:00.000Z', 'Karya disiapkan untuk pameran kelas.'),
  score('2026071007', 'BIG', 'REFLECT', 78, '2026-07-23T08:00:00.000Z', 'Refleksi mingguan diselesaikan.'),

  score('2026071008', 'MAT', 'MAT-BASE', 78, '2026-06-30T08:00:00.000Z', 'Latihan bilangan selesai.'),
  score('2026071008', 'MAT', 'PEC-QUIZ', 81, '2026-07-24T08:00:00.000Z', 'Kuis pecahan diselesaikan.'),
  score('2026071008', 'BIN', 'READ-NEXT', 80, '2026-07-09T08:00:00.000Z', 'Jawaban membaca disampaikan dengan runtut.'),
  score('2026071008', 'IPA', 'SCIENCE', 86, '2026-07-14T08:00:00.000Z', 'Proyek sains dicatat dan dipresentasikan.'),
  score('2026071008', 'IPS', 'REFLECT', 79, '2026-07-17T08:00:00.000Z', 'Refleksi kegiatan ditulis singkat.'),
  score('2026071008', 'PP', 'PRESENT', 82, '2026-07-22T08:00:00.000Z', 'Presentasi kelas diselesaikan.'),
  score('2026071008', 'SENI', 'PRESENT', 85, '2026-07-10T08:00:00.000Z', 'Karya proyek dipilih untuk pameran.'),
];

function journal(studentNim, type, observedAt, content, voiceCaptureType = null) {
  return { studentNim, type, observedAt, content, voiceCaptureType };
}

const journals = [
  journal('2026071001', 'observation', '2026-07-08T08:00:00.000Z', 'Guru mencatat Ari menggunakan diagram pecahan untuk memeriksa kesesuaian gambar dan nilai pecahan.'),
  journal('2026071001', 'strength', '2026-07-13T08:00:00.000Z', 'Ari menjelaskan langkah penyelesaian setelah menunjuk bagian-bagian pada gambar pecahan.'),
  journal('2026071001', 'student_reflection', '2026-07-16T08:00:00.000Z', 'Aku lebih mudah memeriksa pecahan ketika gambarnya dibagi menjadi bagian yang sama.', 'direct_quote'),
  journal('2026071001', 'milestone', '2026-07-22T08:00:00.000Z', 'Dalam diskusi kelas, Ari membandingkan dua diagram sebelum menyampaikan jawabannya.'),
  journal('2026071001', 'support_note', '2026-07-24T08:00:00.000Z', 'Dukungan yang dicoba adalah menyediakan diagram kosong agar Ari dapat menunjukkan proses pemeriksaan jawabannya.'),

  journal('2026071002', 'challenge', '2026-07-02T08:00:00.000Z', 'Catatan awal menunjukkan Naya masih melewatkan beberapa informasi penting pada bacaan.'),
  journal('2026071002', 'support_note', '2026-07-09T08:00:00.000Z', 'Dukungan yang dicoba adalah menandai kata kunci dan menulis ringkasan satu kalimat.'),
  journal('2026071002', 'observation', '2026-07-17T08:00:00.000Z', 'Naya menggunakan strategi menandai kata kunci sebelum menjawab pertanyaan membaca.'),
  journal('2026071002', 'milestone', '2026-07-24T08:00:00.000Z', 'Nilai membaca Naya menunjukkan peningkatan bertahap dalam periode ini.'),

  journal('2026071003', 'observation', '2026-07-06T08:00:00.000Z', 'Raka memiliki beberapa catatan Izin dan Sakit; konteks penyebab ketidakhadiran belum tersedia.'),
  journal('2026071003', 'support_note', '2026-07-15T08:00:00.000Z', 'Guru mencatat perlunya memahami konteks kehadiran sebelum menentukan dukungan berikutnya.'),
  journal('2026071003', 'strength', '2026-07-24T08:00:00.000Z', 'Score Raka tetap relatif stabil pada periode dengan attendance yang campuran.'),

  journal('2026071004', 'observation', '2026-07-07T08:00:00.000Z', 'Sinta menyusun pembagian tugas bersama kelompok sebelum mulai bekerja.'),
  journal('2026071004', 'strength', '2026-07-10T08:00:00.000Z', 'Sinta merangkum ide kelompok dan membantu menyiapkan karya untuk pameran.'),
  journal('2026071004', 'student_reflection', '2026-07-18T08:00:00.000Z', 'Saya lebih berani menjelaskan ketika kelompok sudah menyepakati urutan presentasi.', 'direct_quote'),
  journal('2026071004', 'milestone', '2026-07-22T08:00:00.000Z', 'Dalam presentasi kelas, Sinta menyampaikan hasil kolaborasi kelompok secara runtut.'),

  journal('2026071005', 'observation', '2026-07-17T08:00:00.000Z', 'Data Dimas pada periode ini masih terbatas; konteks tambahan belum tersedia.'),

  journal('2026071006', 'observation', '2026-07-03T08:00:00.000Z', 'Bima mengikuti instruksi latihan dan menyelesaikan tugas sesuai waktu yang tersedia.'),
  journal('2026071006', 'strength', '2026-07-14T08:00:00.000Z', 'Catatan Bima menunjukkan pola pengerjaan yang stabil tanpa perubahan yang dramatis.'),
  journal('2026071006', 'support_note', '2026-07-23T08:00:00.000Z', 'Dukungan rutin dilanjutkan dengan kesempatan memeriksa jawaban sebelum dikumpulkan.'),

  journal('2026071007', 'observation', '2026-07-09T08:00:00.000Z', 'Laila mencatat hasil kerja dan menjelaskan langkah yang dilakukan pada tugas kelompok.'),
  journal('2026071007', 'strength', '2026-07-16T08:00:00.000Z', 'Journal aktif Laila menunjukkan kontribusi yang konsisten pada kegiatan kelas.'),
  journal('2026071007', 'support_note', '2026-07-23T08:00:00.000Z', 'Guru mempertahankan catatan proses kerja Laila; bukti foto untuk catatan ini belum tersedia.'),

  journal('2026071008', 'observation', '2026-07-10T08:00:00.000Z', 'Fajar menyiapkan karya proyek untuk pameran kelas dan mencatat bahan yang digunakan.'),
  journal('2026071008', 'strength', '2026-07-14T08:00:00.000Z', 'Dalam proyek sains, Fajar menyampaikan hasil pengamatan kepada kelompok.'),
  journal('2026071008', 'milestone', '2026-07-22T08:00:00.000Z', 'Fajar menyelesaikan presentasi kelas dengan merujuk pada catatan proyek.'),
];

function feedback(studentNim, observedAt, content) {
  return { studentNim, observedAt, content };
}

const feedbacks = [
  feedback('2026071001', '2026-07-08T08:00:00.000Z', 'Guru mencatat Ari mulai menggunakan diagram untuk memeriksa jawaban pecahan.'),
  feedback('2026071001', '2026-07-16T08:00:00.000Z', 'Ari menjelaskan hubungan antara gambar dan nilai pecahan saat diskusi kelas.'),
  feedback('2026071001', '2026-07-24T08:00:00.000Z', 'Dalam periode ini Ari memperoleh 87 pada Kuis Pecahan dan menggunakan diagram untuk menjelaskan proses pemeriksaannya.'),
  feedback('2026071002', '2026-07-09T08:00:00.000Z', 'Naya mencoba strategi menandai kata kunci pada latihan membaca.'),
  feedback('2026071002', '2026-07-24T08:00:00.000Z', 'Catatan dan score menunjukkan peningkatan bertahap setelah Naya mencoba ringkasan singkat sebelum menjawab.'),
  feedback('2026071003', '2026-07-15T08:00:00.000Z', 'Raka memiliki beberapa catatan Izin dan Sakit; konteks ketidakhadiran perlu dipahami sebelum menentukan dukungan.'),
  feedback('2026071003', '2026-07-24T08:00:00.000Z', 'Score Raka relatif stabil. Catatan kehadiran tetap perlu ditinjau bersama konteks yang belum tersedia.'),
  feedback('2026071004', '2026-07-22T08:00:00.000Z', 'Sinta berkontribusi dalam kolaborasi kelompok dan menyampaikan bagian presentasinya secara runtut.'),
  feedback('2026071005', '2026-07-17T08:00:00.000Z', 'Record Dimas masih terbatas; diperlukan lebih banyak catatan sebelum menyusun kesimpulan perkembangan.'),
  feedback('2026071006', '2026-07-23T08:00:00.000Z', 'Catatan Bima menunjukkan attendance dan score yang relatif stabil dalam periode ini.'),
  feedback('2026071007', '2026-07-23T08:00:00.000Z', 'Laila memiliki journal aktif yang mencatat proses kerja dan kontribusi pada kegiatan kelas.'),
  feedback('2026071008', '2026-07-22T08:00:00.000Z', 'Fajar menghubungkan catatan proyek sains dengan presentasi dan pameran karya kelas.'),
];

const evidence = {
  studentNim: '2026071001',
  title: 'Lembar kerja diagram pecahan',
  category: 'work',
  description: 'Hasil kerja Ari yang memperlihatkan gambar pecahan dan langkah pemeriksaan jawaban.',
  observedAt: '2026-07-16T08:00:00.000Z',
  fileUrl: 'https://res.cloudinary.com/dombq6plz/image/upload/v1785061944/issa/student-evidence/1/nqwcs1arjdclckglhssf.png',
  cloudinaryPublicId: 'issa/student-evidence/1/nqwcs1arjdclckglhssf',
  format: 'png',
  fileSize: 2073604,
};

function weekdaysBetween(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

const attendanceDates = weekdaysBetween('2026-06-22', '2026-07-24');

const attendanceExceptions = {
  '2026071001': {
    '2026-06-30': 'Izin',
    '2026-07-09': 'Alfa',
    '2026-07-20': 'Sakit',
  },
  '2026071002': {
    '2026-07-02': 'Sakit',
    '2026-07-03': 'Sakit',
  },
  '2026071003': {
    '2026-06-25': 'Izin',
    '2026-06-26': 'Izin',
    '2026-07-06': 'Sakit',
    '2026-07-07': 'Sakit',
    '2026-07-20': 'Izin',
  },
  '2026071004': {
    '2026-07-01': 'Izin',
  },
  '2026071005': {
    '2026-07-08': 'Sakit',
    '2026-07-09': 'Sakit',
  },
  '2026071006': {
    '2026-07-13': 'Izin',
  },
  '2026071007': {
    '2026-06-29': 'Sakit',
    '2026-07-21': 'Izin',
  },
  '2026071008': {
    '2026-07-15': 'Izin',
  },
};

function buildAttendances() {
  return students.flatMap((student) => attendanceDates.map((attendanceDate) => ({
    studentNim: student.NIM,
    attendanceDate,
    status: attendanceExceptions[student.NIM]?.[attendanceDate] || 'Hadir',
    version: 1,
  })));
}

module.exports = {
  DEMO_TIMESTAMP,
  activities,
  assignments,
  buildAttendances,
  demoClass,
  evidence,
  feedbacks,
  journals,
  lessons,
  parent,
  schedules,
  scores,
  students,
  teacher,
};
