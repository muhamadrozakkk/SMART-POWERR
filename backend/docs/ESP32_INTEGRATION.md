# Integrasi ESP32 + PZEM-004T

Daftarkan perangkat di Dashboard Developer, lalu salin Device ID dan API Key perangkat ke sketch [`firmware/esp32_pzem_telemetry.ino`](../../firmware/esp32_pzem_telemetry.ino). Sketch mengirim enam parameter PZEM tiap 5 detik ke `POST https://smartpower-production.up.railway.app/api/telemetry` dengan header `x-api-key`.

Body JSON memakai field `device_id`, `voltage`, `current`, `power`, `energy`, `frequency`, dan `power_factor`; backend memvalidasi rentang angka lalu menyimpan ke PostgreSQL `readings` dengan timestamp server. `timestamp` dapat dikirim opsional.

Pasang library ArduinoJson dan PZEM004Tv30 di Arduino IDE. Isi SSID/password Wi-Fi, Device ID, dan API key. Default UART2: RX GPIO 16 dan TX GPIO 17. Firmware sinkronisasi jam NTP untuk validasi TLS, jadi serial monitor perlu menunjukkan koneksi Wi-Fi dan HTTP 200 setelah upload.

Untuk pengujian manual, kirim payload JSON dari kontrak API dengan header `x-api-key`. API key perangkat unik dari Dashboard diterima; `DEVICE_API_KEY` Railway juga dapat digunakan sebagai key global. Bila menerima 401, periksa key dan Device ID. Bila 404, daftarkan Device ID terlebih dahulu. LCD tetap dapat memonitor lokal saat koneksi internet tidak tersedia.
