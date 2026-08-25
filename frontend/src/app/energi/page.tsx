import { Lightbulb, TrendingDown } from "lucide-react";
import { energyDistribution, weeklyEnergy } from "@/data/dummyData";
import { PageHeader } from "@/components/common/PageHeader";
import { SimpleBarChart } from "@/components/common/SimpleBarChart";
import { StatGrid } from "@/components/common/StatGrid";
import { SectionCard } from "@/components/ui/SectionCard";

export default function EnergyPage() {
  const stats = [{ label: "Energi hari ini", value: "8.42 kWh", detail: "4% lebih rendah dari kemarin", icon: "zap" as const, tone: "blue" }, { label: "Energi minggu ini", value: "214.6 kWh", detail: "Rata-rata 30.6 kWh/hari", icon: "calendar" as const, tone: "green" }, { label: "Energi bulan ini", value: "112.45 kWh", detail: "1 - 24 Mei 2025", icon: "bolt" as const, tone: "purple" }, { label: "Tren konsumsi", value: "-8%", detail: "Lebih rendah minggu lalu", icon: "down" as const, tone: "amber" }];
  return <><PageHeader title="Energi" description="Pahami ke mana energi rumah Anda digunakan setiap hari." action={<button className="secondary-button">Bulan ini ▾</button>} /><StatGrid stats={stats} /><SectionCard title="Konsumsi energi mingguan"><SimpleBarChart data={weeklyEnergy} /></SectionCard><div className="two-column" style={{ marginTop: 14 }}><SectionCard title="Pembagian penggunaan"><div className="info-list">{energyDistribution.map((item) => <div className="info-row" key={item.name}><span><i className="legend-dot" style={{ background: item.color, display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div></SectionCard><SectionCard title="Insight penggunaan"><div className="data-highlight"><div><span>Penggunaan Anda minggu ini</span><strong>Lebih hemat 8%</strong><span>Dibandingkan rata-rata minggu sebelumnya</span></div><TrendingDown color="#2ddd6c" size={32} /></div><div className="empty-state" style={{ minHeight: 130 }}><Lightbulb size={23} /><strong>Tips hemat energi</strong><span>Matikan perangkat yang tidak digunakan untuk menjaga konsumsi tetap efisien.</span></div></SectionCard></div></>;
}
