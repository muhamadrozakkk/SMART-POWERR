import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = { title: "Smart Power Web", description: "Sistem manajemen energi listrik rumah tangga berbasis IoT" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><AppShell>{children}</AppShell></body></html>;
}
