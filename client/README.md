# ISSA Parent App

Vite SPA untuk pengalaman orang tua ISSA. Backend harus tersedia dan mengizinkan origin frontend yang dipakai.

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

## Experience model

Primary navigation sekarang sengaja dibatasi menjadi:

- `/` — **Hari ini**
- `/journey` — **Perjalanan**
- `/schedule` — **Jadwal**

Detail kontekstual tetap tersedia melalui `/attendance`, `/progress`, dan `/progress/:lessonId`, tetapi bukan primary navigation.

Baca `PARENT_EXPERIENCE_MODEL.md` sebelum mengubah IA, visual philosophy, atau interpretasi data parent-facing.

Hasil produksi ada di `dist/`. Pada Vercel, `vercel.json` meneruskan semua route SPA ke entry aplikasi.
