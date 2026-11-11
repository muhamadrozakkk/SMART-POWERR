"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => { const handleUnauthorized = () => router.push(`/login?message=${encodeURIComponent("Sesi berakhir, silakan masuk kembali.")}`); window.addEventListener("spw:unauthorized", handleUnauthorized); return () => window.removeEventListener("spw:unauthorized", handleUnauthorized); }, [router]);
  if (["/", "/login", "/forgot-password", "/reset-password", "/fitur", "/tentang", "/kontak"].includes(pathname)) return <>{children}</>;
  return <div className="app-shell"><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><div className="main-area"><Header onMenu={() => setSidebarOpen(true)} /><main className="content-area">{children}</main></div></div>;
}
