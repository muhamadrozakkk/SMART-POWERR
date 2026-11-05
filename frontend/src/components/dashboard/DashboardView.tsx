"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type ApiDeviceStatus, type CostSummary, type Reading, toDeviceStatus } from "@/lib/api";
import { energyMetrics } from "@/data/dummyData";
import type { EnergyDistribution as Distribution, PowerReading } from "@/types/energy";
import { AlarmStatus } from "@/components/dashboard/AlarmStatus";
import { CostSummary as CostSummaryCard } from "@/components/dashboard/CostSummary";
import { DataHistory } from "@/components/dashboard/DataHistory";
import { DeviceStatus } from "@/components/dashboard/DeviceStatus";
import { EnergyDistribution } from "@/components/dashboard/EnergyDistribution";
import { EnergyPrediction } from "@/components/dashboard/EnergyPrediction";
import { EnergySummary } from "@/components/dashboard/EnergySummary";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PowerChart } from "@/components/dashboard/PowerChart";
import { LiveCostCard } from "@/components/dashboard/LiveCostCard";
import { RelayControl } from "@/components/dashboard/RelayControl";

function timeDistribution(rows: Reading[]): Distribution[] {
  const groups = [{ name: "Pagi", hours: [5, 6, 7, 8, 9, 10], color: "#2388f2" }, { name: "Siang", hours: [11, 12, 13, 14, 15], color: "#2acb5c" }, { name: "Sore", hours: [16, 17, 18], color: "#ffb619" }, { name: "Malam", hours: [19, 20, 21, 22, 23, 0, 1, 2, 3, 4], color: "#8947e9" }];
  const totals = groups.map((group) => rows.filter((row) => group.hours.includes(new Date(row.timestamp).getHours())).reduce((sum, row) => sum + row.power, 0));
  const total = totals.reduce((sum, value) => sum + value, 0) || 1;
  return groups.map((group, index) => ({ name: group.name, value: Math.round(totals[index] / total * 100), color: group.color }));
}

export function DashboardView() {
  const [latest, setLatest] = useState<Reading | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [cost, setCost] = useState<CostSummary | null>(null);
  const [device, setDevice] = useState<ApiDeviceStatus | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { const [nextLatest, nextHistory, nextCost, nextDevice] = await Promise.all([apiRequest<Reading>("/api/readings/latest?device_id=ESP32-001"), apiRequest<{ data: Reading[] }>("/api/readings?device_id=ESP32-001&interval=hour"), apiRequest<CostSummary>("/api/cost/summary?device_id=ESP32-001"), apiRequest<ApiDeviceStatus>("/api/devices/ESP32-001/status")]); setLatest(nextLatest); setHistory(nextHistory.data); setCost(nextCost); setDevice(nextDevice); setError(""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Data dashboard gagal dimuat"); } }, []);
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 5000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [load]);
  if (error && !latest) return <div className="empty-state"><strong>Dashboard belum dapat dimuat</strong><span>{error}</span><button className="secondary-button" onClick={() => void load()}>Coba lagi</button></div>;
  const current = latest ?? { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, power_factor: 0 } as Reading;
  const metricValues = [{ ...energyMetrics[0], value: String(current.power) }, { ...energyMetrics[1], value: String(current.current) }, { ...energyMetrics[2], value: String(current.voltage) }, { ...energyMetrics[3], value: String(current.power_factor) }, { ...energyMetrics[4], value: String(cost?.today.energy_kwh ?? current.energy), status: `Rp ${(cost?.today.cost_rp ?? 0).toLocaleString("id-ID")}` }, { ...energyMetrics[1], label: "Frekuensi", value: String(current.frequency), unit: "Hz", icon: "wave" }];
  const chartData: PowerReading[] = history.map((row) => ({ time: new Date(row.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), power: row.power, energy: row.energy, current: row.current, voltage: row.voltage }));
  return <div className="dashboard-grid">{error ? <p className="settings-status">{error}</p> : null}<div className="metrics-row">{metricValues.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><PowerChart data={chartData} /><EnergyDistribution data={timeDistribution(history)} /><div className="summary-row"><EnergySummary /><LiveCostCard value={cost?.today.cost_rp ?? 0} tariff={cost?.tariff_per_kwh ?? 0} /><CostSummaryCard summary={{ title: "Perkiraan Biaya Bulan Ini", value: `Rp ${(cost?.projection.cost_rp ?? 0).toLocaleString("id-ID")}`, detail: `${(cost?.projection.energy_kwh ?? 0).toFixed(2)} kWh proyeksi`, progress: 0, tone: "green" }} /><RelayControl /><DeviceStatus deviceStatus={device ? toDeviceStatus(device) : undefined} /><AlarmStatus /></div><DataHistory readings={history.slice(-5)} /><EnergyPrediction data={[]} /></div>;
}
