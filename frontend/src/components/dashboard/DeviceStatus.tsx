import { CheckCircle2, Wifi } from "lucide-react";
import type { DeviceStatus as DeviceStatusData } from "@/types/energy";
import { SectionCard } from "@/components/ui/SectionCard";
import { OnlineBadge } from "@/components/ui/StatusBadge";
import { useI18n } from "@/lib/i18n";

export function DeviceStatus({ deviceStatus }: { deviceStatus?: DeviceStatusData }) {
  const { t } = useI18n();
  return <SectionCard className="summary-card device-card"><div className="summary-icon icon-teal"><Wifi size={19} /></div><h3>{t("Status Perangkat")}</h3>{deviceStatus ? <><div className="device-name">{deviceStatus.name} <OnlineBadge>{deviceStatus.online ? "Online" : "Offline"}</OnlineBadge></div><p>{t("Terakhir update")}</p><strong>{deviceStatus.lastUpdate}</strong><CheckCircle2 className="device-check" size={18} /></> : <div className="empty-state"><strong>{t("Perangkat belum tertaut")}</strong><span>{t("Tautkan perangkat ke akun ini melalui dashboard Developer.")}</span></div>}</SectionCard>;
}
