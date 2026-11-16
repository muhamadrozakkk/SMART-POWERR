"use client";

import { MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/landing/ContactForm";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { useI18n } from "@/lib/i18n";

export default function ContactPage() {
  const { t } = useI18n();
  return <div className="landing-page"><LandingHeader /><main className="public-page-main"><section className="public-hero"><span className="section-kicker">{t("KONTAK PROYEK")}</span><h1>{t("Ada masukan")}<br /><span>{t("tentang sistem?")}</span></h1><p>{t("Kirim pertanyaan atau masukan melalui form kontak SMART POWER WEB.")}</p></section><section className="contact-grid"><div className="contact-info"><div className="contact-info-card"><MessageCircle size={20} /><div><strong>{t("Form kontak proyek")}</strong><span>{t("Pesan dikirim ke backend aplikasi.")}</span></div></div><div className="contact-note"><MessageCircle size={20} /><p>{t("Form saat ini mencatat penerimaan di backend dan belum mengirim email otomatis kepada tim.")}</p></div></div><ContactForm /></section></main><LandingFooter /></div>;
}
