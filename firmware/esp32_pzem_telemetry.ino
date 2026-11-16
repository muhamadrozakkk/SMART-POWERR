#define BLYNK_TEMPLATE_ID "TMPL68JRjnT-u"
#define BLYNK_TEMPLATE_NAME "Monitoring Biaya KWh"
#define BLYNK_AUTH_TOKEN "1Ksr4RUlMyw5PNzLQV5r5TQXFFLvf-ib"

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>
#include <LiquidCrystal_I2C.h>
#include <HardwareSerial.h>
#include <Wire.h>
#include <Preferences.h>
#include <math.h>

// Wi-Fi dari program terdahulu.
char ssid[] = "Lossantos";
char pass[] = "losantos136";

// Backend SMARTPOWER.
const char *API_URL = "https://smartpower-production.up.railway.app/api/telemetry";
const char *API_KEY = "IydhPCJjFsuM77M7qJkF5PugT7buE5V__vqfV44QiiU";
const char *DEVICE_ID = "SPW-F05A9D42B9A8435C";

// Pin tetap sesuai rangkaian pada program lama.
#define BTN_MENU 32
#define BTN_UP   33
constexpr int PZEM_RX_PIN = 16;
constexpr int PZEM_TX_PIN = 17;
constexpr unsigned long SEND_INTERVAL_MS = 5000;

HardwareSerial pzemSerial(2);
PZEM004Tv30 pzem(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);
Preferences prefs;
WiFiClientSecure secureClient;

int dayaVA[] = {450, 900, 900, 1300, 2200};
bool subsidi[] = {true, true, false, false, false};
float tarif[] = {415, 586, 1352, 1467.28, 1467.28};
const int jumlahDaya = 5;

int menu = 0;
int dayaIndex = 1;
float energyOffset = 0;
unsigned long lastButton = 0;
unsigned long holdStart = 0;
unsigned long lastBlynkSend = 0;
unsigned long lastTelemetrySend = 0;
unsigned long lastWifiRetry = 0;
bool wifiConnected = false;

void simpanData();
void sendTelemetry(float voltage, float current, float power, float energy,
                   float frequency, float powerFactor);

// RESET kWh dari Blynk.
BLYNK_WRITE(V10) {
  if (param.asInt() == 1) {
    const float meterEnergy = pzem.energy();
    if (isfinite(meterEnergy)) {
      energyOffset = meterEnergy;
      simpanData();
    }
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("RESET DARI HP");
    delay(1500);
    lcd.clear();
  }
}

// GANTI DAYA dari Blynk.
BLYNK_WRITE(V11) {
  const int pilihan = param.asInt();
  if (pilihan >= 0 && pilihan < jumlahDaya) {
    dayaIndex = pilihan;
    simpanData();
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Ganti Daya HP");
    lcd.setCursor(0, 1);
    lcd.print(dayaVA[dayaIndex]);
    lcd.print(" VA");
    delay(1500);
    lcd.clear();
  }
}

void simpanData() {
  prefs.putInt("daya", dayaIndex);
  prefs.putFloat("offset", energyOffset);
}

bool connectWiFiAtStartup() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, pass);
  Serial.printf("Menyambungkan ke Wi-Fi %s", ssid);
  const unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 15000) {
    delay(500);
    Serial.print('.');
    lcd.print('.');
  }
  Serial.println();
  wifiConnected = WiFi.status() == WL_CONNECTED;
  if (wifiConnected) {
    Serial.print("Wi-Fi terhubung. IP: ");
    Serial.println(WiFi.localIP());
    lcd.clear();
    lcd.print("WiFi Connected");
  } else {
    Serial.println("Wi-Fi offline; perangkat akan mencoba sambung ulang.");
    lcd.clear();
    lcd.print("Offline Mode");
  }
  return wifiConnected;
}

