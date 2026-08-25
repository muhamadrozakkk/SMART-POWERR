import { CheckCircle2, Wifi } from "lucide-react";
import { deviceStatus } from "@/data/dummyData";
import { SectionCard } from "@/components/ui/SectionCard";
import { OnlineBadge } from "@/components/ui/StatusBadge";

export function DeviceStatus() {
  return <SectionCard className="summary-card device-card"><div className="summary-icon icon-teal"><Wifi size={19} /></div><h3>Status Perangkat</h3><div className="device-name">{deviceStatus.name} <OnlineBadge /></div><p>Terakhir update</p><strong>{deviceStatus.lastUpdate}</strong><CheckCircle2 className="device-check" size={18} /></SectionCard>;
}
