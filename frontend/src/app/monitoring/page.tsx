import { Radio, TimerReset } from "lucide-react";
import { energyMetrics, deviceStatus } from "@/data/dummyData";
import { PageHeader } from "@/components/common/PageHeader";
import { StatGrid } from "@/components/common/StatGrid";
import { PowerChart } from "@/components/dashboard/PowerChart";
import { SectionCard } from "@/components/ui/SectionCard";
import { OnlineBadge } from "@/components/ui/StatusBadge";

export default function MonitoringPage() {
  const stats = energyMetrics.slice(0, 4).map((metric) => ({ label: metric.label, value: `${metric.value} ${metric.unit}`, detail: metric.status, icon: metric.icon === "bolt" ? "zap" as const : metric.icon === "current" ? "activity" as const : "gauge" as const, tone: metric.accent }));
  return <><PageHeader title="Pemantauan Langsung" description="Pantau kondisi listrik rumah Anda secara real-time." action={<OnlineBadge>Data simulasi</OnlineBadge>} /><StatGrid stats={stats} /><div className="two-column"><PowerChart /><SectionCard title="Status pembacaan"><div className="data-highlight"><div><span>Pembaruan terakhir</span><strong>{deviceStatus.lastUpdate}</strong><span>Interval pembacaan 5 detik</span></div><Radio size={33} color="#32d86b" /></div><div className="info-list"><div className="info-row"><span>Frekuensi</span><strong>50.02 Hz</strong></div><div className="info-row"><span>Faktor Daya</span><strong>0.94</strong></div><div className="info-row"><span>Status perangkat</span><OnlineBadge /></div><div className="info-row"><span>Sumber data</span><strong>Mock data IoT</strong></div></div></SectionCard></div><SectionCard title="Keterangan"><div className="empty-state"><TimerReset size={24} /><strong>Simulasi real-time aktif</strong><span>Nilai tegangan, arus, dan daya berubah dalam rentang wajar sebagai persiapan integrasi API perangkat.</span></div></SectionCard></>;
}