void maintainWiFi() {
  wifiConnected = WiFi.status() == WL_CONNECTED;
  if (wifiConnected || millis() - lastWifiRetry < 10000) return;

  lastWifiRetry = millis();
  Serial.println("Wi-Fi terputus; mencoba sambung ulang...");
  WiFi.disconnect(false);
  WiFi.begin(ssid, pass);
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

void sendTelemetry(float voltage, float current, float power, float energy,
                   float frequency, float powerFactor) {
  if (!wifiConnected) return;

  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_ID;
  doc["voltage"] = voltage;
  doc["current"] = current;
  doc["power"] = power;
  doc["energy"] = energy; // Nilai kWh kumulatif asli dari PZEM, tanpa offset LCD.
  doc["frequency"] = frequency;
  doc["power_factor"] = powerFactor;
  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.setTimeout(10000);
  if (!http.begin(secureClient, API_URL)) {
    Serial.println("ERROR: Gagal memulai HTTPS ke backend.");
    return;
  }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  const int statusCode = http.POST(payload);
  const String response = statusCode > 0 ? http.getString() : http.errorToString(statusCode);
  Serial.printf("Telemetry HTTP %d | %s\n", statusCode, response.c_str());
  if (statusCode == 200) Serial.println("Data sensor diterima backend.");
  if (statusCode == 401) Serial.println("ERROR 401: API key perangkat salah.");
  http.end();
}

void cekTombol() {
  if (millis() - lastButton < 250) return;

  if (digitalRead(BTN_MENU) == LOW) {
    menu++;
    if (menu > 2) menu = 0;
    lcd.clear();
    lastButton = millis();
  }

  if (digitalRead(BTN_UP) == LOW) {
    if (holdStart == 0) holdStart = millis();
    if (menu == 1 && millis() - holdStart > 3000) {
      const float meterEnergy = pzem.energy();
      if (isfinite(meterEnergy)) {
        energyOffset = meterEnergy;
        simpanData();
      }
      lcd.clear();
      lcd.print("RESET MANUAL");
      delay(1500);
      lcd.clear();
      holdStart = 0;
      lastButton = millis();
    }
  } else {
    if (holdStart != 0 && millis() - holdStart < 3000 && menu == 2) {
      dayaIndex++;
      if (dayaIndex >= jumlahDaya) dayaIndex = 0;
      simpanData();
      lcd.clear();
    }
    holdStart = 0;
    lastButton = millis();
  }
}

void setup() {
  Serial.begin(9600);
  Wire.begin(21, 22);
  pzemSerial.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);
  pinMode(BTN_MENU, INPUT_PULLUP);
  pinMode(BTN_UP, INPUT_PULLUP);

  lcd.init();
  lcd.backlight();
  prefs.begin("energi", false);
  dayaIndex = prefs.getInt("daya", 1);
  if (dayaIndex < 0 || dayaIndex >= jumlahDaya) dayaIndex = 1;
  energyOffset = prefs.getFloat("offset", 0);

  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  connectWiFiAtStartup();

  Blynk.config(BLYNK_AUTH_TOKEN);
  if (wifiConnected) Blynk.connect(3000);

  // Mode uji HTTPS sesuai permintaan sebelumnya.
  secureClient.setInsecure();
  delay(1500);
  lcd.clear();
  lastBlynkSend = millis() - SEND_INTERVAL_MS;
  lastTelemetrySend = millis() - SEND_INTERVAL_MS;
}

void loop() {
  maintainWiFi();
  cekTombol();
  if (wifiConnected) Blynk.run();

  const float voltage = pzem.voltage();
  const float current = pzem.current();
  const float power = pzem.power();
  const float energyRaw = pzem.energy();
  const float frequency = pzem.frequency();
  const float powerFactor = pzem.pf();

  if (!validReading(voltage, current, power, energyRaw, frequency, powerFactor)) {
    Serial.printf("ERROR PZEM: pembacaan tidak valid (V=%.2f, A=%.2f, W=%.2f, "
                  "kWh=%.3f, Hz=%.2f, PF=%.3f); kirim dilewati.\n",
                  voltage, current, power, energyRaw, frequency, powerFactor);
    lcd.setCursor(0, 0);
    lcd.print("PZEM ERROR      ");
    lcd.setCursor(0, 1);
    lcd.print("Cek Sensor      ");
    delay(200);
    return;
  }

  float energyDisplay = energyRaw - energyOffset;
  if (energyDisplay < 0) energyDisplay = 0;
  const float biaya = energyDisplay * tarif[dayaIndex];

  if (menu == 0) {
    lcd.setCursor(0, 0);
    lcd.printf("V:%.1f I:%.2f", voltage, current);
    lcd.setCursor(0, 1);
    lcd.printf("P:%.1f W       ", power);
  } else if (menu == 1) {
    lcd.setCursor(0, 0);
    lcd.printf("E:%.3f kWh     ", energyDisplay);
    lcd.setCursor(0, 1);
    lcd.printf("Rp %.0f        ", biaya);
  } else {
    lcd.setCursor(0, 0);
    lcd.printf("Daya %d VA     ", dayaVA[dayaIndex]);
    lcd.setCursor(0, 1);
    lcd.print(subsidi[dayaIndex] ? "Subsidi         " : "Non Subsidi     ");
  }

  const unsigned long now = millis();
  if (wifiConnected && now - lastTelemetrySend >= SEND_INTERVAL_MS) {
    lastTelemetrySend = now;
    sendTelemetry(voltage, current, power, energyRaw, frequency, powerFactor);
  }

  if (wifiConnected && Blynk.connected() && now - lastBlynkSend >= SEND_INTERVAL_MS) {
    Blynk.virtualWrite(V1, voltage);
    Blynk.virtualWrite(V2, current);
    Blynk.virtualWrite(V3, power);
    Blynk.virtualWrite(V4, energyDisplay);
    Blynk.virtualWrite(V5, biaya);
    Blynk.virtualWrite(V6, dayaVA[dayaIndex]);
    Blynk.virtualWrite(V7, subsidi[dayaIndex] ? "Subsidi" : "Non Subsidi");
    Blynk.virtualWrite(V11, dayaIndex);
    lastBlynkSend = now;
  }

  delay(200);
}
