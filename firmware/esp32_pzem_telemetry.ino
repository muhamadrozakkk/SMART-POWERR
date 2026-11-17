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
#include <RTClib.h>
#include <time.h>

// Wi-Fi yang digunakan ESP32.
char ssid[] = "SMART";
char pass[] = "123456789";

// Backend SMARTPOWER.
const char *API_URL = "https://smartpower-production.up.railway.app/api/telemetry";
const char *API_KEY = "uqntZ77zsv2KwC2XjJk9Yw4i4FAoQQuLPhoGVLOez5U";
const char *DEVICE_ID = "SPW-18BE5BF4E177ACEC";

// Pin tetap sesuai rangkaian pada program lama.
#define BTN_MENU 32
#define BTN_UP   33
constexpr int PZEM_RX_PIN = 16;
constexpr int PZEM_TX_PIN = 17;
constexpr unsigned long SEND_INTERVAL_MS = 60UL * 1000UL;

HardwareSerial pzemSerial(2);
PZEM004Tv30 pzem(pzemSerial, PZEM_RX_PIN, PZEM_TX_PIN);
LiquidCrystal_I2C lcd(0x27, 20, 4);
RTC_DS3231 rtc;
Preferences prefs;
WiFiClientSecure secureClient;

int dayaVA[] = {450, 900, 900, 1300, 2200};
bool subsidi[] = {true, true, false, false, false};
float tarif[] = {415, 586, 1352, 1467.28, 1467.28};
const int jumlahDaya = 5;

int menu = 0;
int dayaIndex = 1;
float energyOffset = 0;
unsigned long holdStart = 0;
unsigned long lastBlynkSend = 0;
unsigned long lastTelemetrySend = 0;
unsigned long lastSensorRead = 0;
unsigned long lastWifiRetry = 0;
bool wifiConnected = false;
bool rtcReady = false;
bool hasValidReading = false;
bool lcdNeedsRefresh = true;
float latestVoltage = 0, latestCurrent = 0, latestPower = 0;
float latestEnergy = 0, latestFrequency = 0, latestPowerFactor = 0;
bool ntpSyncPending = false;
unsigned long lastRtcSyncAttempt = 0;
unsigned long lastRtcLog = 0;
unsigned long lastBlynkConnectAttempt = 0;

void beginNtpSync() {
  configTzTime("WIB-7", "pool.ntp.org", "time.google.com", "time.cloudflare.com");
  ntpSyncPending = true;
  lastRtcSyncAttempt = millis();
  Serial.println("NTP dimulai; RTC akan diselaraskan jika waktu internet tersedia.");
}

void syncRtcFromNtp() {
  if (!rtcReady || !ntpSyncPending) return;
  const time_t epoch = time(nullptr);
  if (epoch < 1704067200) {
    if (millis() - lastRtcSyncAttempt > 30000) {
      lastRtcSyncAttempt = millis();
      Serial.println("NTP belum tersedia; waktu RTC tetap digunakan.");
    }
    return;
  }

  struct tm jakartaTime;
  localtime_r(&epoch, &jakartaTime);
  const DateTime networkTime(jakartaTime.tm_year + 1900, jakartaTime.tm_mon + 1,
                             jakartaTime.tm_mday, jakartaTime.tm_hour,
                             jakartaTime.tm_min, jakartaTime.tm_sec);
  const DateTime rtcTime = rtc.now();
  const long drift = labs((long)networkTime.unixtime() - (long)rtcTime.unixtime());
  if (rtc.lostPower() || drift > 120) {
    rtc.adjust(networkTime);
    Serial.printf("RTC disinkronkan via NTP (WIB): %04d-%02d-%02d %02d:%02d:%02d\n",
                  networkTime.year(), networkTime.month(), networkTime.day(),
                  networkTime.hour(), networkTime.minute(), networkTime.second());
  } else {
    Serial.printf("RTC sudah sesuai NTP (selisih %ld detik).\n", drift);
  }
  ntpSyncPending = false;
}

String rtcTimestampWib() {
  if (!rtcReady) return "";
  const DateTime now = rtc.now();
  char value[32];
  snprintf(value, sizeof(value), "%04d-%02d-%02dT%02d:%02d:%02d+07:00",
           now.year(), now.month(), now.day(), now.hour(), now.minute(), now.second());
  return String(value);
}

void printRtcTime() {
  if (!rtcReady) {
    static bool rtcUnavailableLogged = false;
    if (!rtcUnavailableLogged) {
      Serial.println("RTC DS3231 tidak terdeteksi saat boot; periksa SDA=21, SCL=22, VCC, GND, dan alamat 0x68.");
      rtcUnavailableLogged = true;
    }
    return;
  }
  if (millis() - lastRtcLog < SEND_INTERVAL_MS) return;
  lastRtcLog = millis();
  const DateTime now = rtc.now();
  Serial.printf("RTC WIB: %02d-%02d-%04d %02d:%02d:%02d\n",
                now.day(), now.month(), now.year(), now.hour(), now.minute(), now.second());
}

