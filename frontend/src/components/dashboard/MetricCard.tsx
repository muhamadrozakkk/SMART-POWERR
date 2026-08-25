import { Activity, BatteryCharging, Bolt, Gauge, Waves } from "lucide-react";
import type { EnergyReading } from "@/types/energy";
import { StatusBadge } from "@/components/ui/StatusBadge";

const iconMap = { bolt: Bolt, current: Activity, voltage: Gauge, wave: Waves, energy: BatteryCharging };
const accentMap: Record<string, { icon: string; line: string }> = {
  blue: { icon: "icon-blue", line: "#3eaaf7" }, sky: { icon: "icon-sky", line: "#249cf2" }, purple: { icon: "icon-purple", line: "#9951ed" }, amber: { icon: "icon-amber", line: "#ffb414" }, green: { icon: "icon-green", line: "#2ccf61" },
};

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${29 - ((value - min) / range) * 23}`).join(" ");
  return <svg className="sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />{values.map((value, index) => <circle key={`${value}-${index}`} cx={(index / (values.length - 1)) * 100} cy={29 - ((value - min) / range) * 23} r="1.3" fill={color} />)}</svg>;
}

export function MetricCard({ metric }: { metric: EnergyReading }) {
  const Icon = iconMap[metric.icon as keyof typeof iconMap] ?? Bolt;
  const accent = accentMap[metric.accent];
  return <article className="metric-card"><div className={`metric-icon ${accent.icon}`}><Icon size={25} /></div><div className="metric-content"><span className="metric-label">{metric.label}</span><div className="metric-value">{metric.value} <small>{metric.unit}</small></div><StatusBadge tone={metric.statusTone}>{metric.status}</StatusBadge></div><Sparkline values={metric.trend} color={accent.line} /></article>;
}
