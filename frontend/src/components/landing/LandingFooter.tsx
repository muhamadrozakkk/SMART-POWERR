"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export function LandingFooter() {
  const { t } = useI18n();
  return <footer className="landing-footer"><div><Link href="/" className="footer-brand">SMART POWER WEB</Link><p>{t("Platform manajemen energi rumah tangga berbasis IoT.")}</p></div><div className="footer-links"><Link href="/fitur">{t("Fitur")}</Link><Link href="/tentang">{t("Tentang")}</Link><Link href="/kontak">{t("Kontak")}</Link><Link href="/login">{t("Masuk")}</Link></div><div className="landing-footer-meta"><span>© 2026 SMART POWER WEB. {t("All rights reserved.")}</span><span>{t("Powered by")} <strong>TEXA FT UNTIDAR</strong></span></div></footer>;
}
