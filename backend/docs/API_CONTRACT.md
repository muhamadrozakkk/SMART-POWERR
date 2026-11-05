# Kontrak API SMART POWER WEB

Base URL: `/api`

Semua field JSON menggunakan `snake_case`.

## Auth

`POST /auth/login`

```json
{ "email": "rozak@example.com", "password": "smartpower" }
```

Response berisi `{ token, user }`. Endpoint dashboard memakai `Authorization: Bearer <token>`.

## Pembacaan ESP32

`POST /readings` tidak memakai JWT, tetapi wajib memakai header `x-api-key`.

```json
{
  "device_id": "ESP32-001",
  "timestamp": "2026-11-05T12:00:00.000Z",
  "voltage": 220.4,
  "current": 1.92,
  "power": 421,
  "energy": 8.42,
  "frequency": 50.01,
  "power_factor": 0.94
}
```

Response sukses ringan: `{ "ok": true }`.

## Dashboard

- `GET /readings/latest?device_id=ESP32-001`
- `GET /readings?device_id=&from=&to=&interval=hour|day`
- `GET /cost/summary?device_id=`
- `GET /settings?device_id=`
- `PUT /settings?device_id=`
- `GET /notifications?unread_only=true`
- `PATCH /notifications/:id/read`
- `GET /devices/:id/status`

Semua endpoint dashboard dilindungi JWT. Perhitungan konsumsi energi memakai selisih pembacaan kumulatif; penurunan nilai dianggap reset meter dan tidak dihitung sebagai konsumsi negatif.
