"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  return <div className={`language-toggle ${compact ? "compact" : ""}`} role="group" aria-label="Pilih bahasa">
    <button type="button" className={locale === "ID" ? "selected" : ""} aria-pressed={locale === "ID"} onClick={() => setLocale("ID")}>ID</button>
    <span aria-hidden="true">|</span>
    <button type="button" className={locale === "EN" ? "selected" : ""} aria-pressed={locale === "EN"} onClick={() => setLocale("EN")}>EN</button>
  </div>;
}
