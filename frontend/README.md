# SMART POWER WEB Frontend

## Menjalankan lokal

```bash
npm install
copy .env.example .env.local
npm run dev
```

Frontend memakai kontrak API backend dengan field `snake_case`. Semua request dashboard dikirim melalui `src/lib/api.ts` dan token JWT otomatis dikirim sebagai `Authorization: Bearer`.

## Environment

- `NEXT_PUBLIC_API_URL` — URL backend, untuk production `https://smartpower-production.up.railway.app`.

Frontend ini tidak memakai fallback localhost atau data simulasi untuk dashboard. Untuk deploy Vercel, isi `NEXT_PUBLIC_API_URL` dengan URL Railway lalu redeploy.
