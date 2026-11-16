"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { PartnerLogos } from "@/components/landing/PartnerLogos";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useI18n } from "@/lib/i18n";

export function LandingHeader() {
  const { t } = useI18n();
  return <header className="landing-header"><Link href="/" className="landing-brand"><Image src="/images/logo-smartpower.png" alt="" width={46} height={46} priority /><span>SMART <em>POWER</em> WEB</span></Link><PartnerLogos className="landing-header-partners" /><nav className="landing-nav" aria-label={t("Navigasi utama")}><Link href="/">{t("Beranda")}</Link><Link href="/fitur">{t("Fitur")}</Link><Link href="/tentang">{t("Tentang")}</Link><Link href="/kontak">{t("Kontak")}</Link></nav><div className="landing-header-tools"><LanguageToggle /><Link href="/login" className="landing-login"><ShieldCheck size={16} />{t("Masuk")}</Link></div></header>;
}
