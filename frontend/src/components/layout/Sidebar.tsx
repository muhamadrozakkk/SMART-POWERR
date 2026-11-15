"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, Bolt, CircleUserRound, Clock3, DoorOpen, Gauge, LayoutGrid, Settings, WalletCards, X, Zap } from "lucide-react";
import { PartnerLogos } from "@/components/landing/PartnerLogos";
import { apiRequest } from "@/lib/api";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { label: "Real-time", href: "/monitoring", icon: Activity },
  { label: "Riwayat Data", href: "/riwayat", icon: Clock3 },
  { label: "Energi", href: "/energi", icon: Bolt },
  { label: "Biaya", href: "/biaya", icon: WalletCards },
  { label: "Perangkat", href: "/perangkat", icon: Gauge },
  { label: "Alarm", href: "/alarm", icon: Bell },
  { label: "Pengaturan", href: "/pengaturan", icon: Settings },
  { label: "Profil", href: "/profil", icon: CircleUserRound },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [deviceState, setDeviceState] = useState<{ total: number; online: number } | null>(null);
  useEffect(() => { let active = true; void apiRequest<{ data: Array<{ is_online: boolean }> }>("/api/devices").then(({ data }) => { if (active) setDeviceState({ total: data.length, online: data.filter((device) => device.is_online).length }); }).catch(() => { if (active) setDeviceState(null); }); return () => { active = false; }; }, []);
  function handleLogout() {
    document.cookie = "spw_auth=; path=/; max-age=0";
    document.cookie = "spw_role=; path=/; max-age=0";
    window.localStorage.removeItem("spw_access_token");
    onClose();
    router.push("/");
  }
  return <>
    <div className={`sidebar-backdrop ${open ? "visible" : ""}`} onClick={onClose} />
    <aside className={`app-sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand"><div className="brand-mark"><Zap size={27} fill="currentColor" /></div><div className="sidebar-brand-copy"><strong>SMART<br />POWER WEB</strong><span>Energy Monitoring System</span><PartnerLogos className="sidebar-partners" /></div><button className="sidebar-close" onClick={onClose} aria-label="Tutup menu"><X size={20} /></button></div>
      <nav className="sidebar-nav">{navItems.map(({ label, href, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
        return <Link key={href} href={href} className={active ? "active" : ""} onClick={onClose}><Icon size={21} strokeWidth={1.8} /><span>{label}</span></Link>;
      })}</nav>
      <div className="sidebar-bottom">
        <div className="connection-card"><div className="connection-title"><span className={`status-dot ${deviceState?.online ? "" : "status-dot-offline"}`} />Status perangkat</div><p>{deviceState ? deviceState.total ? `${deviceState.online} dari ${deviceState.total} perangkat terhubung.` : "Belum ada perangkat yang ditautkan ke akun ini." : "Status perangkat belum dapat dimuat."}</p><div className="connection-line" /><Link href="/perangkat" onClick={onClose}>Lihat perangkat</Link></div>
        <button className="logout-button" onClick={handleLogout}><DoorOpen size={20} />Logout</button>
      </div>
    </aside>
  </>;
}
