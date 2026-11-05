# SMART POWER WEB Frontend

## Menjalankan lokal

```bash
npm install
copy .env.example .env.local
npm run dev
```

Frontend memakai kontrak API backend dengan field `snake_case`. Semua request dashboard dikirim melalui `src/lib/api.ts` dan token JWT otomatis dikirim sebagai `Authorization: Bearer`.

## Environment

- `NEXT_PUBLIC_API_BASE_URL` — URL backend, contoh `http://localhost:4000` atau URL Railway.
- `NEXT_PUBLIC_USE_MOCK=true` — memakai data simulasi dengan bentuk respons yang sama seperti backend.
- `NEXT_PUBLIC_USE_MOCK=false` — memakai backend nyata.

Untuk deploy Vercel, isi `NEXT_PUBLIC_API_BASE_URL` dengan URL Railway dan gunakan `NEXT_PUBLIC_USE_MOCK=false`, lalu redeploy.
