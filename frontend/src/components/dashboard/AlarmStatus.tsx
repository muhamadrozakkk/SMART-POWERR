import { Bell, Check } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { notificationLabel, type ApiNotification } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function AlarmStatus({ alarms = [] }: { alarms?: ApiNotification[] }) {
  const { t, locale } = useI18n();
  const unread = alarms.filter((alarm) => !alarm.is_read);
  return <SectionCard className="summary-card alarm-card"><div className="summary-icon icon-red"><Bell size={18} /></div><h3>{t("Notifikasi")}</h3>{unread.length ? <><strong>{unread.length} {t("belum dibaca")}</strong><p>{t(notificationLabel(unread[0].type))} · {new Date(unread[0].created_at).toLocaleString(locale === "EN" ? "en-US" : "id-ID")}</p></> : <><div className="alarm-check"><Check size={31} strokeWidth={3} /></div><strong>{alarms.length ? t("Semua sudah dibaca") : t("Belum ada notifikasi")}</strong><p>{alarms.length ? t("Tidak ada notifikasi baru.") : t("Notifikasi muncul saat pemakaian melewati batas yang diatur.")}</p></>}</SectionCard>;
}
