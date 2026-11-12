"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { apiRequest, type Reading } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { SimpleBarChart } from "@/components/common/SimpleBarChart";
import { StatGrid } from "@/components/common/StatGrid";
import { SectionCard } from "@/components/ui/SectionCard";

export default function EnergyPage() {
  const [period, setPeriod] = useState<"7 Hari" | "Bulan ini">("Bulan ini");
  const [rows, setRows] = useState<Reading[]>([]); const [today, setToday] = useState(0); const [month, setMonth] = useState(0); const [error, setError] = useState(""); const [now, setNow] = useState(0);
  useEffect(() => { let active = true; const load = async () => { try { const days = period === "7 Hari" ? 7 : 30; const from = new Date(Date.now() - days * 86400000).toISOString(); const [history, summary] = await Promise.all([apiRequest<{ data: Reading[] }>(`/api/readings?from=${encodeURIComponent(from)}&interval=day`), apiRequest<{ today: { energy_kwh: number }; month: { energy_kwh: number } }>("/api/cost/summary")]); if (active) { setNow(Date.now()); setRows(history.data); setToday(summary.today.energy_kwh); setMonth(summary.month.energy_kwh); setError(""); } } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Data energi belum tersedia"); } }; void load(); return () => { active = false; }; }, [period]);
  const week = rows.filter((row) => now - new Date(row.timestamp).getTime() <= 7 * 86400000).reduce((sum, row) => sum + row.energy, 0);
  const stats = [{ label: "Energi hari ini", value: `${today.toFixed(2)} kWh`, detail: "Dari pembacaan aktual", icon: "zap" as const, tone: "blue" }, { label: "Energi 7 hari", value: `${week.toFixed(2)} kWh`, detail: "Akumulasi pembacaan aktual", icon: "calendar" as const, tone: "green" }, { label: "Energi bulan ini", value: `${month.toFixed(2)} kWh`, detail: "Bulan berjalan", icon: "bolt" as const, tone: "purple" }, { label: "Data sensor", value: rows.length ? `${rows.length} hari` : "0", detail: rows.length ? "Data tersedia" : "Menunggu ESP32", icon: "down" as const, tone: "amber" }];
  const chart = rows.map((row) => ({ day: new Date(row.timestamp).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }), value: row.energy }));
  return <><PageHeader title="Energi" description="Ringkasan pemakaian dari pembacaan alat yang terhubung." action={<button className="secondary-button" onClick={() => setPeriod(period === "Bulan ini" ? "7 Hari" : "Bulan ini")}>{period} ▾</button>} />{error && <p className="settings-status">{error}</p>}<StatGrid stats={stats} /><SectionCard title={`Konsumsi energi · ${period}`}><SimpleBarChart data={chart} unit="kWh" />{!rows.length && <p className="muted">Grafik akan terisi setelah ESP32 mengirim data.</p>}</SectionCard><div className="two-column" style={{ marginTop: 14 }}><SectionCard title="Pembagian penggunaan"><div className="empty-state"><strong>Belum ada data pembagian</strong><span>Perangkat perlu mengirim pembacaan sensor terlebih dahulu.</span></div></SectionCard><SectionCard title="Catatan"><div className="empty-state" style={{ minHeight: 130 }}><Lightbulb size={23} /><strong>Tips hemat energi</strong><span>Matikan perangkat yang tidak digunakan untuk menjaga konsumsi tetap efisien.</span></div></SectionCard></div></>;
}
