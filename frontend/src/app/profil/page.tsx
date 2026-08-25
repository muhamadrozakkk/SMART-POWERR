"use client";

import { useState } from "react";
import { CircleUserRound, Mail, Save, ShieldCheck, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { OnlineBadge } from "@/components/ui/StatusBadge";

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Rozak");
  const [email, setEmail] = useState("rozak@example.com");
  function saveProfile() {
    setEditing(false);
  }
  return <><PageHeader title="Profil" description="Informasi akun dan perangkat yang terhubung." action={<button className={editing ? "primary-button" : "secondary-button"} onClick={editing ? saveProfile : () => setEditing(true)}>{editing ? <Save size={15} /> : null}{editing ? "Simpan profil" : "Edit profil"}</button>} />{editing ? <div className="profile-edit-note">Mode edit aktif. Perubahan profil ini tersimpan di sesi browser demo.</div> : null}<div className="two-column"><SectionCard title="Informasi pengguna"><div className="data-highlight"><div className="avatar" style={{ width: 58, height: 58, fontSize: 23 }}>R</div><div style={{ flex: 1 }}>{editing ? <div className="form-grid"><div className="form-field"><label htmlFor="profile-name">Nama pengguna</label><input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} /></div><div className="form-field"><label htmlFor="profile-email">Email</label><input id="profile-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div></div> : <><span>Nama pengguna</span><strong>{name}</strong><span>Pemilik Smart Power Web</span></>}</div></div><div className="info-list"><div className="info-row"><span><Mail size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Email</span><strong>{email}</strong></div><div className="info-row"><span><ShieldCheck size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Role</span><strong>Admin</strong></div><div className="info-row"><span><CircleUserRound size={16} style={{ verticalAlign: "middle", marginRight: 8 }} />Status akun</span><OnlineBadge>Aktif</OnlineBadge></div></div></SectionCard><SectionCard title="Perangkat terhubung"><div className="data-highlight"><div><span>Perangkat utama</span><strong>Smart Power Web</strong><span>ESP32-001</span></div><Smartphone color="#43adff" size={30} /></div><div className="info-row"><span>Jumlah perangkat</span><strong>1 perangkat</strong></div><div className="info-row"><span>Koneksi terakhir</span><strong>10:30:45 WIB</strong></div></SectionCard></div></>;
}
