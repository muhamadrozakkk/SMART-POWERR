import { Bell, Check } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import type { ApiNotification } from "@/lib/api";

export function AlarmStatus({ alarms = [] }: { alarms?: ApiNotification[] }) {
  const unread = alarms.filter((alarm) => !alarm.is_read);
  return <SectionCard className="summary-card alarm-card"><div className="summary-icon icon-red"><Bell size={18} /></div><h3>Alarm</h3>{unread.length ? <><strong>{unread.length} alarm belum dibaca</strong><p>{unread[0].type.replaceAll("_", " ")} · {new Date(unread[0].created_at).toLocaleString("id-ID")}</p></> : <><div className="alarm-check"><Check size={31} strokeWidth={3} /></div><strong>{alarms.length ? "Tidak ada alarm baru" : "Belum ada alarm"}</strong><p>{alarms.length ? "Semua alarm telah dibaca" : "Alarm akan muncul setelah data perangkat diterima"}</p></>}</SectionCard>;
}
