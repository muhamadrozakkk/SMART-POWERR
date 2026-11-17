# Deploy SMARTPOWER ke Railway dan Vercel

Workspace ini monorepo: `backend/` adalah Express + TypeScript + PostgreSQL; `frontend/` adalah Next.js; `firmware/` berisi sketch ESP32.

## Railway backend

Atur root directory service ke `backend` dan tambahkan PostgreSQL. Isi variabel berikut pada service backend:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<secret-acak-panjang>
DEVELOPER_EMAIL=<email-admin>
DEVELOPER_PASSWORD=<password-awal-minimal-12-karakter>
DEVICE_API_KEY=<secret-acak-panjang-untuk-key-global-opsional>
FRONTEND_URL=https://www.smartpower.web.id
CORS_ORIGINS=https://www.smartpower.web.id,https://smartpower.web.id,https://smart-powerr.vercel.app
```

Ganti `Postgres` pada reference variable sesuai nama service PostgreSQL Railway. `PORT` diisi otomatis oleh Railway. `CORS_ORIGINS` adalah daftar origin frontend dipisahkan koma; masukkan domain yang benar-benar dipakai untuk membuka website (tanpa path). Backend juga otomatis mengizinkan dua domain `smartpower.web.id`. `FRONTEND_URL` dipakai untuk membuat tautan reset password.

Set variabel SMTP berikut jika fitur lupa password harus mengirim email (tidak diperlukan agar ESP32 dapat mengirim telemetry):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<alamat-email-pengirim>
SMTP_PASSWORD=<app-password-email>
SMTP_FROM=<nama-dan-alamat-pengirim>
```

`DEVELOPER_EMAIL` dan `DEVELOPER_PASSWORD` hanya membuat akun developer bootstrap bila belum ada. Jika email sudah ada, backend tidak mengubah passwordnya.

## Vercel frontend

Tambahkan variabel pada project Vercel lalu redeploy:

```env
NEXT_PUBLIC_API_URL=https://smartpower-production.up.railway.app
```

## Endpoint dan ESP32

- Kirim data: `POST https://smartpower-production.up.railway.app/api/telemetry`
- Header: `Content-Type: application/json` dan `x-api-key: <API_KEY>`.
- Data terbaru: `GET /api/telemetry/latest` (memerlukan bearer token login).
- Histori: `GET /api/telemetry/history?from=<ISO-8601>&interval=hour` (memerlukan bearer token login; default 24 jam terakhir).

`DEVICE_API_KEY` mengizinkan key global yang sama. Perangkat yang didaftarkan di Dashboard Developer juga mendapat key unik yang bisa digunakan firmware tanpa `DEVICE_API_KEY`; keduanya diterima backend. Jangan simpan Wi-Fi atau API key dalam repo publik.

Firmware siap upload: [`../../firmware/esp32_pzem_telemetry.ino`](../../firmware/esp32_pzem_telemetry.ino). Isi SSID, password Wi-Fi, Device ID, dan API key. Sketch membaca PZEM melalui UART2 (RX 16, TX 17), sinkronisasi waktu NTP, memvalidasi HTTPS, lalu mengirim setiap 5 detik.

Health check Railway: `/health`. Dashboard menandai perangkat online setelah pembacaan baru diterima; bila offline, cek Serial Monitor ESP32, koneksi Wi-Fi, HTTP status, Device ID, dan header API key. Jangan jalankan `npm run seed` di production.
