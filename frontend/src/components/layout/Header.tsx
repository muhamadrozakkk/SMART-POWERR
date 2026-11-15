"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { OnlineBadge } from "@/components/ui/StatusBadge";
import { apiRequest, notificationLabel, type ApiNotification } from "@/lib/api";

type HeaderDevice = { device_id: string; is_online: boolean };
type HeaderUser = { name: string; role: "DEVELOPER" | "USER" };

export function Header({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [devices, setDevices] = useState<HeaderDevice[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [notificationError, setNotificationError] = useState("");

  useEffect(() => {
    let active = true;
    const updateProfile = (event: Event) => setUser((event as CustomEvent<HeaderUser>).detail);
    window.addEventListener("spw:profile-updated", updateProfile);
    const refresh = async () => {
      const [userResult, deviceResult, notificationResult] = await Promise.allSettled([
        apiRequest<{ user: HeaderUser }>("/api/auth/me"),
        apiRequest<{ data: HeaderDevice[] }>("/api/devices"),
        apiRequest<{ data: ApiNotification[] }>("/api/notifications?unread_only=false"),
      ]);
      if (!active) return;
      if (userResult.status === "fulfilled") setUser(userResult.value.user);
      if (deviceResult.status === "fulfilled") setDevices(deviceResult.value.data);
      if (notificationResult.status === "fulfilled") {
        setNotifications(notificationResult.value.data);
        setNotificationError("");
      } else {
        setNotificationError(notificationResult.reason instanceof Error ? notificationResult.reason.message : "Notifikasi gagal dimuat.");
      }
    };
    void refresh();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("spw:profile-updated", updateProfile); };
  }, []);

  function handleLogout() {
    document.cookie = "spw_auth=; path=/; max-age=0";
    document.cookie = "spw_role=; path=/; max-age=0";
    window.localStorage.removeItem("spw_access_token");
    router.push("/");
  }

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const isOnline = devices.some((device) => device.is_online);
  const latestNotifications = notifications.slice(0, 4);

  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu} aria-label="Buka menu"><Menu size={22} /></button>
    <div className="greeting"><h1>Halo{user?.name ? `, ${user.name}` : ""}! <span>👋</span></h1><p>Ringkasan pemantauan energi listrik Anda</p></div>
    <div className="topbar-actions">
      <OnlineBadge online={devices.length > 0 && isOnline}>{devices.length > 0 ? (isOnline ? "Perangkat online" : "Perangkat offline") : "Belum ada perangkat"}</OnlineBadge>
      <div className="header-menu-wrap">
        <button className="icon-button notification-button" aria-label={`Notifikasi, ${unreadCount} belum dibaca`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}><Bell size={21} />{unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>
        {notificationsOpen && <div className="header-popover notification-popover"><strong>Notifikasi perangkat</strong>{notificationError ? <p role="alert">{notificationError}</p> : latestNotifications.length ? latestNotifications.map((notification) => <div className="notification-item" key={notification.id}><span className={`notification-dot ${notification.is_read ? "" : "warning"}`} /><div><b>{notificationLabel(notification.type)}</b><small>{new Date(notification.created_at).toLocaleString("id-ID")} · {notification.is_read ? "Sudah dibaca" : "Belum dibaca"}</small></div></div>) : <p className="notification-empty">Belum ada notifikasi dari perangkat Anda.</p>}<button onClick={() => { setNotificationsOpen(false); router.push("/alarm"); }}>Lihat semua notifikasi</button></div>}
      </div>
      <div className="header-menu-wrap">
        <button className="profile-trigger" aria-label="Buka menu profil" aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}><div className="avatar">{user?.name.slice(0, 1).toUpperCase() ?? "?"}</div><div className="profile-copy"><strong>{user?.name ?? "Akun"}</strong><span>{user?.role === "DEVELOPER" ? "Developer" : "Pengguna"}</span></div><ChevronDown size={17} /></button>
        {profileOpen && <div className="header-popover profile-popover"><button onClick={() => router.push("/profil")}>Profil saya</button><button onClick={handleLogout}>Keluar</button></div>}
      </div>
    </div>
  </header>;
}
