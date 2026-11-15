# SMART POWER WEB Backend

Backend untuk menerima telemetry ESP32/PZEM-004T, menyimpan data ke PostgreSQL, dan menyajikan data dashboard melalui REST API.

## Menjalankan lokal

```bash
npm install
copy .env.example .env
npm run migrate
npm run seed
npm run dev
```

Server berjalan di `http://localhost:4000`. Salin `.env.example` ke `.env`, lalu isi konfigurasi sesuai lingkungan.

## Environment production

Konfigurasikan variabel berikut di Railway sebelum deploy:

- `DATABASE_URL` — URL koneksi PostgreSQL.
- `JWT_SECRET` — secret acak yang kuat untuk menandatangani token sesi.
- `DEVELOPER_EMAIL` dan `DEVELOPER_PASSWORD` — kredensial akun developer yang dibuat saat backend mulai. Password harus minimal 12 karakter. Jika salah satu kosong atau password terlalu pendek, pembuatan akun developer dilewati dengan peringatan. Jika email sudah terdaftar, backend hanya memastikan role menjadi `DEVELOPER`; password tersimpan tidak diubah.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, dan `SMTP_FROM` — konfigurasi email untuk lupa password.
- `FRONTEND_URL` — URL frontend yang dipakai pada tautan reset password, misalnya `https://nama-aplikasi.vercel.app`.
- `CORS_ORIGINS` — daftar origin frontend yang diizinkan, dipisahkan koma. `https://smart-powerr.vercel.app` selalu diizinkan oleh konfigurasi backend.
- `DEVICE_API_KEY` — kunci kompatibilitas untuk perangkat lama. Perangkat baru mendapat API key sendiri saat dibuat melalui `POST /api/devices`.
- `NODE_ENV=production` — menandai deployment production dan menonaktifkan seed demo.

`PORT` disediakan oleh Railway. `SMTP_PORT` biasanya `587` atau `465`. Jangan commit secret atau file `.env` ke repository.

## Perintah utama

- `npm run typecheck` — pemeriksaan TypeScript
- `npm run build` — build produksi
- `npm run migrate` — menjalankan migrasi PostgreSQL
- `npm run seed` — membuat akun demo, device, dan setting awal untuk development saja. Perintah ini ditolak saat `NODE_ENV=production`; isi `DEMO_EMAIL` dan `DEMO_PASSWORD` secara eksplisit di `.env` lokal, dengan password minimal 12 karakter.
- `npm run test` — unit test perhitungan energi dan validasi
- `npm run simulate:esp32` — simulator POST telemetry ESP32

## Dokumentasi

- [Kontrak API](docs/API_CONTRACT.md)
- [Integrasi ESP32](docs/ESP32_INTEGRATION.md)
- [Deployment Railway](docs/DEPLOY_RAILWAY.md)

Endpoint utama mencakup `GET/POST /api/devices` (daftar perangkat dan pendaftaran khusus DEVELOPER), `POST /api/readings` (telemetry dengan header `x-api-key`), `GET /api/telemetry/:deviceId` (data terbaru dan riwayat khusus pemilik), readings terbaru/riwayat, cost summary, settings, notifications, dan status device. Setelah menambah migrasi, jalankan `npm run migrate` sebelum memakai endpoint baru.
