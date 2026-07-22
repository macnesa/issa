# ISSA Parent App

Vite SPA untuk demo parent/student. Backend harus tersedia dan mengizinkan origin frontend yang dipakai.

```bash
npm install
npm run dev
npm run build
npm run preview
```

Konfigurasi API melalui `.env` lokal:

```text
VITE_API_BASE_URL=http://localhost:3000
```

Route utama: `/`, `/attendance`, `/progress`, `/progress/:lessonId`, `/schedule`, dan `/activities`.

Hasil produksi ada di `dist/`. Pada Vercel, `vercel.json` meneruskan semua route SPA ke entry aplikasi.
