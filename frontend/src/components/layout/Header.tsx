"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { OnlineBadge } from "@/components/ui/StatusBadge";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { apiRequest, notificationLabel, type ApiNotification } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatWibDateTime } from "@/lib/datetime";

type HeaderDevice = { device_id: string; is_online: boolean };
type HeaderUser = { name: string; role: "DEVELOPER" | "USER"; avatarUrl?: string | null };

export function Header({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [devices, setDevices] = useState<HeaderDevice[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [notificationError, setNotificationError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [userResult, deviceResult, notificationResult] = await Promise.allSettled([
      apiRequest<{ user: HeaderUser }>("/api/auth/me"),
      apiRequest<{ data: HeaderDevice[] }>("/api/devices"),
      apiRequest<{ data: ApiNotification[] }>("/api/notifications?unread_only=false"),
    ]);
    if (userResult.status === "fulfilled") setUser(userResult.value.user);
    if (deviceResult.status === "fulfilled") setDevices(deviceResult.value.data);
    if (notificationResult.status === "fulfilled") { setNotifications(notificationResult.value.data); setNotificationError(""); }
    else setNotificationError(notificationResult.reason instanceof Error ? notificationResult.reason.message : t("Notifikasi gagal dimuat."));
  }, [t]);

  useEffect(() => {
    let active = true;
    const safeRefresh = () => { if (active) void refresh(); };
    const updateProfile = (event: Event) => { const updated = (event as CustomEvent<HeaderUser>).detail; setUser(updated); setAvatarUrl(updated.avatarUrl ?? null); };
    const loadAvatar = () => { if (active) void apiRequest<{ avatarUrl: string | null }>("/api/user/avatar").then((result) => { if (active) setAvatarUrl(result.avatarUrl); }).catch(() => undefined); };
    window.addEventListener("spw:profile-updated", updateProfile);
    window.addEventListener("spw:notifications-updated", safeRefresh);
    const initialRefresh = window.setTimeout(() => { if (active) { void refresh(); loadAvatar(); } }, 0);
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 30000);
    return () => { active = false; window.clearTimeout(initialRefresh); window.clearInterval(timer); window.removeEventListener("spw:profile-updated", updateProfile); window.removeEventListener("spw:notifications-updated", safeRefresh); };
  }, [refresh]);

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
    <button className="mobile-menu" onClick={onMenu} aria-label={t("Buka menu")}><Menu size={22} /></button>
    <div className="greeting"><h1>{locale === "EN" ? "Hello" : "Halo"}{user?.name ? `, ${user.name}` : ""}! <span>👋</span></h1><p>{t("Ringkasan pemantauan energi listrik Anda")}</p></div>
    <div className="topbar-actions">
      <OnlineBadge online={devices.length > 0 && isOnline}>{devices.length > 0 ? (isOnline ? t("Perangkat online") : t("Perangkat offline")) : t("Belum ada perangkat")}</OnlineBadge>
      <LanguageToggle compact />
      <div className="header-menu-wrap">
        <button className="icon-button notification-button" aria-label={`${t("Notifikasi")}, ${unreadCount} ${t("Belum dibaca")}`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}><Bell size={21} />{unreadCount > 0 && <span>{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>
        {notificationsOpen && <div className="header-popover notification-popover"><strong>{t("Notifikasi perangkat")}</strong>{notificationError ? <p role="alert">{notificationError}</p> : latestNotifications.length ? latestNotifications.map((notification) => <div className="notification-item" key={notification.id}><span className={`notification-dot ${notification.is_read ? "" : "warning"}`} /><div><b>{t(notificationLabel(notification.type))}</b><small>{formatWibDateTime(notification.created_at, locale === "EN" ? "en-US" : "id-ID")} · {notification.is_read ? t("Sudah dibaca") : t("Belum dibaca")}</small></div></div>) : <p className="notification-empty">{t("Belum ada notifikasi dari perangkat Anda.")}</p>}<button onClick={() => { setNotificationsOpen(false); router.push("/alarm"); }}>{t("Lihat semua notifikasi")}</button></div>}
      </div>
      <div className="header-menu-wrap">
        <button className="profile-trigger" aria-label={t("Buka menu profil")} aria-expanded={profileOpen} onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}><div className="avatar">{avatarUrl ? <Image src={avatarUrl} alt="" width={36} height={36} unoptimized /> : user?.name.slice(0, 1).toUpperCase() ?? "?"}</div><div className="profile-copy"><strong>{user?.name ?? t("Akun")}</strong><span>{user?.role === "DEVELOPER" ? t("Developer") : t("Pengguna")}</span></div><ChevronDown size={17} /></button>
        {profileOpen && <div className="header-popover profile-popover"><button onClick={() => router.push("/profil")}>{t("Profil saya")}</button><button onClick={handleLogout}>{t("Keluar")}</button></div>}
      </div>
    </div>
  </header>;
}
