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
TZ=Asia/Jakarta
DEMO_EMAIL=rozak@example.com
DEMO_PASSWORD=<password-demo-yang-aman>
```

4. Jalankan migration dan seed sekali setelah database tersedia:

```bash
npm install
npm run migrate
npm run seed
npm run build
npm start
```

5. Set health check Railway ke `/health`. Pastikan respons menunjukkan `database: connected`.
6. Salin domain publik Railway ke Vercel sebagai `NEXT_PUBLIC_API_URL`.
7. Uji ESP32 menggunakan simulator:

```bash
DEVICE_API_KEY=... SIMULATOR_URL=https://domain-railway/api/readings npm run simulate:esp32 -- --once
```

Tarif pada seed masih `0` sebagai placeholder. Isi tarif hanya setelah diverifikasi dari sumber resmi PLN.
