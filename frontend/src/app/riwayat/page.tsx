"use client";

import { useState } from "react";
import { Download, Filter } from "lucide-react";
import { powerHistory, recentReadings } from "@/data/dummyData";
import { PageHeader } from "@/components/common/PageHeader";
import { SimpleBarChart } from "@/components/common/SimpleBarChart";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatGrid } from "@/components/common/StatGrid";

const rows = [...recentReadings, ["10:20:00", "220.1", "1.87", "410", "8.31", "5.518"], ["10:18:00", "220.5", "1.91", "420", "8.29", "5.492"]];
const headers = ["Waktu", "Tegangan (V)", "Arus (A)", "Daya (W)", "Energi (kWh)", "Biaya (Rp)"];

export default function HistoryPage() {
  const [from, setFrom] = useState("2025-05-01");
  const [to, setTo] = useState("2025-05-24");
  const [parameter, setParameter] = useState("all");
  const [filterStatus, setFilterStatus] = useState("");
  const stats = [{ label: "Total energi", value: "112.45 kWh", detail: "Periode terpilih", icon: "zap" as const, tone: "blue" }, { label: "Rata-rata energi", value: "4.68 kWh", detail: "Per hari", icon: "activity" as const, tone: "green" }, { label: "Konsumsi tertinggi", value: "1.024 W", detail: "06:30 WIB", icon: "up" as const, tone: "amber" }, { label: "Konsumsi terendah", value: "242 W", detail: "03:15 WIB", icon: "down" as const, tone: "purple" }];
  function applyFilter() {
    setFilterStatus(`Filter diterapkan: ${from} sampai ${to} · ${parameter === "all" ? "semua parameter" : parameter}`);
  }
  function exportData() {
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart-power-riwayat.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return <><PageHeader title="Riwayat Data" description="Lihat pola penggunaan energi dan rekaman pengukuran perangkat." action={<button className="primary-button" onClick={exportData}><Download size={15} />Export data</button>} />{filterStatus ? <p className="settings-status">{filterStatus}</p> : null}<StatGrid stats={stats} /><div className="two-column"><SectionCard title="Tren daya historis"><SimpleBarChart data={powerHistory.slice(-12).map((item) => ({ day: item.time, value: item.power }))} unit="W" /></SectionCard><SectionCard title="Filter data"><div className="form-grid"><div className="form-field"><label htmlFor="from">Dari tanggal</label><input id="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div><div className="form-field"><label htmlFor="to">Sampai tanggal</label><input id="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div><div className="form-field"><label htmlFor="parameter">Parameter</label><select id="parameter" value={parameter} onChange={(event) => setParameter(event.target.value)}><option value="all">Semua parameter</option><option value="Daya aktif">Daya aktif</option><option value="Energi">Energi</option><option value="Tegangan">Tegangan</option></select></div></div><button className="secondary-button" style={{ marginTop: 18 }} onClick={applyFilter}><Filter size={15} />Terapkan filter</button></SectionCard></div><SectionCard title="Rekaman pengukuran" className="data-panel"><div className="table-scroll"><table><thead><tr>{headers.map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div></SectionCard></>;
}
