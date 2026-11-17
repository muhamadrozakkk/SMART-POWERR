"use client";

import { useEffect, useState } from "react";
import { ReceiptText, Target } from "lucide-react";
import { apiRequest, type CostSummary, type Reading, type Settings } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { SimpleBarChart } from "@/components/common/SimpleBarChart";
import { StatGrid } from "@/components/common/StatGrid";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatWibDate } from "@/lib/datetime";

const ranges = ["Hari ini", "7 Hari", "Bulan ini"] as const;
const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;

export default function CostPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("Bulan ini");
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [rows, setRows] = useState<Reading[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const from = new Date(Date.now() - 30 * 86400000).toISOString();
        const [cost, readings, config] = await Promise.all([
          apiRequest<CostSummary>("/api/cost/summary"),
          apiRequest<{ data: Reading[] }>(`/api/telemetry/history?from=${encodeURIComponent(from)}&interval=day`),
          apiRequest<Settings>("/api/settings"),
        ]);
        if (active) { setNow(Date.now()); setSummary(cost); setRows(readings.data); setSettings(config); setError(""); }
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Data biaya belum tersedia"); }
    };
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (!rows.length) return <><PageHeader title="Biaya" description="Estimasi biaya memakai data energi aktual dan tarif aktif perangkat." /><div className="empty-state"><strong>Menunggu pembacaan energi</strong><span>{error || "Estimasi biaya akan muncul setelah data dari ESP32 tersimpan di database."}</span></div></>;

  const tariff = summary?.tariff_per_kwh ?? 0;
  const weekRows = rows.filter((row) => now - new Date(row.timestamp).getTime() <= 7 * 86400000);
  const weekEnergy = weekRows.reduce((sum, row) => sum + row.energy, 0);
  const weekCost = weekRows.reduce((sum, row) => sum + (row.cost_rp ?? row.energy * (row.tariff_per_kwh ?? tariff)), 0);
  const activeCost = range === "Hari ini" ? summary?.today.cost_rp ?? 0 : range === "7 Hari" ? weekCost : summary?.month.cost_rp ?? 0;
  const activeEnergy = range === "Hari ini" ? summary?.today.energy_kwh ?? 0 : range === "7 Hari" ? weekEnergy : summary?.month.energy_kwh ?? 0;
  const budget = settings?.daily_cost_limit_rp ?? 0;
  const progress = budget ? Math.min(100, Math.round(((summary?.today.cost_rp ?? 0) / budget) * 100)) : 0;
  const stats = [
    { label: "Biaya hari ini", value: rupiah(summary?.today.cost_rp ?? 0), detail: `${(summary?.today.energy_kwh ?? 0).toFixed(3)} kWh`, icon: "receipt" as const, tone: "blue" },
    { label: "Biaya 7 hari", value: rupiah(weekCost), detail: `${weekEnergy.toFixed(3)} kWh aktual`, icon: "calendar" as const, tone: "green" },
    { label: "Biaya bulan ini", value: rupiah(summary?.month.cost_rp ?? 0), detail: `${(summary?.month.energy_kwh ?? 0).toFixed(3)} kWh aktual`, icon: "money" as const, tone: "amber" },
    { label: "Proyeksi bulan ini", value: rupiah(summary?.projection.cost_rp ?? 0), detail: `${(summary?.projection.energy_kwh ?? 0).toFixed(3)} kWh`, icon: "target" as const, tone: "purple" },
    { label: "Biaya meter kumulatif", value: rupiah(summary?.meter.cost_rp ?? 0), detail: `${(summary?.meter.energy_kwh ?? 0).toFixed(3)} kWh pada meter`, icon: "bolt" as const, tone: "blue" },
  ];
  const chart = rows.slice(range === "Hari ini" ? -1 : range === "7 Hari" ? -7 : -30).map((row) => ({ day: formatWibDate(row.timestamp), value: row.cost_rp ?? row.energy * (row.tariff_per_kwh ?? tariff) }));

  return <>
    <PageHeader title="Biaya" description="Estimasi biaya memakai selisih energi sensor dan tarif aktif perangkat." action={<div className="filters">{ranges.map((item) => <button key={item} className={range === item ? "primary-button" : "secondary-button"} onClick={() => setRange(item)} aria-pressed={range === item}>{item}</button>)}</div>} />
    {error && <p className="settings-status">{error}</p>}
    <p className="settings-status">Periode aktif: {range} · {rupiah(activeCost)} · {activeEnergy.toFixed(3)} kWh. Biaya meter kumulatif adalah total sejak penghitung PZEM dimulai; biaya harian dihitung dari pemakaian hari ini.</p>
    <StatGrid stats={stats} />
    <div className="two-column">
      <SectionCard title="Estimasi biaya harian"><SimpleBarChart data={chart} unit="Rp" color="#ffb519" />{!rows.length && <p className="muted">Grafik akan terisi setelah data sensor masuk.</p>}</SectionCard>
      <SectionCard title="Batas biaya harian">
        <div className="data-highlight"><div><span>Biaya hari ini</span><strong>{rupiah(summary?.today.cost_rp ?? 0)}</strong><span>Batas yang diatur: {rupiah(budget)}</span></div><Target color="#ffbf2d" size={32} /></div>
        <div className="progress-row" style={{ marginTop: 22 }}><ProgressBar value={progress} tone={progress >= 85 ? "amber" : "green"} /><strong>{progress}%</strong></div>
        <div className="info-list"><div className="info-row"><span>Tarif aktif perangkat</span><strong>{rupiah(tariff)} / kWh</strong></div><div className="info-row"><span>Estimasi sisa batas harian</span><strong>{rupiah(Math.max(0, budget - (summary?.today.cost_rp ?? 0)))}</strong></div></div>
      </SectionCard>
    </div>
    <SectionCard title="Metode perhitungan"><div className="empty-state" style={{ minHeight: 110 }}><ReceiptText size={24} /><span>Biaya harian dihitung dari perubahan pembacaan energi (kWh) × tarif aktif yang dikirim ESP32. Biaya meter kumulatif memakai angka energi total PZEM × tarif aktif. Pajak dan biaya administrasi PLN belum termasuk.</span></div></SectionCard>
  </>;
}
