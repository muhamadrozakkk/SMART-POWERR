"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Check, CheckCircle2, Trash2 } from "lucide-react";
import { apiRequest, notificationLabel, type ApiNotification } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge, StatusBadge } from "@/components/ui/StatusBadge";
import { useI18n } from "@/lib/i18n";

export default function AlarmPage() {
  const { t, locale } = useI18n();
  const [alarms, setAlarms] = useState<ApiNotification[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let active = true;
    void apiRequest<{ data: ApiNotification[] }>("/api/notifications?unread_only=false").then((result) => { if (active) { setAlarms(result.data); setError(""); } }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Data alarm belum tersedia"); });
    return () => { active = false; };
  }, []);

  function notifyHeader() { window.dispatchEvent(new CustomEvent("spw:notifications-updated")); }

  async function markRead(id: number) {
    try { await apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }); setAlarms((current) => current.map((alarm) => alarm.id === id ? { ...alarm, is_read: true } : alarm)); setError(""); notifyHeader(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Status notifikasi gagal diperbarui"); }
  }

  async function deleteOne(alarm: ApiNotification) {
    if (!window.confirm(locale === "EN" ? `Delete notification “${t(notificationLabel(alarm.type))}”?` : `Hapus notifikasi “${notificationLabel(alarm.type)}”?`)) return;
    setBusyId(alarm.id);
    try { await apiRequest(`/api/notifications/${alarm.id}`, { method: "DELETE" }); setAlarms((current) => current.filter((item) => item.id !== alarm.id)); setError(""); notifyHeader(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Notifikasi gagal dihapus"); }
    finally { setBusyId(null); }
  }

  async function deleteAll() {
    if (!alarms.length || !window.confirm(locale === "EN" ? `Delete all ${alarms.length} notifications from this account? This cannot be undone.` : `Hapus semua ${alarms.length} notifikasi dari akun ini? Tindakan ini tidak dapat dibatalkan.`)) return;
    setClearing(true);
    try { await apiRequest("/api/notifications", { method: "DELETE" }); setAlarms([]); setError(""); notifyHeader(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Semua notifikasi gagal dihapus"); }
    finally { setClearing(false); }
  }

  const unread = alarms.filter((alarm) => !alarm.is_read);
  return <>
    <PageHeader title="Notifikasi" description="Peringatan dari pembacaan meter dan batas pemakaian yang Anda atur." action={<StatusBadge>{unread.length ? `${unread.length} ${t("belum dibaca")}` : t("Semua sudah dibaca")}</StatusBadge>} />
    {error && <p className="settings-status" role="alert">{error}</p>}
    <div className="data-highlight" style={{ marginBottom: 14 }}><div><span>{t("Status notifikasi")}</span><strong style={{ color: unread.length ? "#ff6971" : "#32dc6c" }}>{unread.length ? `${unread.length} ${t("belum dibaca")}` : t("Tidak ada notifikasi baru")}</strong><span>{alarms.length ? `${alarms.length} ${t("notifikasi tercatat.")}` : t("Notifikasi akan muncul jika pembacaan melewati batas yang diatur.")}</span></div>{unread.length ? <AlertTriangle color="#ff6971" size={34} /> : <CheckCircle2 color="#2fdb6a" size={34} />}</div>
    <SectionCard title="Riwayat notifikasi" action={<button type="button" className="danger-button" onClick={() => void deleteAll()} disabled={!alarms.length || clearing}>{clearing ? t("Menghapus...") : <><Trash2 size={15} />{t("Hapus Semua Notifikasi")}</>}</button>}>
      {!alarms.length ? <div className="empty-state"><Bell size={24} /><strong>{t("Belum ada notifikasi")}</strong><span>{t("Notifikasi akan tercatat setelah perangkat mengirim pembacaan yang melewati batas.")}</span></div> : <div className="alarm-list">{alarms.map((alarm) => {
        const severity = alarm.type === "device_offline" ? "medium" : "high";
        return <div className="alarm-item" key={alarm.id}>
          <div className={`alarm-item-icon ${severity === "high" ? "red" : ""}`}><AlertTriangle size={18} /></div>
          <div><strong>{t(notificationLabel(alarm.type))}</strong><span>{new Date(alarm.created_at).toLocaleString(locale === "EN" ? "en-US" : "id-ID")} · {t("Nilai")} {alarm.value} · {t("Batas")} {alarm.limit}</span></div>
          <SeverityBadge severity={severity} />
          <span className={`status-badge ${alarm.is_read ? "status-green" : "status-amber"}`}><Bell size={13} />{alarm.is_read ? t("Sudah dibaca") : t("Belum dibaca")}</span>
          {!alarm.is_read && <button className="secondary-button" onClick={() => void markRead(alarm.id)}><Check size={14} />{t("Tandai dibaca")}</button>}
          <button className="icon-button notification-delete-button" aria-label={`Hapus notifikasi ${notificationLabel(alarm.type)}`} disabled={busyId === alarm.id || clearing} onClick={() => void deleteOne(alarm)}>{busyId === alarm.id ? <span className="button-spinner" /> : <Trash2 size={17} />}</button>
        </div>;
      })}</div>}
    </SectionCard>
  </>;
}
