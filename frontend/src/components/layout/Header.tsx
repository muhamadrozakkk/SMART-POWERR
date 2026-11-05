"use client";

import { useState } from "react";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { OnlineBadge } from "@/components/ui/StatusBadge";

export function Header({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  function handleLogout() {
    document.cookie = "spw_demo_auth=; path=/; max-age=0";
    window.localStorage.removeItem("spw_access_token");
    router.push("/");
  }

  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu} aria-label="Buka menu"><Menu size={22} /></button>
    <div className="greeting"><h1>Selamat pagi, Rozak! <span>👋</span></h1><p>Ringkasan monitoring energi listrik secara real-time</p></div>
    <div className="topbar-actions">
      <OnlineBadge />
      <div className="header-menu-wrap">
        <button className="icon-button notification-button" aria-label="Notifikasi" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}><Bell size={21} /><span>3</span></button>
        {notificationsOpen ? <div className="header-popover notification-popover"><strong>Notifikasi Sistem</strong><div className="notification-item"><span className="notification-dot warning" /><div><b>Batas daya aman</b><small>Pemakaian masih dalam batas normal.</small></div></div><div className="notification-item"><span className="notification-dot online" /><div><b>Perangkat terhubung</b><small>ESP32-001 mengirim data terbaru.</small></div></div><button onClick={() => setNotificationsOpen(false)}>Tutup</button></div> : null}
      </div>
      <div className="header-menu-wrap">
        <button className="profile-trigger" aria-label="Buka menu profil" aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}><div className="avatar">R</div><div className="profile-copy"><strong>Rozak</strong><span>Admin</span></div><ChevronDown size={17} /></button>
        {profileOpen ? <div className="header-popover profile-popover"><button onClick={() => router.push("/profil")}>Profil saya</button><button onClick={handleLogout}>Keluar</button></div> : null}
      </div>
    </div>
  </header>;
}
