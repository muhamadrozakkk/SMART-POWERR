"use client";

import { useEffect, useState } from "react";
import { CircleUserRound, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { apiRequest, type ApiDeviceStatus } from "@/lib/api";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { OnlineBadge } from "@/components/ui/StatusBadge";

type Profile = { id: number; name: string; email: string; role: "DEVELOPER" | "USER" };
export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null); const [device, setDevice] = useState<ApiDeviceStatus | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; void Promise.allSettled([apiRequest<{ user: Profile }>("/api/auth/me"), apiRequest<{ data: ApiDeviceStatus }>("/api/device")]).then(([userResult, deviceResult]) => { if (!active) return; if (userResult.status === "fulfilled") setProfile(userResult.value.user); else setError(userResult.reason instanceof Error ? userResult.reason.message : "Profil gagal dimuat"); if (deviceResult.status === "fulfilled") setDevice(deviceResult.value.data); }); return () => { active = false; }; }, []);
  return <><PageHeader title="Profil" description="Informasi akun yang sedang masuk." />{error && <p className="settings-status">{error}</p>}<div className="two-column"><SectionCard title="Informasi pengguna"><div className="data-highlight"><div className="avatar" style={{ width: 58, height: 58, fontSize: 23 }}>{profile?.name.slice(0, 1).toUpperCase() ?? "?"}</div><div><span>Nama pengguna</span><strong>{profile?.name ?? "Memuat..."}</strong><span>Akun SMART POWER WEB</span></div></div><div className="info-list"><div className="info-row"><span><Mail size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Email</span><strong>{profile?.email ?? "Memuat..."}</strong></div><div className="info-row"><span><ShieldCheck size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Role</span><strong>{profile?.role ?? "Memuat..."}</strong></div><div className="info-row"><span><CircleUserRound size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Status akun</span><OnlineBadge>{profile ? "Aktif" : "Memuat..."}</OnlineBadge></div></div></SectionCard><SectionCard title="Perangkat terhubung">{device ? <><div className="data-highlight"><div><span>Perangkat utama</span><strong>{device.name}</strong><span>{device.device_id}</span></div><Smartphone color="#43adff" size={30} /></div><div className="info-row"><span>Koneksi</span><strong>{device.is_online ? "Online" : "Offline"}</strong></div><div className="info-row"><span>Terakhir terlihat</span><strong>{device.last_seen ? new Date(device.last_seen).toLocaleString("id-ID") : "Belum ada payload"}</strong></div></> : <div className="empty-state"><Smartphone size={24} /><span>Belum ada perangkat tertaut ke akun ini.</span></div>}</SectionCard></div></>;
}
