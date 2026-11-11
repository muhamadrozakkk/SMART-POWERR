# Deploy backend ke Railway

1. Buat project Railway dan tambahkan service PostgreSQL.
2. Tambahkan service dari repository ini dengan root directory `backend`.
3. Set environment variables:

```env
NODE_ENV=production
DATABASE_URL=<Railway menyediakan ini dari PostgreSQL>
DEVICE_API_KEY=<random-secret-untuk-ESP32>
JWT_SECRET=<random-secret-untuk-JWT>
CORS_ORIGINS=https://frontend-two-sandy-90.vercel.app
FRONTEND_URL=https://frontend-two-sandy-90.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<alamat-email-pengirim>
SMTP_PASSWORD=<app-password-smtp>
SMTP_FROM=SMART POWER WEB <alamat-email-pengirim>
TZ=Asia/Jakarta
DEMO_EMAIL=rozak@example.com
DEMO_PASSWORD=<password-demo-yang-aman>
```

4. Jalankan migration sekali setelah database tersedia, atau biarkan perintah `npm start` menjalankannya sebelum server mulai:

```bash
npm install
npm run migrate
npm run seed
npm run build
npm start
```

5. Saat server mulai, akun Developer Utama otomatis dibuat jika belum ada:

   - Email: `muhamad.rozak@students.untidar.ac.id`
   - Password awal: `SMARPOWER123`
   - Role: `DEVELOPER`

   Ganti password awal melalui halaman lupa password setelah SMTP disetel.

6. Set health check Railway ke `/health`. Pastikan respons menunjukkan `database: connected`.
7. Salin domain publik Railway ke Vercel sebagai `NEXT_PUBLIC_API_URL`.
8. Uji ESP32 menggunakan simulator:

```bash
DEVICE_API_KEY=... SIMULATOR_URL=https://domain-railway/api/readings npm run simulate:esp32 -- --once
```

Tarif pada seed masih `0` sebagai placeholder. Isi tarif hanya setelah diverifikasi dari sumber resmi PLN.
