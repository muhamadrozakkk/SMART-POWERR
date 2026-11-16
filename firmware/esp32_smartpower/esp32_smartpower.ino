#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include <math.h>

// Isi kredensial Wi-Fi perangkat sebelum mengunggah firmware.
const char *WIFI_SSID = "ISI_NAMA_WIFI";
const char *WIFI_PASSWORD = "ISI_PASSWORD_WIFI";

const char *API_URL = "https://smartpower-production.up.railway.app/api/telemetry";
const char *API_KEY = "d1b4b7855fc05023373a768dba42b755df391cfbbe8ebcb4";
const char *DEVICE_ID = "SPW-F05A9D42B9A8435C";

// UART2 default ESP32 DevKit: RX2 GPIO16, TX2 GPIO17.
constexpr int PZEM_RX_PIN = 16;
constexpr int PZEM_TX_PIN = 17;
constexpr unsigned long SEND_INTERVAL_MS = 5000;

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);
WiFiClientSecure secureClient;
unsigned long lastSendAt = 0;

bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.printf("Menyambungkan ke Wi-Fi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 15000) {
    delay(250);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("ERROR: Wi-Fi belum tersambung; akan dicoba kembali.");
    return false;
  }

  Serial.print("Wi-Fi tersambung. IP: ");
  Serial.println(WiFi.localIP());
  return true;
}

bool validReading(float voltage, float current, float power, float energy,
                  float frequency, float powerFactor) {
  return isfinite(voltage) && voltage >= 0 && voltage <= 300 &&
         isfinite(current) && current >= 0 && current <= 100 &&
         isfinite(power) && power >= 0 && power <= 30000 &&
         isfinite(energy) && energy >= 0 && energy <= 10000000 &&
         isfinite(frequency) && frequency >= 40 && frequency <= 70 &&
         isfinite(powerFactor) && powerFactor >= 0 && powerFactor <= 1;
}

void sendTelemetry() {
  if (!connectWiFi()) return;

  // Semua nilai berasal langsung dari PZEM004Tv30; tidak ada data buatan.
  const float voltage = pzem.voltage();
  const float current = pzem.current();
  const float power = pzem.power();
  const float energy = pzem.energy();
  const float frequency = pzem.frequency();
  const float powerFactor = pzem.pf();

  if (!validReading(voltage, current, power, energy, frequency, powerFactor)) {
    Serial.printf(
        "ERROR: Pembacaan PZEM tidak valid (V=%.3f, A=%.3f, W=%.3f, "
        "kWh=%.6f, Hz=%.3f, PF=%.4f); siklus ini dilewati.\n",
        voltage, current, power, energy, frequency, powerFactor);
    return;
  }

  StaticJsonDocument<256> document;
  document["device_id"] = DEVICE_ID;
  document["voltage"] = voltage;
  document["current"] = current;
  document["power"] = power;
  document["energy"] = energy;
  document["frequency"] = frequency;
  document["power_factor"] = powerFactor;

  String payload;
  serializeJson(document, payload);

  HTTPClient http;
  http.setTimeout(10000);
  if (!http.begin(secureClient, API_URL)) {
    Serial.println("ERROR: Gagal memulai koneksi HTTPS ke backend.");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  const int statusCode = http.POST(payload);
  const String response = statusCode > 0
                              ? http.getString()
                              : http.errorToString(statusCode);

  Serial.printf("HTTP status: %d\n", statusCode);
  Serial.printf("Response: %s\n", response.c_str());
  if (statusCode == 200) Serial.println("Telemetry berhasil diterima backend.");
  if (statusCode == 401) Serial.println("ERROR 401: API key tidak cocok.");
  http.end();
}

void setup() {
  Serial.begin(115200);
  WiFi.setAutoReconnect(true);

  // Sesuai permintaan untuk uji coba. Ini tidak memvalidasi sertifikat TLS.
  secureClient.setInsecure();

  connectWiFi();
  lastSendAt = millis() - SEND_INTERVAL_MS;
}

void loop() {
  const unsigned long now = millis();
  if (now - lastSendAt >= SEND_INTERVAL_MS) {
    lastSendAt = now;
    sendTelemetry();
  }
  delay(20);
}
