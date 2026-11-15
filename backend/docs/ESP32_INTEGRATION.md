# Integrasi ESP32 + PZEM-004T

Daftarkan perangkat dari Dashboard Developer. Salin `device_id` dan API key yang ditampilkan satu kali, lalu tautkan perangkat ke akun pengguna. Firmware ESP32 pada [`firmware/esp32_smartpower/esp32_smartpower.ino`](../../firmware/esp32_smartpower/esp32_smartpower.ino) mengirim enam nilai PZEM setiap 5 detik ke Railway `POST /api/readings` menggunakan header `x-api-key: <API_KEY_PERANGKAT>`. API key tidak dikirim di JSON.

Contoh payload:

```json
{
  "device_id": "SPW-<ID_DARI_DASHBOARD>",
  "timestamp": "2026-11-05T12:00:00.000Z",
  "voltage": 220.4,
  "current": 1.92,
  "power": 421,
  "energy": 8.42,
  "frequency": 50.01,
  "power_factor": 0.94
}
```

## Memasang firmware

1. Buka folder `firmware/esp32_smartpower` sebagai sketch Arduino IDE.
2. Pasang library ArduinoJson dan PZEM004Tv30 melalui Library Manager.
3. Isi SSID/password Wi-Fi, Device ID, dan API key dari Dashboard Developer di bagian konfigurasi atas sketch.
4. Periksa pin UART PZEM. Sketch menggunakan RX GPIO 16 dan TX GPIO 17 sebagai nilai awal; ubah sesuai kabel alat Anda.
5. Pilih board dan port ESP32, unggah sketch, lalu buka Serial Monitor pada 115200 baud.

Sketch memvalidasi HTTPS dengan sertifikat root ISRG Root X2 dan menyinkronkan jam lewat NTP sebelum mengirim. Railway dapat mengganti rantai sertifikat; jika sertifikat backend berubah, perbarui root CA dari [daftar sertifikat resmi Let's Encrypt](https://letsencrypt.org/certificates/).

Jika backend menjawab `401`, periksa API key di header. `404 Device ID belum terdaftar` berarti ID belum dibuat lewat Dashboard Developer atau tidak sama dengan ID pada payload. Setelah `200`, periksa status perangkat dan nilai sensor di dashboard.

LCD tetap dapat menampilkan data terakhir secara lokal ketika Wi-Fi atau backend tidak tersedia. Jangan commit SSID, password Wi-Fi, atau API key ke repository publik.
