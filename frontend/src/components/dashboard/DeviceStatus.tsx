import { CheckCircle2, Wifi } from "lucide-react";
import { deviceStatus as defaultDeviceStatus } from "@/data/dummyData";
import type { DeviceStatus as DeviceStatusData } from "@/types/energy";
import { SectionCard } from "@/components/ui/SectionCard";
import { OnlineBadge } from "@/components/ui/StatusBadge";

export function DeviceStatus({ deviceStatus = defaultDeviceStatus }: { deviceStatus?: DeviceStatusData }) {
  return <SectionCard className="summary-card device-card"><div className="summary-icon icon-teal"><Wifi size={19} /></div><h3>Status Perangkat</h3><div className="device-name">{deviceStatus.name} <OnlineBadge /></div><p>Terakhir update</p><strong>{deviceStatus.lastUpdate}</strong><CheckCircle2 className="device-check" size={18} /></SectionCard>;
}
