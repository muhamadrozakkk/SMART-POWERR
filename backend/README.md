# Backend SMART POWER WEB

Backend minimal ini menyediakan REST API mock untuk menghubungkan frontend dengan sumber data yang terstruktur. Belum ada database, autentikasi sungguhan, koneksi ESP32, atau PZEM-004T; semua respons diberi penanda `simulation: true`.

## Menjalankan

```bash
npm install
npm run dev
```

Server berjalan di `http://localhost:4000`.

Endpoint yang tersedia:

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/readings?limit=10`
- `GET /api/device`
- `GET /api/alarms`
- `GET /api/prediction`
- `GET /api/energy/distribution`
- `GET /api/settings`
- `PATCH /api/settings` untuk perubahan sementara di memory

Gunakan `backend/.env.example` sebagai acuan konfigurasi lokal.
