"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type ApiDeviceStatus, type ApiNotification, type CostSummary, type Reading, toDeviceStatus, ApiRequestError } from "@/lib/api";
import type { EnergyReading, PowerReading } from "@/types/energy";
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
  const [devices, setDevices] = useState<Array<{ device_id: string; name: string }>>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const interval = period === "day" ? "hour" : period;
    try {
      const deviceRows = await apiRequest<{ data: Array<{ device_id: string; name: string }> }>("/api/devices");
      setDevices(deviceRows.data);
      const deviceId = deviceRows.data.some((item) => item.device_id === selectedDevice) ? selectedDevice : deviceRows.data[0]?.device_id;
      if (!deviceId) { setLatest(null); setHistory([]); setCost(null); setDevice(null); setError("Belum ada perangkat yang ditautkan ke akun ini."); return; }
      if (deviceId !== selectedDevice) setSelectedDevice(deviceId);
      const queryDevice = `device_id=${encodeURIComponent(deviceId)}`;
      const results = await Promise.allSettled([
        apiRequest<Reading>(`/api/telemetry/latest?${queryDevice}`),
        apiRequest<{ data: Reading[] }>(`/api/telemetry/history?${queryDevice}&from=${encodeURIComponent(from)}&interval=${interval}`),
        apiRequest<CostSummary>(`/api/cost/summary?${queryDevice}`),
        apiRequest<{ data: ApiDeviceStatus }>(`/api/device?${queryDevice}`),
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
  }, [period, selectedDevice]);
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 5000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [load]);
  if (!latest) return <div className="empty-state"><strong>Menunggu data dari ESP32</strong><span>{error || (devices.length ? "Belum ada pembacaan tersimpan. Periksa koneksi dan API key ESP32." : "Belum ada perangkat yang ditautkan ke akun ini.")} Data akan tampil setelah pembacaan nyata tersimpan.</span><button className="secondary-button" onClick={() => void load()}>Periksa lagi</button></div>;
  const current = latest;
  const trend = (field: "power" | "current" | "voltage" | "power_factor" | "energy" | "frequency") => history.slice(-7).map((row) => row[field]);
  const metricInfo: Array<Pick<EnergyReading, "label" | "unit" | "icon" | "accent"> & { value: number; field: "power" | "current" | "voltage" | "power_factor" | "frequency" | "energy"; detail: string }> = [
    { label: "Daya aktif", unit: "W", icon: "bolt", accent: "blue", value: current.power, field: "power", detail: "Pembacaan terbaru" },
    { label: "Arus", unit: "A", icon: "current", accent: "sky", value: current.current, field: "current", detail: "Pembacaan terbaru" },
    { label: "Tegangan", unit: "V", icon: "voltage", accent: "purple", value: current.voltage, field: "voltage", detail: "Pembacaan terbaru" },
    { label: "Faktor daya", unit: "", icon: "wave", accent: "amber", value: current.power_factor, field: "power_factor", detail: "Pembacaan terbaru" },
    { label: "Energi hari ini", unit: "kWh", icon: "energy", accent: "green", value: cost?.today.energy_kwh ?? 0, field: "energy", detail: `Rp ${(cost?.today.cost_rp ?? 0).toLocaleString("id-ID")}` },
    { label: "Frekuensi", unit: "Hz", icon: "wave", accent: "blue", value: current.frequency, field: "frequency", detail: "Pembacaan terbaru" },
  ];
  const metricValues = metricInfo.map((metric) => ({ ...metric, value: String(metric.value), trend: trend(metric.field), status: latest ? metric.detail : "Menunggu data sensor", statusTone: "stable" as const }));
  const chartData: PowerReading[] = history.map((row) => ({ time: new Date(row.timestamp).toLocaleString("id-ID", period === "day" ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short" }), power: row.power, energy: row.energy, current: row.current, voltage: row.voltage, cost: row.energy * (cost?.tariff_per_kwh ?? 0) }));
  return <div className="dashboard-grid">{devices.length > 0 && <label className="form-field" style={{ maxWidth: 420 }}><span>Pilih perangkat</span><select className="input-control" value={selectedDevice} onChange={(event) => setSelectedDevice(event.target.value)}>{devices.map((item) => <option key={item.device_id} value={item.device_id}>{item.name} · {item.device_id}</option>)}</select></label>}{error ? <p className="settings-status">{error}</p> : null}<div className="metrics-row">{metricValues.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><PowerChart data={chartData} period={period} onPeriodChange={setPeriod} /><div className="summary-row"><EnergySummary energyKwh={cost?.month.energy_kwh ?? 0} /><LiveCostCard value={cost?.today.cost_rp ?? 0} tariff={cost?.tariff_per_kwh ?? 0} /><CostSummaryCard summary={{ title: "Estimasi Biaya Bulan Ini", value: `Rp ${(cost?.month.cost_rp ?? 0).toLocaleString("id-ID")}`, detail: `${(cost?.month.energy_kwh ?? 0).toFixed(2)} kWh tercatat`, tone: "green" }} /><DeviceStatus deviceStatus={device ? toDeviceStatus(device) : undefined} /><AlarmStatus alarms={alarms} /></div><DataHistory readings={history.slice(-5)} tariffPerKwh={cost?.tariff_per_kwh ?? 0} /></div>;
}
