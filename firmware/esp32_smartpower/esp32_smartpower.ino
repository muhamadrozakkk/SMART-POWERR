#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include <time.h>
#include <math.h>

// Isi konfigurasi ini dari Dashboard Developer dan Wi-Fi rumah.
const char *WIFI_SSID = "ISI_NAMA_WIFI";
const char *WIFI_PASSWORD = "ISI_PASSWORD_WIFI";
const char *API_URL = "https://smartpower-production.up.railway.app/api/readings";
const char *DEVICE_ID = "ISI_DEVICE_ID";
const char *DEVICE_API_KEY = "ISI_API_KEY_PERANGKAT";

// Contoh pin UART2 ESP32 DevKit: RX2=16, TX2=17.
// Sesuaikan RX/TX dengan sambungan PZEM pada alat Anda.
constexpr int PZEM_RX_PIN = 16;
constexpr int PZEM_TX_PIN = 17;
constexpr unsigned long SEND_INTERVAL_MS = 5000;

PZEM004Tv30 pzem(Serial2, PZEM_RX_PIN, PZEM_TX_PIN);
WiFiClientSecure secureClient;
unsigned long lastSendAt = 0;
bool clockReady = false;

const char ROOT_CA[] PROGMEM = R"ROOTCA(-----BEGIN CERTIFICATE-----
MIICGzCCAaGgAwIBAgIQQdKd0XLq7qeAwSxs6S+HUjAKBggqhkjOPQQDAzBPMQsw
CQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJuZXQgU2VjdXJpdHkgUmVzZWFyY2gg
R3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBYMjAeFw0yMDA5MDQwMDAwMDBaFw00
MDA5MTcxNjAwMDBaME8xCzAJBgNVBAYTAlVTMSkwJwYDVQQKEyBJbnRlcm5ldCBT
ZWN1cml0eSBSZXNlYXJjaCBHcm91cDEVMBMGA1UEAxMMSVNSRyBSb290IFgyMHYw
EAYHKoZIzj0CAQYFK4EEACIDYgAEzZvVn4CDCuwJSvMWSj5cz3es3mcFDR0HttwW
+1qLFNvicWDEukWVEYmO6gbf9yoWHKS5xcUy4APgHoIYOIvXRdgKam7mAHf7AlF9
ItgKbppbd9/w+kHsOdx1ymgHDB/qo0IwQDAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0T
AQH/BAUwAwEB/zAdBgNVHQ4EFgQUfEKWrt5LSDv6kviejM9ti6lyN5UwCgYIKoZI
zj0EAwMDaAAwZQIwe3lORlCEwkSHRhtFcP9Ymd70/aTSVaYgLXTWNLxBo1BfASdW
tL4ndQavEi51mI38AjEAi/V3bNTIZargCyzuFJ0nN6T5U6VR5CmD1/iQMVtCnwr1
/q4AaOeMSQ+2b1tbFfLn
-----END CERTIFICATE-----)ROOTCA";

bool connectWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.printf("Menyambungkan ke Wi-Fi: %s\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    for (int attempt = 0; attempt < 30 && WiFi.status() != WL_CONNECTED; attempt++) {
      delay(500);
      Serial.print('.');
    }
    Serial.println();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("Wi-Fi belum tersambung; akan dicoba lagi.");
      return false;
    }
    Serial.print("Wi-Fi tersambung. IP: ");
    Serial.println(WiFi.localIP());
  }

  if (!clockReady) {
    configTime(0, 0, "pool.ntp.org", "time.google.com");
    time_t now = time(nullptr);
    for (int attempt = 0; attempt < 30 && now < 1700000000; attempt++) {
      delay(500);
      now = time(nullptr);
    }
    clockReady = now >= 1700000000;
    if (!clockReady) Serial.println("Waktu belum tersinkron; TLS belum dapat dipakai.");
  }
  return clockReady;
}

bool validReading(float voltage, float current, float power, float energy, float frequency, float powerFactor) {
  return isfinite(voltage) && voltage >= 0 && voltage <= 300 &&
         isfinite(current) && current >= 0 && current <= 100 &&
         isfinite(power) && power >= 0 && power <= 30000 &&
         isfinite(energy) && energy >= 0 && energy <= 10000000 &&
         isfinite(frequency) && frequency >= 40 && frequency <= 70 &&
         isfinite(powerFactor) && powerFactor >= 0 && powerFactor <= 1;
}

void sendTelemetry() {
  if (!connectWiFi()) return;

  const float voltage = pzem.voltage();
  const float current = pzem.current();
  const float power = pzem.power();
  const float energy = pzem.energy();
  const float frequency = pzem.frequency();
  const float powerFactor = pzem.pf();
  if (!validReading(voltage, current, power, energy, frequency, powerFactor)) {
    Serial.println("Pembacaan PZEM tidak valid; data tidak dikirim.");
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
    Serial.println("Tidak dapat memulai koneksi HTTPS ke backend.");
    return;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", DEVICE_API_KEY);
  const int statusCode = http.POST(payload);
  const String responseBody = statusCode > 0 ? http.getString() : http.errorToString(statusCode);
  Serial.printf("POST telemetry: HTTP %d | %s\n", statusCode, responseBody.c_str());
  http.end();
}

void setup() {
  Serial.begin(115200);
  secureClient.setCACert(ROOT_CA);
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
