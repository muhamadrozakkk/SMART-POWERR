"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { predictionData } from "@/data/dummyData";
import { SectionCard } from "@/components/ui/SectionCard";

export function EnergyPrediction() {
  return <SectionCard title="Prediksi Penggunaan Energi" className="prediction-panel"><p className="prediction-subtitle">Perkiraan 7 hari ke depan</p><div className="prediction-value">4.25 <small>kWh / hari</small><span>↓ 8%</span></div><p className="prediction-note">Lebih rendah dari rata-rata minggu lalu</p><div className="prediction-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={predictionData} margin={{ top: 10, right: 0, bottom: 0, left: -28 }}><CartesianGrid stroke="#214a77" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#bfd0e3", fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: "#bfd0e3", fontSize: 10 }} tickLine={false} axisLine={false} ticks={[0, 2, 4, 6]} /><Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ background: "#123860", border: "1px solid #2a5989", borderRadius: 8, color: "#fff" }} formatter={(value: number) => [`${value} kWh`, "Prediksi"]} /><Bar dataKey="value" fill="#2d9ff0" radius={[3, 3, 0, 0]} barSize={20} /></BarChart></ResponsiveContainer></div></SectionCard>;
}
