"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Download, Filter } from "lucide-react";
import { apiRequest, type Reading } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { SimpleBarChart } from "@/components/common/SimpleBarChart";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/common/StatGrid";
import { formatWibDateTime, wibDateInputValue, wibDayBoundary } from "@/lib/datetime";

type Interval = "hour" | "day" | "week" | "month";
type Parameter = "power" | "energy" | "voltage" | "current" | "frequency" | "power_factor";
type RawReading = Reading & { tariff_class: string; tariff_per_kwh: number };
const parameterOptions: { value: Parameter; label: string; unit: string }[] = [
  { value: "power", label: "Daya aktif", unit: "W" }, { value: "energy", label: "Energi meter", unit: "kWh" }, { value: "voltage", label: "Tegangan", unit: "V" }, { value: "current", label: "Arus", unit: "A" }, { value: "frequency", label: "Frekuensi", unit: "Hz" }, { value: "power_factor", label: "Faktor daya", unit: "" },
];
const intervalOptions: { value: Interval; label: string }[] = [{ value: "hour", label: "Per jam" }, { value: "day", label: "Per hari" }, { value: "week", label: "Per minggu" }, { value: "month", label: "Per bulan" }];
const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function HistoryPage() {
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [interval, setInterval] = useState<Interval>("day"); const [parameter, setParameter] = useState<Parameter>("power");
  const [rows, setRows] = useState<Reading[]>([]); const [rawRows, setRawRows] = useState<RawReading[]>([]); const [filterStatus, setFilterStatus] = useState(""); const [error, setError] = useState("");
  const load = useCallback(async (fromValue: string, toValue: string, selectedInterval: Interval) => {
    try {
      const fromDate = wibDayBoundary(fromValue); const toDate = wibDayBoundary(toValue, true);
      const query = `from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
      const [aggregated, raw] = await Promise.all([
        apiRequest<{ data: Reading[] }>(`/api/telemetry/history?${query}&interval=${selectedInterval}`),
        apiRequest<{ data: RawReading[] }>(`/api/telemetry/history?${query}&interval=raw`),
      ]);
      setRows(aggregated.data); setRawRows(raw.data); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Riwayat belum tersedia"); setRows([]); setRawRows([]); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { const end = new Date(); const start = new Date(Date.now() - 6 * 86400000); const startValue = wibDateInputValue(start); const endValue = wibDateInputValue(end); setFrom(startValue); setTo(endValue); void load(startValue, endValue, "day"); }, 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { if (!from || !to) return; const timer = window.setInterval(() => { if (!document.hidden) void load(from, to, interval); }, 60000); return () => window.clearInterval(timer); }, [from, to, interval, load]);
  function applyFilter(event: FormEvent) { event.preventDefault(); setFilterStatus(`${from} hingga ${to} · ${intervalOptions.find((item) => item.value === interval)?.label} · ${parameterOptions.find((item) => item.value === parameter)?.label}`); void load(from, to, interval); }
  const selected = parameterOptions.find((item) => item.value === parameter) ?? parameterOptions[0];
  function exportData() {
    const header = ["Waktu (WIB)", "Device ID", "Golongan tarif PLN", "Tarif (Rp/kWh)", "Tegangan (V)", "Arus (A)", "Daya aktif (W)", "Energi meter (kWh)", "Frekuensi (Hz)", "Faktor daya"];
    const records = rawRows.map((row) => [formatWibDateTime(row.timestamp), row.device_id, row.tariff_class, row.tariff_per_kwh, row.voltage, row.current, row.power, row.energy, row.frequency, row.power_factor]);
    const csv = [header, ...records].map((record) => record.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `smart-power-riwayat-${from}-${to}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  const total = rows.reduce((sum, row) => sum + row.energy, 0); const mean = rows.length ? total / rows.length : 0; const highest = rows.length ? Math.max(...rows.map((row) => row.power)) : 0;
  const stats = [{ label: "Energi periode", value: rows.length ? `${total.toFixed(2)} kWh` : "Menunggu data", detail: `${rawRows.length} rekaman sensor`, icon: "zap" as const, tone: "blue" }, { label: "Rata-rata energi", value: rows.length ? `${mean.toFixed(2)} kWh` : "Menunggu data", detail: "Per titik agregasi grafik", icon: "activity" as const, tone: "green" }, { label: "Daya puncak", value: rows.length ? `${highest.toLocaleString("id-ID")} W` : "Menunggu data", detail: "Pada periode terpilih", icon: "up" as const, tone: "amber" }, { label: "Parameter grafik", value: selected.label, detail: `Satuan ${selected.unit || "tanpa satuan"}`, icon: "down" as const, tone: "purple" }];
  const chart = rows.map((row) => ({ day: new Date(row.timestamp).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", ...(interval === "hour" ? { day: "2-digit", month: "short", hour: "2-digit" } : interval === "month" ? { month: "short", year: "numeric" } : { day: "2-digit", month: "short", year: "2-digit" }) }), value: Number(row[parameter]) }));
  return <><PageHeader title="Riwayat Data" description="Grafik dapat diagregasi, sedangkan tabel dan ekspor berisi setiap pembacaan nyata ESP32." action={<button className="primary-button" onClick={exportData} disabled={!rawRows.length}><Download size={15} />Ekspor semua parameter ({rawRows.length})</button>} />{filterStatus && <p className="settings-status">Filter aktif: {filterStatus}</p>}{error && <p className="settings-status">{error}</p>}<StatGrid stats={stats} /><div className="two-column"><SectionCard title={`${selected.label} · ${intervalOptions.find((item) => item.value === interval)?.label}`}><SimpleBarChart data={chart} unit={selected.unit} />{!rows.length && <p className="muted">Grafik akan terisi setelah pembacaan sensor diterima.</p>}</SectionCard><SectionCard title="Filter data"><form onSubmit={applyFilter}><div className="form-grid"><div className="form-field"><label htmlFor="from">Dari tanggal</label><input id="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} required /></div><div className="form-field"><label htmlFor="to">Sampai tanggal</label><input id="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} required /></div><div className="form-field"><label htmlFor="interval">Agregasi grafik</label><select id="interval" value={interval} onChange={(event) => setInterval(event.target.value as Interval)}>{intervalOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div className="form-field"><label htmlFor="parameter">Parameter grafik</label><select id="parameter" value={parameter} onChange={(event) => setParameter(event.target.value as Parameter)}>{parameterOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div><button className="secondary-button" style={{ marginTop: 18 }}><Filter size={15} />Terapkan filter</button></form></SectionCard></div><SectionCard title="Rekaman pengukuran mentah" className="data-panel"><p className="muted">Setiap baris adalah satu kiriman sensor. Ekspor mencakup 10 kolom: waktu, identitas perangkat, tarif, dan enam parameter PZEM.</p><div className="table-scroll"><table><thead><tr><th>Waktu (WIB)</th><th>Tegangan (V)</th><th>Arus (A)</th><th>Daya (W)</th><th>Energi meter (kWh)</th><th>Frekuensi (Hz)</th><th>Faktor daya</th></tr></thead><tbody>{rawRows.map((row, index) => <tr key={`${row.device_id}-${row.timestamp}-${index}`}><td>{formatWibDateTime(row.timestamp)}</td><td>{row.voltage}</td><td>{row.current}</td><td>{row.power}</td><td>{row.energy}</td><td>{row.frequency}</td><td>{row.power_factor}</td></tr>)}</tbody></table></div>{!rawRows.length && <p className="muted">Belum ada pembacaan pada rentang ini.</p>}<div className="table-footer"><span>{rawRows.length} rekaman asli · ekspor berisi semua parameter</span></div></SectionCard></>;
}
