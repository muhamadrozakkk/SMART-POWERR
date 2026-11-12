"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Prediction } from "@/types/energy";
import { SectionCard } from "@/components/ui/SectionCard";

export function EnergyPrediction({ data = [] }: { data?: Prediction[] }) {
  const average = data.length ? data.reduce((sum, item) => sum + item.value, 0) / data.length : null;
  return <SectionCard title="Prediksi Penggunaan Energi" className="prediction-panel"><p className="prediction-subtitle">Estimasi sederhana dari rata-rata pembacaan 7 hari terakhir</p>{average === null ? <div className="empty-state"><strong>Prediksi belum tersedia</strong><span>Perangkat perlu mengirim data beberapa hari terlebih dahulu.</span></div> : <><div className="prediction-value">{average.toLocaleString("id-ID", { maximumFractionDigits: 2 })} <small>kWh / hari</small></div><p className="prediction-note">Perkiraan harian berdasarkan data aktual</p><div className="prediction-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 0, bottom: 0, left: -28 }}><CartesianGrid stroke="#214a77" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#bfd0e3", fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: "#bfd0e3", fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ background: "#123860", border: "1px solid #2a5989", borderRadius: 8, color: "#fff" }} formatter={(value: number) => [`${value} kWh`, "Rata-rata aktual"]} /><Bar dataKey="value" fill="#2d9ff0" radius={[3, 3, 0, 0]} barSize={20} /></BarChart></ResponsiveContainer></div></>}</SectionCard>;
}
