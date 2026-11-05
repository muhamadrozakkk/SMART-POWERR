# SMART POWER WEB Backend

Backend produksi untuk menerima telemetry ESP32/PZEM-004T, menyimpan data ke PostgreSQL, dan menyajikan data dashboard melalui REST API.

## Menjalankan lokal

```bash
npm install
copy .env.example .env
npm run migrate
npm run seed
npm run dev
```

Server berjalan di `http://localhost:4000`. Isi `DATABASE_URL`, `DEVICE_API_KEY`, dan `JWT_SECRET` sebelum menjalankan migrasi atau server produksi.

## Perintah utama

- `npm run typecheck` — pemeriksaan TypeScript
- `npm run build` — build produksi
- `npm run migrate` — menjalankan migrasi PostgreSQL
- `npm run seed` — membuat akun demo, device, dan setting awal
- `npm run test` — unit test perhitungan energi dan validasi
- `npm run simulate:esp32` — simulator POST telemetry ESP32

## Dokumentasi

- [Kontrak API](docs/API_CONTRACT.md)
- [Integrasi ESP32](docs/ESP32_INTEGRATION.md)
- [Deployment Railway](docs/DEPLOY_RAILWAY.md)

Endpoint utama mencakup login JWT, POST readings dengan `x-api-key`, readings terbaru/riwayat, cost summary, settings, notifications, dan status device. Endpoint kompatibilitas dashboard lama tetap tersedia agar frontend saat ini dapat bermigrasi bertahap.
