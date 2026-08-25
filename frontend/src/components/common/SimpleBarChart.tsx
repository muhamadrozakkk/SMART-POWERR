"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function SimpleBarChart({ data, dataKey = "value", xKey = "day", color = "#2f9ff2", unit = "kWh" }: { data: { [key: string]: string | number }[]; dataKey?: string; xKey?: string; color?: string; unit?: string }) {
  return <div className="simple-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}><CartesianGrid stroke="#214a77" strokeDasharray="2 4" vertical={false} /><XAxis dataKey={xKey} tick={{ fill: "#b4c7dc", fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: "#b4c7dc", fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: "#ffffff08" }} contentStyle={{ background: "#123860", border: "1px solid #2a5989", borderRadius: 8, color: "#fff" }} formatter={(value: number) => [`${value} ${unit}`, "Penggunaan"]} /><Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={28} /></BarChart></ResponsiveContainer></div>;
}
