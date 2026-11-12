import { CheckCircle2, Wifi } from "lucide-react";
import type { DeviceStatus as DeviceStatusData } from "@/types/energy";
import { SectionCard } from "@/components/ui/SectionCard";
import { OnlineBadge } from "@/components/ui/StatusBadge";

export function DeviceStatus({ deviceStatus }: { deviceStatus?: DeviceStatusData }) {
  return <SectionCard className="summary-card device-card"><div className="summary-icon icon-teal"><Wifi size={19} /></div><h3>Status Perangkat</h3>{deviceStatus ? <><div className="device-name">{deviceStatus.name} <OnlineBadge>{deviceStatus.online ? "Online" : "Offline"}</OnlineBadge></div><p>Terakhir update</p><strong>{deviceStatus.lastUpdate}</strong><CheckCircle2 className="device-check" size={18} /></> : <div className="empty-state"><strong>Perangkat belum tertaut</strong><span>Tautkan perangkat ke akun ini melalui dashboard Developer.</span></div>}</SectionCard>;
}