void displayTimestamp() {
  lcd.setCursor(0, 3);
  if (!rtcReady) { lcd.print("RTC tidak tersedia  "); return; }
  const DateTime now = rtc.now();
  char line[21];
  snprintf(line, sizeof(line), "%02d/%02d %02d:%02d:%02d WIB",
           now.day(), now.month(), now.hour(), now.minute(), now.second());
  lcd.print(line);
  for (int i = strlen(line); i < 20; i++) lcd.print(' ');
}

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
  Serial.printf("Memulai koneksi Wi-Fi %s secara non-blocking.\n", ssid);
  wifiConnected = WiFi.status() == WL_CONNECTED;
  if (wifiConnected) {
    Serial.print("Wi-Fi terhubung. IP: ");
    Serial.println(WiFi.localIP());
    lcd.clear();
    lcd.print("WiFi Connected");
    beginNtpSync();
  } else {
    Serial.println("Wi-Fi offline; perangkat akan mencoba sambung ulang.");
    lcd.clear();
    lcd.print("Offline Mode");
  }
  return wifiConnected;
}

void maintainWiFi() {
  const bool wasConnected = wifiConnected;
  const wl_status_t status = WiFi.status();
  wifiConnected = status == WL_CONNECTED;
  if (wifiConnected && !wasConnected) beginNtpSync();
  if (wifiConnected || millis() - lastWifiRetry < 10000) return;
  if (status != WL_DISCONNECTED && status != WL_CONNECT_FAILED && status != WL_NO_SSID_AVAIL) return;

  lastWifiRetry = millis();
  Serial.println("Wi-Fi terputus; mencoba sambung ulang...");
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

  StaticJsonDocument<320> doc;
  doc["device_id"] = DEVICE_ID;
  doc["voltage"] = voltage;
  doc["current"] = current;
  doc["power"] = power;
  doc["energy"] = energy; // Nilai kWh kumulatif asli dari PZEM, tanpa offset LCD.
  doc["frequency"] = frequency;
  doc["power_factor"] = powerFactor;
  const String timestamp = rtcTimestampWib();
  if (timestamp.length()) doc["timestamp"] = timestamp;
  else Serial.println("RTC tidak tersedia; timestamp akan menggunakan waktu penerimaan backend.");
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
  struct ButtonState { int stable; int lastRead; unsigned long changedAt; };
  static ButtonState menuButton{HIGH, HIGH, 0};
  static ButtonState upButton{HIGH, HIGH, 0};
  static bool upLongActionDone = false;
  const unsigned long now = millis();

  auto updateButton = [now](ButtonState &button, int pin) {
    const int reading = digitalRead(pin);
    if (reading != button.lastRead) { button.lastRead = reading; button.changedAt = now; }
    if (now - button.changedAt >= 35 && reading != button.stable) {
      button.stable = reading;
      return reading == LOW ? 1 : 2; // pressed / released
    }
    return 0;
  };

  if (updateButton(menuButton, BTN_MENU) == 1) {
    menu = (menu + 1) % 3;
    lcd.clear();
    lcdNeedsRefresh = true;
  }

  const int upEvent = updateButton(upButton, BTN_UP);
  if (upEvent == 1) { holdStart = now; upLongActionDone = false; }
  if (upButton.stable == LOW && !upLongActionDone && menu == 1 && holdStart && now - holdStart >= 3000) {
    const float meterEnergy = pzem.energy();
    if (isfinite(meterEnergy)) { energyOffset = meterEnergy; simpanData(); }
    Serial.println(isfinite(meterEnergy) ? "Energi meter berhasil direset." : "Reset energi dilewati: pembacaan PZEM tidak valid.");
    upLongActionDone = true;
    lcdNeedsRefresh = true;
  }
  if (upEvent == 2) {
    if (!upLongActionDone && holdStart && now - holdStart < 3000 && menu == 2) {
      dayaIndex = (dayaIndex + 1) % jumlahDaya;
      simpanData();
      lcd.clear();
      lcdNeedsRefresh = true;
    }
    holdStart = 0;
  }
}

