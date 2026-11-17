"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function PostLoginSplash({ locale, exiting = false }: { locale: "ID" | "EN"; exiting?: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setStep((value) => Math.min(4, value + 1)), 800); return () => window.clearInterval(timer); }, []);
  const statuses = locale === "EN" ? ["Securing your connection", "Reading your energy data", "Preparing your dashboard", "Connecting your devices", "Almost ready"] : ["Mengamankan koneksi", "Membaca data energi", "Menyiapkan dashboard", "Menghubungkan perangkat", "Sebentar lagi siap"];
  return <div className={`post-login-splash ${exiting ? "is-exiting" : ""}`} role="status" aria-live="polite"><div className="splash-aurora splash-aurora--one" /><div className="splash-aurora splash-aurora--two" /><div className="splash-centerpiece"><div className="splash-orbit splash-orbit--one" /><div className="splash-orbit splash-orbit--two" /><div className="splash-core"><Image src="/images/logo-smartpower.png" alt="SMART POWER WEB" width={164} height={164} priority /></div></div><div className="splash-particles"><i /><i /><i /><i /><i /><i /></div><p className="splash-status">{statuses[step]}</p><div className="splash-progress"><span /></div><p className="splash-powered">Powered by <strong>TEXA FT UNTIDAR</strong></p></div>;
}
