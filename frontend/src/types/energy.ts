export type MetricStatus = "normal" | "stable" | "good" | "warning" | "danger";

export interface EnergyReading {
  label: string;
  value: string;
  unit: string;
  status: string;
  statusTone: MetricStatus;
  icon: string;
  accent: string;
  trend: number[];
}

export interface PowerReading {
  time: string;
  power: number;
  energy: number;
  current: number;
  voltage: number;
  cost?: number;
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

export interface Alarm {
  type: string;
  time: string;
  value: string;
  status: string;
  severity: "low" | "medium" | "high";
}

export interface CostSummary {
  title: string;
  value: string;
  detail: string;
  progress: number;
  tone: "amber" | "green";
}

export interface Prediction {
  day: string;
  value: number;
}

export interface EnergyDistribution {
  name: string;
  value: number;
  color: string;
}
