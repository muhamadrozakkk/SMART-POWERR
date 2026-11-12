"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type ApiDeviceStatus, type ApiNotification, type CostSummary, type Reading, toDeviceStatus, ApiRequestError } from "@/lib/api";
import { energyMetrics } from "@/data/dummyData";
import type { PowerReading } from "@/types/energy";
import { AlarmStatus } from "@/components/dashboard/AlarmStatus";
import { CostSummary as CostSummaryCard } from "@/components/dashboard/CostSummary";
import { DataHistory } from "@/components/dashboard/DataHistory";
import { DeviceStatus } from "@/components/dashboard/DeviceStatus";
import { EnergySummary } from "@/components/dashboard/EnergySummary";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PowerChart } from "@/components/dashboard/PowerChart";
import { LiveCostCard } from "@/components/dashboard/LiveCostCard";

export function DashboardView() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [latest, setLatest] = useState<Reading | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [cost, setCost] = useState<CostSummary | null>(null);
  const [device, setDevice] = useState<ApiDeviceStatus | null>(null);
  const [alarms, setAlarms] = useState<ApiNotification[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const interval = period === "day" ? "hour" : period;
    try {
      const results = await Promise.allSettled([
        apiRequest<Reading>("/api/readings/latest"),
        apiRequest<{ data: Reading[] }>(`/api/readings?from=${encodeURIComponent(from)}&interval=${interval}`),
        apiRequest<CostSummary>("/api/cost/summary"),
        apiRequest<{ data: ApiDeviceStatus }>("/api/device"),
        apiRequest<{ data: ApiNotification[] }>("/api/notifications?unread_only=false"),
      ]);
      const [latestResult, historyResult, costResult, deviceResult, alarmsResult] = results;
      if (latestResult.status === "rejected" && !(latestResult.reason instanceof ApiRequestError && latestResult.reason.status === 404 && latestResult.reason.message.toLowerCase().includes("belum ada pembacaan"))) throw latestResult.reason;
      for (const result of [historyResult, costResult, deviceResult, alarmsResult]) if (result.status === "rejected") throw result.reason;
      setLatest(latestResult.status === "fulfilled" ? latestResult.value : null);
      setHistory(historyResult.status === "fulfilled" ? historyResult.value.data : []);
      setCost(costResult.status === "fulfilled" ? costResult.value : null);
      setDevice(deviceResult.status === "fulfilled" ? deviceResult.value.data : null);
      setAlarms(alarmsResult.status === "fulfilled" ? alarmsResult.value.data : []);
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Data dashboard gagal dimuat"); }
  }, [period]);
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 5000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [load]);
  if (error && !device) return <div className="empty-state"><strong>Dashboard menunggu perangkat</strong><span>{error}. Setelah ESP32 mengirim payload, tautkan device ke akun ini dari Dashboard Developer.</span><button className="secondary-button" onClick={() => void load()}>Coba lagi</button></div>;
  const current = latest ?? { voltage: 0, current: 0, power: 0, energy: 0, frequency: 0, power_factor: 0 } as Reading;
  const trend = (field: "power" | "current" | "voltage" | "power_factor" | "energy" | "frequency") => history.slice(-7).map((row) => row[field]);
  const metricValues = [
    { ...energyMetrics[0], value: String(current.power), trend: trend("power"), status: latest ? "Data sensor" : "Menunggu sensor", statusTone: "stable" as const },
    { ...energyMetrics[1], value: String(current.current), trend: trend("current"), status: latest ? "Data sensor" : "Menunggu sensor", statusTone: "stable" as const },
    { ...energyMetrics[2], value: String(current.voltage), trend: trend("voltage"), status: latest ? "Data sensor" : "Menunggu sensor", statusTone: "stable" as const },
    { ...energyMetrics[3], value: String(current.power_factor), trend: trend("power_factor"), status: latest ? "Data sensor" : "Menunggu sensor", statusTone: "stable" as const },
    { ...energyMetrics[4], value: String(cost?.today.energy_kwh ?? 0), trend: trend("energy"), status: `Rp ${(cost?.today.cost_rp ?? 0).toLocaleString("id-ID")}`, statusTone: "stable" as const },
    { ...energyMetrics[1], label: "Frekuensi", value: String(current.frequency), unit: "Hz", icon: "wave", trend: trend("frequency"), status: latest ? "Data sensor" : "Menunggu sensor", statusTone: "stable" as const },
  ];
  const chartData: PowerReading[] = history.map((row) => ({ time: new Date(row.timestamp).toLocaleString("id-ID", period === "day" ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short" }), power: row.power, energy: row.energy, current: row.current, voltage: row.voltage, cost: row.energy * (cost?.tariff_per_kwh ?? 0) }));
  return <div className="dashboard-grid">{!latest ? <p className="settings-status">Belum ada payload sensor. Angka di bawah bernilai nol sampai ESP32 mengirim pembacaan pertama.</p> : null}{error ? <p className="settings-status">{error}</p> : null}<div className="metrics-row">{metricValues.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><PowerChart data={chartData} period={period} onPeriodChange={setPeriod} /><div className="summary-row"><EnergySummary energyKwh={cost?.month.energy_kwh ?? 0} /><LiveCostCard value={cost?.today.cost_rp ?? 0} tariff={cost?.tariff_per_kwh ?? 0} /><CostSummaryCard summary={{ title: "Estimasi Biaya Bulan Ini", value: `Rp ${(cost?.month.cost_rp ?? 0).toLocaleString("id-ID")}`, detail: `${(cost?.month.energy_kwh ?? 0).toFixed(2)} kWh tercatat`, tone: "green" }} /><DeviceStatus deviceStatus={device ? toDeviceStatus(device) : undefined} /><AlarmStatus alarms={alarms} /></div><DataHistory readings={history.slice(-5)} tariffPerKwh={cost?.tariff_per_kwh ?? 0} /></div>;
}
