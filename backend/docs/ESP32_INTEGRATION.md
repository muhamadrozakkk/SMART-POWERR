# Integrasi ESP32 + PZEM-004T

ESP32 mengirim pembacaan setiap 5 detik ke `POST https://<domain>/api/readings` dengan header `x-api-key`.

Contoh payload:

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

Contoh alur Arduino:

```cpp
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

WiFiClientSecure client;
HTTPClient http;
client.setInsecure(); // prototipe saja; versi akhir wajib memasang sertifikat root
http.begin(client, API_URL);
http.addHeader("Content-Type", "application/json");
http.addHeader("x-api-key", DEVICE_API_KEY);

StaticJsonDocument<384> doc;
doc["device_id"] = "ESP32-001";
doc["voltage"] = pzem.voltage();
doc["current"] = pzem.current();
doc["power"] = pzem.power();
doc["energy"] = pzem.energy();
doc["frequency"] = pzem.frequency();
doc["power_factor"] = pzem.pf();
String payload;
serializeJson(doc, payload);
http.POST(payload);
http.end();
```

LCD tetap dapat menampilkan data terakhir secara lokal ketika Wi-Fi atau backend tidak tersedia. Jangan menaruh API key di repository publik.
