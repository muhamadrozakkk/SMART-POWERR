"use client";

import { Bell, ChevronDown, Menu } from "lucide-react";
import { OnlineBadge } from "@/components/ui/StatusBadge";

export function Header({ onMenu }: { onMenu: () => void }) {
  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu} aria-label="Buka menu"><Menu size={22} /></button>
    <div className="greeting"><h1>Selamat pagi, Rozak! <span>👋</span></h1><p>Ringkasan monitoring energi listrik secara real-time</p></div>
    <div className="topbar-actions"><OnlineBadge /><button className="icon-button notification-button" aria-label="Notifikasi"><Bell size={21} /><span>3</span></button><div className="profile-trigger"><div className="avatar">R</div><div className="profile-copy"><strong>Rozak</strong><span>Admin</span></div><ChevronDown size={17} /></div></div>
  </header>;
}
