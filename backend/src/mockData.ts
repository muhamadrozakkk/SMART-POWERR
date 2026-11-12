export interface PowerReading {
  time: string;
  power: number;
  energy: number;
  current: number;
  voltage: number;
}

export interface DeviceStatus {
  name: string;
  deviceId: string;
  online: boolean;
  lastUpdate: string;
  wifi: string;
  sensor: string;
  lcd: string;
}

export interface AlarmRecord {
  type: string;
  time: string;
  value: string;
  status: string;
  severity: "low" | "medium" | "high";
}

export const powerHistory: PowerReading[] = [
  { time: "10:00", power: 250, energy: 5.1, current: 1.2, voltage: 219.6 },
  { time: "12:00", power: 300, energy: 5.7, current: 1.4, voltage: 220.0 },
  { time: "14:00", power: 410, energy: 6.5, current: 1.6, voltage: 220.2 },
  { time: "16:00", power: 720, energy: 7.3, current: 2.4, voltage: 220.2 },
  { time: "18:00", power: 480, energy: 8.0, current: 1.8, voltage: 220.7 },
  { time: "20:00", power: 560, energy: 8.6, current: 1.9, voltage: 220.6 },
  { time: "22:00", power: 460, energy: 9.2, current: 1.7, voltage: 220.1 },
  { time: "00:00", power: 800, energy: 10.0, current: 2.5, voltage: 220.1 },
  { time: "02:00", power: 545, energy: 10.6, current: 1.8, voltage: 220.7 },
  { time: "04:00", power: 600, energy: 11.2, current: 1.9, voltage: 220.3 },
  { time: "06:00", power: 680, energy: 11.9, current: 2.1, voltage: 220.1 },
  { time: "08:00", power: 820, energy: 12.8, current: 2.6, voltage: 220.4 },
  { time: "10:00", power: 421, energy: 13.4, current: 1.92, voltage: 220.4 },
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

export const alarms: AlarmRecord[] = [
  { type: "Konsumsi daya tinggi", time: "18 Mei 2025, 20:12", value: "1.850 W", status: "Selesai", severity: "medium" },
  { type: "Perangkat offline", time: "12 Mei 2025, 08:45", value: "3 menit", status: "Selesai", severity: "low" },
  { type: "Tegangan abnormal", time: "04 Mei 2025, 14:21", value: "235.2 V", status: "Selesai", severity: "high" },
];

export const settings = {
  powerLimit: 1500,
  monthlyCostTarget: 250000,
  monitoringIntervalSeconds: 5,
  highUsageNotifications: true,
  dailySummary: true,
};

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export const contactMessages: ContactMessage[] = [];
