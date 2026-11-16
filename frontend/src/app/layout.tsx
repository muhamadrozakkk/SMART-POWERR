import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { ClientProviders } from "@/components/providers/ClientProviders";
import "./globals.css";

export const metadata: Metadata = { title: "Smart Power Web", description: "Sistem manajemen energi listrik rumah tangga berbasis IoT", icons: { icon: "/images/logo-smartpower.png", shortcut: "/images/logo-smartpower.png", apple: "/images/logo-smartpower.png" } };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><ClientProviders><AppShell>{children}</AppShell></ClientProviders></body></html>;
}