void setup() {
  Serial.begin(9600);
  Wire.begin(21, 22);
  pzemSerial.begin(9600, SERIAL_8N1, PZEM_RX_PIN, PZEM_TX_PIN);
  pinMode(BTN_MENU, INPUT_PULLUP);
  pinMode(BTN_UP, INPUT_PULLUP);

  rtcReady = rtc.begin();
  if (rtcReady) {
    Serial.println("RTC DS3231 terdeteksi.");
    if (rtc.lostPower()) {
      Serial.println("RTC kehilangan daya; memakai waktu kompilasi sementara hingga NTP tersedia.");
      rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }
  } else {
    Serial.println("ERROR: RTC DS3231 tidak terdeteksi. LCD dan monitoring tetap berjalan.");
  }

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
  lastSensorRead = millis() - SEND_INTERVAL_MS;
  lastBlynkSend = millis() - SEND_INTERVAL_MS;
  lastTelemetrySend = millis() - SEND_INTERVAL_MS;
}

void loop() {
  maintainWiFi();
  syncRtcFromNtp();
  printRtcTime();
  cekTombol();
  if (wifiConnected) {
    if (!Blynk.connected() && millis() - lastBlynkConnectAttempt >= 15000) {
      lastBlynkConnectAttempt = millis();
      Blynk.connect(500);
    }
    Blynk.run();
  }

  const unsigned long now = millis();
  const bool sampleDue = now - lastSensorRead >= SEND_INTERVAL_MS;
  if (sampleDue) {
    lastSensorRead = now;
    latestVoltage = pzem.voltage();
    latestCurrent = pzem.current();
    latestPower = pzem.power();
    latestEnergy = pzem.energy();
    latestFrequency = pzem.frequency();
    latestPowerFactor = pzem.pf();
    hasValidReading = validReading(latestVoltage, latestCurrent, latestPower,
                                   latestEnergy, latestFrequency, latestPowerFactor);
    if (!hasValidReading) {
      Serial.printf("ERROR PZEM: pembacaan tidak valid (V=%.2f, A=%.2f, W=%.2f, "
                    "kWh=%.3f, Hz=%.2f, PF=%.3f); siklus 60 detik ini dilewati.\n",
                    latestVoltage, latestCurrent, latestPower, latestEnergy,
                    latestFrequency, latestPowerFactor);
    } else {
      lcdNeedsRefresh = true;
      Serial.printf("Sampel sensor (interval 60 detik): V=%.2f V, I=%.3f A, P=%.2f W, E=%.4f kWh, f=%.2f Hz, PF=%.3f\n",
                    latestVoltage, latestCurrent, latestPower, latestEnergy,
                    latestFrequency, latestPowerFactor);
    }
  }

  if (!hasValidReading) {
    lcd.setCursor(0, 0);
    lcd.print("PZEM ERROR      ");
    lcd.setCursor(0, 1);
    lcd.print("Cek Sensor      ");
    delay(10);
    return;
  }

  const float voltage = latestVoltage;
  const float current = latestCurrent;
  const float power = latestPower;
  const float energyRaw = latestEnergy;
  const float frequency = latestFrequency;
  const float powerFactor = latestPowerFactor;
  float energyDisplay = energyRaw - energyOffset;
  if (energyDisplay < 0) energyDisplay = 0;
  const float biaya = energyDisplay * tarif[dayaIndex];

  if (lcdNeedsRefresh) {
    if (menu == 0) {
      lcd.setCursor(0, 0); lcd.printf("V:%.1f I:%.2f       ", voltage, current);
      lcd.setCursor(0, 1); lcd.printf("P:%.1f W            ", power);
      lcd.setCursor(0, 2); lcd.printf("F:%.1fHz PF:%.2f    ", frequency, powerFactor);
    } else if (menu == 1) {
      lcd.setCursor(0, 0); lcd.printf("E:%.3f kWh         ", energyDisplay);
      lcd.setCursor(0, 1); lcd.printf("Biaya: Rp %.0f     ", biaya);
      lcd.setCursor(0, 2); lcd.printf("Meter: %.3f kWh    ", energyRaw);
    } else {
      lcd.setCursor(0, 0); lcd.printf("Daya %d VA         ", dayaVA[dayaIndex]);
      lcd.setCursor(0, 1); lcd.print(subsidi[dayaIndex] ? "Subsidi            " : "Non Subsidi        ");
      lcd.setCursor(0, 2); lcd.printf("Tarif Rp %.2f/kWh  ", tarif[dayaIndex]);
    }
    lcdNeedsRefresh = false;
  }
  static unsigned long lastDisplayClock = 0;
  if (now - lastDisplayClock >= 1000) { displayTimestamp(); lastDisplayClock = now; }

  if (sampleDue && wifiConnected) {
    lastTelemetrySend = now;
    sendTelemetry(voltage, current, power, energyRaw, frequency, powerFactor);
  } else if (sampleDue) {
    Serial.println("Sampel valid, tetapi Wi-Fi offline; pengiriman dilewati.");
  }

  if (sampleDue && wifiConnected && Blynk.connected()) {
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
