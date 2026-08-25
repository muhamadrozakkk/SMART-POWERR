"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { energyDistribution } from "@/data/dummyData";
import { SectionCard } from "@/components/ui/SectionCard";

export function EnergyDistribution() {
  return <SectionCard title="Distribusi Penggunaan Energi" className="distribution-panel"><div className="distribution-layout"><div className="donut-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={energyDistribution} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="82%" paddingAngle={0} stroke="#0d2f57" strokeWidth={1}>{energyDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div><div className="distribution-legend">{energyDistribution.map((entry) => <div className="legend-row" key={entry.name}><div><span className="legend-dot" style={{ background: entry.color }} />{entry.name}</div><strong>{entry.value}%</strong></div>)}</div></div></SectionCard>;
}
