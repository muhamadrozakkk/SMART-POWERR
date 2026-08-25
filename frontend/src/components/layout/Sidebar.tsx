"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, Bolt, CircleUserRound, Clock3, DoorOpen, Gauge, LayoutGrid, Settings, WalletCards, X, Zap } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutGrid },
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
  return <>
    <div className={`sidebar-backdrop ${open ? "visible" : ""}`} onClick={onClose} />
    <aside className={`app-sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-brand"><div className="brand-mark"><Zap size={27} fill="currentColor" /></div><div><strong>SMART<br />POWER WEB</strong><span>Energy Monitoring System</span></div><button className="sidebar-close" onClick={onClose} aria-label="Tutup menu"><X size={20} /></button></div>
      <nav className="sidebar-nav">{navItems.map(({ label, href, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link key={href} href={href} className={active ? "active" : ""} onClick={onClose}><Icon size={21} strokeWidth={1.8} /><span>{label}</span></Link>;
      })}</nav>
      <div className="sidebar-bottom">
        <div className="connection-card"><div className="connection-title"><span className="status-dot" />Perangkat Online</div><p>Terhubung ke Smart Power Web</p><div className="connection-line" /><span>Terakhir Update</span><strong>10:30:45 WIB</strong><span>24 Mei 2025</span></div>
        <button className="logout-button"><DoorOpen size={20} />Logout</button>
      </div>
    </aside>
  </>;
}
