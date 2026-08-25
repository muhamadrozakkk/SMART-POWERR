"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { powerHistory } from "@/data/dummyData";
import type { PowerReading } from "@/types/energy";
import { SectionCard } from "@/components/ui/SectionCard";

type ChartKey = "power" | "energy" | "current" | "voltage";
const options: { value: ChartKey; label: string; unit: string }[] = [
  { value: "power", label: "Daya Aktif (W)", unit: "W" }, { value: "energy", label: "Energi (kWh)", unit: "kWh" }, { value: "current", label: "Arus (A)", unit: "A" }, { value: "voltage", label: "Tegangan (V)", unit: "V" },
];

export function PowerChart({ data = powerHistory }: { data?: PowerReading[] }) {
  const [selected, setSelected] = useState<ChartKey>("power");
  const option = options.find((item) => item.value === selected) ?? options[0];
  return <SectionCard title="Grafik Daya (24 Jam Terakhir)" className="chart-panel" action={<label className="select-wrap"><select value={selected} onChange={(event) => setSelected(event.target.value as ChartKey)} aria-label="Pilih metrik chart">{options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ChevronDown size={16} /></label>}>
    <div className="chart-unit">{option.label.split(" ")[0]} <span>({option.unit})</span></div>
    <div className="power-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 8, bottom: 4, left: -12 }}><CartesianGrid stroke="#214a77" strokeDasharray="2 4" vertical={false} /><XAxis dataKey="time" tick={{ fill: "#a8bdd5", fontSize: 11 }} tickLine={false} axisLine={false} interval={3} /><YAxis tick={{ fill: "#a8bdd5", fontSize: 11 }} tickLine={false} axisLine={false} domain={selected === "power" ? [0, 1200] : ["auto", "auto"]} /><Tooltip contentStyle={{ background: "#123860", border: "1px solid #2a5989", borderRadius: 10, color: "#fff" }} labelStyle={{ color: "#b6cbe2" }} formatter={(value: number) => [`${value} ${option.unit}`, option.label.split(" ")[0]]} /><Line type="monotone" dataKey={selected} stroke="#32a6f4" strokeWidth={2.5} dot={{ r: 2.8, fill: "#32a6f4", stroke: "#8dd4ff", strokeWidth: 1 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
  </SectionCard>;
}
