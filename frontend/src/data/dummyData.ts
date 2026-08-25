import type { Alarm, CostSummary, DeviceStatus, EnergyDistribution, EnergyReading, Prediction, PowerReading } from "@/types/energy";

export const energyMetrics: EnergyReading[] = [
  { label: "Daya Aktif", value: "421", unit: "W", status: "Penggunaan Normal", statusTone: "normal", icon: "bolt", accent: "blue", trend: [310, 355, 330, 372, 340, 356, 385, 370, 395, 421, 405, 421] },
  { label: "Arus", value: "1.92", unit: "A", status: "Penggunaan Normal", statusTone: "normal", icon: "current", accent: "sky", trend: [1.4, 1.55, 1.62, 1.48, 1.73, 1.58, 1.72, 1.64, 1.78, 1.67, 1.84, 1.92] },
  { label: "Tegangan", value: "220.4", unit: "V", status: "Stabil", statusTone: "stable", icon: "voltage", accent: "purple", trend: [218.9, 219.5, 220.1, 219.7, 220.2, 220.0, 220.8, 220.4, 221.1, 220.7, 220.9, 220.4] },
  { label: "Faktor Daya", value: "0.94", unit: "", status: "Baik", statusTone: "good", icon: "wave", accent: "amber", trend: [.84, .88, .86, .9, .89, .93, .91, .94, .92, .95, .94, .94] },
  { label: "Energi Hari Ini", value: "8.42", unit: "kWh", status: "Rp 5.640", statusTone: "good", icon: "energy", accent: "green", trend: [6.2, 6.8, 7.1, 6.9, 7.5, 7.9, 7.6, 8.0, 7.8, 8.2, 8.1, 8.42] },
];

export const powerHistory: PowerReading[] = [
  { time: "10:00", power: 250, energy: 5.1, current: 1.2, voltage: 219.6 },
  { time: "11:00", power: 290, energy: 5.4, current: 1.3, voltage: 220.1 },
  { time: "12:00", power: 300, energy: 5.7, current: 1.4, voltage: 220.0 },
  { time: "13:00", power: 560, energy: 6.1, current: 1.8, voltage: 220.4 },
  { time: "14:00", power: 410, energy: 6.5, current: 1.6, voltage: 220.2 },
  { time: "15:00", power: 575, energy: 6.9, current: 1.9, voltage: 220.5 },
  { time: "16:00", power: 720, energy: 7.3, current: 2.4, voltage: 220.2 },
  { time: "17:00", power: 610, energy: 7.7, current: 2.0, voltage: 220.4 },
  { time: "18:00", power: 480, energy: 8.0, current: 1.8, voltage: 220.7 },
  { time: "19:00", power: 650, energy: 8.3, current: 2.1, voltage: 220.4 },
  { time: "20:00", power: 560, energy: 8.6, current: 1.9, voltage: 220.6 },
  { time: "21:00", power: 520, energy: 8.9, current: 1.8, voltage: 220.2 },
  { time: "22:00", power: 460, energy: 9.2, current: 1.7, voltage: 220.1 },
  { time: "23:00", power: 630, energy: 9.6, current: 2.0, voltage: 220.3 },
  { time: "00:00", power: 800, energy: 10.0, current: 2.5, voltage: 220.1 },
  { time: "01:00", power: 660, energy: 10.3, current: 2.1, voltage: 220.4 },
  { time: "02:00", power: 545, energy: 10.6, current: 1.8, voltage: 220.7 },
  { time: "03:00", power: 520, energy: 10.9, current: 1.7, voltage: 220.2 },
  { time: "04:00", power: 600, energy: 11.2, current: 1.9, voltage: 220.3 },
  { time: "05:00", power: 580, energy: 11.5, current: 1.8, voltage: 220.4 },
  { time: "06:00", power: 680, energy: 11.9, current: 2.1, voltage: 220.1 },
  { time: "07:00", power: 1200, energy: 12.4, current: 3.8, voltage: 220.0 },
  { time: "08:00", power: 820, energy: 12.8, current: 2.6, voltage: 220.4 },
  { time: "09:00", power: 810, energy: 13.1, current: 2.5, voltage: 220.6 },
  { time: "10:00", power: 421, energy: 13.4, current: 1.92, voltage: 220.4 },
];

export const energyDistribution: EnergyDistribution[] = [
  { name: "Peralatan Rumah", value: 42, color: "#2388f2" },
  { name: "Penerangan", value: 25, color: "#2acb5c" },
  { name: "Elektronik", value: 18, color: "#ffb619" },
  { name: "Lainnya", value: 15, color: "#8947e9" },
];

export const deviceStatus: DeviceStatus = {
  name: "Smart Power Web",
  deviceId: "ESP32-001",
  online: true,
  lastUpdate: "10:30:45 WIB",
  wifi: "Terhubung",
  sensor: "PZEM-004T",
  lcd: "Aktif",
};

export const costSummaries: CostSummary[] = [
  { title: "Biaya Bulan Ini", value: "Rp 168.675", detail: "Dari estimasi Rp 250.000", progress: 67, tone: "amber" },
  { title: "Perkiraan Biaya Bulan Ini", value: "Rp 183.500", detail: "72% dari target Rp 250.000", progress: 72, tone: "green" },
];

export const recentReadings = [
  ["10:30:00", "220.4", "1.92", "421", "8.42", "5.640"],
  ["10:28:00", "220.6", "2.01", "442", "8.40", "5.616"],
  ["10:26:00", "220.1", "1.88", "414", "8.38", "5.592"],
  ["10:24:00", "220.3", "1.95", "429", "8.36", "5.568"],
  ["10:22:00", "219.9", "1.90", "417", "8.34", "5.544"],
];

export const predictionData: Prediction[] = [
  { day: "24/05", value: 5.9 }, { day: "25/05", value: 4.8 }, { day: "26/05", value: 6.6 },
  { day: "27/05", value: 5.8 }, { day: "28/05", value: 4.4 }, { day: "29/05", value: 5.3 }, { day: "30/05", value: 6.7 },
];

export const alarmData: Alarm[] = [
  { type: "Konsumsi daya tinggi", time: "18 Mei 2025, 20:12", value: "1.850 W", status: "Selesai", severity: "medium" },
  { type: "Perangkat offline", time: "12 Mei 2025, 08:45", value: "3 menit", status: "Selesai", severity: "low" },
  { type: "Tegangan abnormal", time: "04 Mei 2025, 14:21", value: "235.2 V", status: "Selesai", severity: "high" },
];

export const weeklyEnergy = [
  { day: "Sen", value: 28.4 }, { day: "Sel", value: 31.2 }, { day: "Rab", value: 26.8 },
  { day: "Kam", value: 34.1 }, { day: "Jum", value: 30.5 }, { day: "Sab", value: 37.6 }, { day: "Min", value: 32.9 },
];
