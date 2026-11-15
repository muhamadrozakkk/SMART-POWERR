import { Bell, Check } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { notificationLabel, type ApiNotification } from "@/lib/api";

export function AlarmStatus({ alarms = [] }: { alarms?: ApiNotification[] }) {
  const unread = alarms.filter((alarm) => !alarm.is_read);
  return <SectionCard className="summary-card alarm-card"><div className="summary-icon icon-red"><Bell size={18} /></div><h3>Notifikasi</h3>{unread.length ? <><strong>{unread.length} belum dibaca</strong><p>{notificationLabel(unread[0].type)} · {new Date(unread[0].created_at).toLocaleString("id-ID")}</p></> : <><div className="alarm-check"><Check size={31} strokeWidth={3} /></div><strong>{alarms.length ? "Semua sudah dibaca" : "Belum ada notifikasi"}</strong><p>{alarms.length ? "Tidak ada notifikasi baru." : "Notifikasi muncul saat pemakaian melewati batas yang diatur."}</p></>}</SectionCard>;
}
