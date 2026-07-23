# Server Module Architecture

ISSA memakai pragmatic modular monolith dengan dependency wiring yang eksplisit.
Model dan migration Sequelize tetap global karena association melintasi domain.

## Struktur module

Module ditempatkan di `server/modules/<domain>/` dan dapat memiliki:

- `<domain>.route.js`
- `<domain>.controller.js`
- `<domain>.service.js`
- `<domain>.repository.js`
- `<domain>.validator.js`

Tidak semua module wajib memiliki repository atau validator. Tambahkan layer hanya
bila responsibility domain membutuhkannya.

## Boundary

### Route

- Menuliskan endpoint, HTTP method, urutan middleware, dan controller secara langsung.
- Root route composer mengimpor setiap module route secara eksplisit.
- Endpoint tidak boleh dibentuk dari nama function atau filesystem scanner.

### Controller

- Membaca params, query, body, dan authenticated identity.
- Membentuk argument service, memanggil service, lalu mengirim response existing.
- Meneruskan error ke `next`.
- Tidak menjalankan query, transaction, atau business rule.

### Service

- Menangani domain validation, authorization domain, dan business rule.
- Mengorkestrasi repository dan memiliki transaction.
- Menghitung derived domain field, misalnya status Score berdasarkan Lesson.KKM.
- Tidak mengenal `req`, `res`, status HTTP, atau response body.

### Repository

- Menangani query Sequelize dan menerima transaction secara eksplisit.
- Tidak mengenal HTTP atau membentuk response API.
- Service-side duplicate check tidak menggantikan database unique constraint.
- Generic base repository tidak digunakan.

### Validator

- Menangani aturan input domain tanpa library validation tambahan.
- Mempertahankan jenis dan pesan error yang dipakai global error handler.

## Explicit wiring

Dependency memakai direct CommonJS import. Jangan menambahkan DI container,
dependency resolver berbasis string, positional injection, route generation,
`BaseController`, atau controller inheritance.
Login berada di Authentication service; route Parent/Teacher tetap eksplisit.
Verifikasi JWT request tetap menjadi middleware infrastructure global.

## Internal module dan public read model

Module internal, seperti Student, mempertahankan workflow dan response khusus
Teacher CMS. Public Student adalah aggregation read model terpisah untuk Parent
App dan tidak memakai controller atau service module internal.

Public repository boleh membaca beberapa model global secara langsung untuk
membangun response Parent, selama flow tetap read-only dan authorization berasal
dari authenticated parent identity.

## Contoh flow Feedback

1. `feedback.route.js` mendaftarkan `PUT /students/:id` beserta autentikasi.
2. Controller membaca request dan memanggil service.
3. Validator memeriksa feedback dan `observedAt`.
4. Service memverifikasi siswa dalam kelas teacher dan membandingkan snapshot.
5. Dalam satu transaction, repository memperbarui Student, menulis
   StudentFeedback bila berubah, dan menulis History.
6. Controller mengirim response update existing.
