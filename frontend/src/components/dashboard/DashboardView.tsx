"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, type ApiDeviceStatus, type ApiNotification, type CostSummary, type Reading, type Settings, toDeviceStatus, ApiRequestError } from "@/lib/api";
import type { EnergyReading, PowerReading } from "@/types/energy";
import { AlarmStatus } from "@/components/dashboard/AlarmStatus";
import { CostSummary as CostSummaryCard } from "@/components/dashboard/CostSummary";
import { DataHistory } from "@/components/dashboard/DataHistory";
import { DeviceStatus } from "@/components/dashboard/DeviceStatus";
import { EnergySummary } from "@/components/dashboard/EnergySummary";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PowerChart } from "@/components/dashboard/PowerChart";
import { LiveCostCard } from "@/components/dashboard/LiveCostCard";
import { EnergyInsight } from "@/components/dashboard/EnergyInsight";
import { useI18n } from "@/lib/i18n";
import { formatWibDate, formatWibTime } from "@/lib/datetime";

export function DashboardView() {
  const { t, locale } = useI18n();
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [latest, setLatest] = useState<Reading | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [cost, setCost] = useState<CostSummary | null>(null);
  const [device, setDevice] = useState<ApiDeviceStatus | null>(null);
  const [alarms, setAlarms] = useState<ApiNotification[]>([]);
  const [devices, setDevices] = useState<Array<{ device_id: string; name: string }>>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [error, setError] = useState("");
  const lastReadingTimestamp = useRef("");
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
        apiRequest<Settings>(`/api/settings?${queryDevice}`),
      ]);
      const [latestResult, historyResult, costResult, deviceResult, alarmsResult, settingsResult] = results;
      if (latestResult.status === "rejected" && !(latestResult.reason instanceof ApiRequestError && latestResult.reason.status === 404 && latestResult.reason.message.toLowerCase().includes("belum ada pembacaan"))) throw latestResult.reason;
      for (const result of [historyResult, costResult, deviceResult, alarmsResult, settingsResult]) if (result.status === "rejected") throw result.reason;
      setLatest(latestResult.status === "fulfilled" ? latestResult.value : null);
      lastReadingTimestamp.current = latestResult.status === "fulfilled" ? latestResult.value.timestamp : "";
      setHistory(historyResult.status === "fulfilled" ? historyResult.value.data : []);
      setCost(costResult.status === "fulfilled" ? costResult.value : null);
      setDevice(deviceResult.status === "fulfilled" ? deviceResult.value.data : null);
      setAlarms(alarmsResult.status === "fulfilled" ? alarmsResult.value.data : []);
      if (latestResult.status === "fulfilled" && historyResult.status === "fulfilled" && costResult.status === "fulfilled" && deviceResult.status === "fulfilled" && alarmsResult.status === "fulfilled" && settingsResult.status === "fulfilled") {
        const lastDay = historyResult.value.data.filter((row) => Date.parse(row.timestamp) >= Date.now() - 24 * 60 * 60 * 1000);
        window.dispatchEvent(new CustomEvent("spw:dashboard-context", { detail: {
          latest: latestResult.value,
          tariff: { class: settingsResult.value.tariff_class, perKwh: settingsResult.value.tariff_per_kwh },
          history24h: lastDay.map(({ timestamp, power, energy }) => ({ timestamp, power, energy })),
          device: { id: deviceResult.value.data.device_id, online: deviceResult.value.data.is_online, lastSeen: deviceResult.value.data.last_seen },
          unreadNotifications: alarmsResult.value.data.filter((item) => !item.is_read).length,
        } }));
      }
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Data dashboard gagal dimuat"); }
  }, [period, selectedDevice]);
  const refreshLatest = useCallback(async () => {
    const deviceId = selectedDevice || devices[0]?.device_id;
    if (!deviceId) return;
    try {
      const reading = await apiRequest<Reading>(`/api/telemetry/latest?device_id=${encodeURIComponent(deviceId)}`);
      if (reading.timestamp !== lastReadingTimestamp.current) {
        lastReadingTimestamp.current = reading.timestamp;
        setLatest(reading);
        // A new ESP32 sample also refreshes the chart, cost summary, and device status.
        void load();
      }
    } catch { /* Keep the last successful sample visible during brief network errors. */ }
  }, [devices, load, selectedDevice]);
  useEffect(() => { const initial = window.setTimeout(() => void load(), 0); const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 60000); const onDeviceAdded = () => void load(); window.addEventListener("spw:device-added", onDeviceAdded); return () => { window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener("spw:device-added", onDeviceAdded); }; }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => { if (!document.hidden) void refreshLatest(); }, 5000);
    const onVisibility = () => { if (!document.hidden) void refreshLatest(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [refreshLatest]);
  if (!latest) return <div className="empty-state dashboard-waiting"><strong>{t("Menunggu data dari ESP32")}</strong><span>{error || t(devices.length ? "Perangkat sudah tertaut. Pastikan ESP32 menyala dan mengirim data dengan Device ID serta API Key yang benar." : "Belum ada perangkat yang ditautkan ke akun ini.")} {t("Data akan tampil setelah pembacaan nyata tersimpan.")}</span><button className="secondary-button" onClick={() => void load()}>{t("Periksa lagi")}</button></div>;
  const current = latest;
  const numberLocale = locale === "EN" ? "en-US" : "id-ID";
  const trend = (field: "power" | "current" | "voltage" | "power_factor" | "energy" | "frequency") => history.slice(-7).map((row) => row[field]);
  const liveTariff = current.tariff_per_kwh ?? cost?.tariff_per_kwh ?? 0;
  const metricInfo: Array<Pick<EnergyReading, "label" | "unit" | "icon" | "accent"> & { value: number; field: "power" | "current" | "voltage" | "power_factor" | "frequency" | "energy" | "cost"; detail: string }> = [
    { label: "Daya aktif", unit: "W", icon: "bolt", accent: "blue", value: current.power, field: "power", detail: "Pembacaan terbaru" },
    { label: "Arus", unit: "A", icon: "current", accent: "sky", value: current.current, field: "current", detail: "Pembacaan terbaru" },
    { label: "Tegangan", unit: "V", icon: "voltage", accent: "purple", value: current.voltage, field: "voltage", detail: "Pembacaan terbaru" },
    { label: "Faktor daya", unit: "", icon: "wave", accent: "amber", value: current.power_factor, field: "power_factor", detail: "Pembacaan terbaru" },
    { label: "Energi terbaru", unit: "kWh", icon: "energy", accent: "green", value: current.energy, field: "energy", detail: "Sesuai angka E pada LCD" },
    { label: "Biaya meter", unit: "Rp", icon: "cost", accent: "amber", value: current.energy * liveTariff, field: "cost", detail: `Energi LCD × Rp ${liveTariff.toLocaleString(numberLocale)} / kWh` },
    { label: "Frekuensi", unit: "Hz", icon: "wave", accent: "blue", value: current.frequency, field: "frequency", detail: "Pembacaan terbaru" },
  ];
  const metricValues = metricInfo.map((metric) => ({ ...metric, value: metric.value.toLocaleString(numberLocale, { maximumFractionDigits: metric.field === "cost" ? 0 : 3 }), trend: metric.field === "cost" ? history.slice(-7).map((row) => row.energy * (row.tariff_per_kwh ?? liveTariff)) : trend(metric.field), status: latest ? metric.detail : "Menunggu data sensor", statusTone: "stable" as const }));
  const chartData: PowerReading[] = history.map((row) => ({ time: period === "day" ? formatWibTime(row.timestamp).slice(0, 5) : formatWibDate(row.timestamp), power: row.power, energy: row.energy, current: row.current, voltage: row.voltage, cost: row.cost_rp ?? row.energy * (row.tariff_per_kwh ?? cost?.tariff_per_kwh ?? 0) }));
  return <div className="dashboard-grid">{devices.length > 0 && <label className="form-field device-picker"><span>{t("Pilih perangkat")}</span><select className="input-control" value={selectedDevice} onChange={(event) => setSelectedDevice(event.target.value)}>{devices.map((item) => <option key={item.device_id} value={item.device_id}>{item.name} · {item.device_id}</option>)}</select></label>}{error ? <p className="settings-status">{error}</p> : null}<div className="metrics-row">{metricValues.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><EnergyInsight power={current.power} todayCost={cost?.today.cost_rp ?? 0} monthCost={cost?.month.cost_rp ?? 0} monthEnergy={cost?.month.energy_kwh ?? 0} /><PowerChart data={chartData} period={period} onPeriodChange={setPeriod} /><div className="summary-row"><EnergySummary energyKwh={cost?.month.energy_kwh ?? 0} /><LiveCostCard value={cost?.today.cost_rp ?? 0} tariff={cost?.tariff_per_kwh ?? 0} /><CostSummaryCard summary={{ title: "Estimasi Biaya Bulan Ini", value: `Rp ${(cost?.month.cost_rp ?? 0).toLocaleString(numberLocale)}`, detail: `${(cost?.month.energy_kwh ?? 0).toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh ${t("tercatat")}`, tone: "green" }} /><DeviceStatus deviceStatus={device ? toDeviceStatus(device) : undefined} /><AlarmStatus alarms={alarms} /></div><DataHistory readings={history.slice(-5)} tariffPerKwh={cost?.tariff_per_kwh ?? 0} /></div>;
}
