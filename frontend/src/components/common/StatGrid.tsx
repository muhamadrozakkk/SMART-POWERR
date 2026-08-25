import { Activity, Bolt, CalendarDays, CircleDollarSign, Gauge, Receipt, Target, TrendingDown, TrendingUp, Zap } from "lucide-react";

const icons = { bolt: Bolt, activity: Activity, gauge: Gauge, calendar: CalendarDays, money: CircleDollarSign, receipt: Receipt, target: Target, up: TrendingUp, down: TrendingDown, zap: Zap };
export function StatGrid({ stats }: { stats: { label: string; value: string; detail: string; icon: keyof typeof icons; tone?: string }[] }) {
  return <div className="stat-grid">{stats.map((stat) => { const Icon = icons[stat.icon]; return <div className="stat-tile" key={stat.label}><div className={`stat-tile-icon ${stat.tone ?? "blue"}`}><Icon size={20} /></div><div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></div></div>; })}</div>;
}
