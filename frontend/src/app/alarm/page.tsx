import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react";
import { alarmData } from "@/data/dummyData";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge, StatusBadge } from "@/components/ui/StatusBadge";

export default function AlarmPage() {
  return <><PageHeader title="Alarm" description="Riwayat kondisi yang perlu Anda perhatikan." action={<StatusBadge>Semua sistem normal</StatusBadge>} /><div className="data-highlight" style={{ marginBottom: 14 }}><div><span>Status alarm saat ini</span><strong style={{ color: "#32dc6c" }}>Tidak ada alarm aktif</strong><span>Perangkat dan konsumsi listrik berada dalam batas aman.</span></div><CheckCircle2 color="#2fdb6a" size={34} /></div><SectionCard title="Riwayat alarm"><div className="alarm-list">{alarmData.map((alarm) => <div className="alarm-item" key={`${alarm.type}-${alarm.time}`}><div className={`alarm-item-icon ${alarm.severity === "high" ? "red" : ""}`}><AlertTriangle size={18} /></div><div><strong>{alarm.type}</strong><span>{alarm.time} · Nilai {alarm.value}</span></div><SeverityBadge severity={alarm.severity} /><span className="status-badge status-green"><Bell size={13} />{alarm.status}</span></div>)}</div></SectionCard></>;
}
