"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, Check, CheckCircle2 } from "lucide-react";
import { apiRequest, type ApiNotification } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { SeverityBadge, StatusBadge } from "@/components/ui/StatusBadge";

export default function AlarmPage() {
  const [alarms, setAlarms] = useState<ApiNotification[]>([]); const [error, setError] = useState("");
  useEffect(() => { let active = true; void apiRequest<{ data: ApiNotification[] }>("/api/notifications?unread_only=false").then((result) => { if (active) { setAlarms(result.data); setError(""); } }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Data alarm belum tersedia"); }); return () => { active = false; }; }, []);
  async function markRead(id: number) { try { await apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" }); setAlarms((current) => current.map((alarm) => alarm.id === id ? { ...alarm, is_read: true } : alarm)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Status notifikasi gagal diperbarui"); } }
  const unread = alarms.filter((alarm) => !alarm.is_read);
  return <><PageHeader title="Notifikasi" description="Peringatan berdasarkan pembacaan meter total rumah." action={<StatusBadge>{unread.length ? `${unread.length} belum dibaca` : "Semua sudah dibaca"}</StatusBadge>} />{error && <p className="settings-status">{error}</p>}<div className="data-highlight" style={{ marginBottom: 14 }}><div><span>Status notifikasi</span><strong style={{ color: unread.length ? "#ff6971" : "#32dc6c" }}>{unread.length ? `${unread.length} belum dibaca` : "Tidak ada notifikasi baru"}</strong><span>{alarms.length ? `Total ${alarms.length} notifikasi tercatat.` : "Notifikasi muncul saat nilai aktual melewati batas pengaturan."}</span></div>{unread.length ? <AlertTriangle color="#ff6971" size={34} /> : <CheckCircle2 color="#2fdb6a" size={34} />}</div><SectionCard title="Riwayat notifikasi">{!alarms.length ? <div className="empty-state"><Bell size={24} /><strong>Belum ada notifikasi</strong><span>Notifikasi akan tampil setelah pembacaan melewati ambang yang diatur.</span></div> : <div className="alarm-list">{alarms.map((alarm) => { const severity = alarm.type === "device_offline" ? "medium" : "high"; return <div className="alarm-item" key={alarm.id}><div className={`alarm-item-icon ${severity === "high" ? "red" : ""}`}><AlertTriangle size={18} /></div><div><strong>{alarm.type.replaceAll("_", " ")}</strong><span>{new Date(alarm.created_at).toLocaleString("id-ID")} · Nilai {alarm.value} · Batas {alarm.limit}</span></div><SeverityBadge severity={severity} /><span className={`status-badge ${alarm.is_read ? "status-green" : "status-amber"}`}><Bell size={13} />{alarm.is_read ? "Dibaca" : "Belum dibaca"}</span>{!alarm.is_read && <button className="secondary-button" onClick={() => void markRead(alarm.id)}><Check size={14} />Tandai dibaca</button>}</div>; })}</div>}</SectionCard></>;
}
