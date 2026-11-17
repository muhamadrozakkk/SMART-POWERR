"use client";

import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Reading } from "@/lib/api";

export function MonitoringInsight({ latest, history }: { latest: Reading; history: Reading[] }) {
  const { locale, t } = useI18n();
  const numberLocale = locale === "EN" ? "en-US" : "id-ID";
  const peak = history.reduce<Reading | null>((highest, row) => !highest || row.power > highest.power ? row : highest, null);
  const average = history.length ? history.reduce((sum, row) => sum + row.power, 0) / history.length : latest.power;
  const hour = peak ? new Date(peak.timestamp).toLocaleTimeString(numberLocale, { hour: "2-digit", minute: "2-digit" }) : null;
  return <section className="energy-insight" aria-label="AI Energy Insight berdasarkan histori pengukuran">
    <div className="energy-insight-copy"><span className="energy-insight-icon"><Sparkles size={17} /></span><div><span className="energy-insight-kicker">AI ENERGY INSIGHT</span><h2>{t("Pola daya 24 jam terakhir")}</h2><p>{peak ? <>{t("Puncak historis tercatat")} <strong>{peak.power.toLocaleString(numberLocale)} W</strong> {t("sekitar")} {hour}; {t("rata-rata daya historis")} <strong>{average.toLocaleString(numberLocale, { maximumFractionDigits: 1 })} W</strong>. {t("Pertimbangkan meninjau jadwal penggunaan pada jam tersebut.")}</> : <>{t("Belum cukup histori untuk menyusun pola daya.")} {t("Daya terbaru")} <strong>{latest.power.toLocaleString(numberLocale)} W</strong>.</>}</p></div></div>
    <div className="energy-insight-stats"><div><span>{t("Pembacaan tersimpan")}</span><strong>{history.length}</strong></div><div><span>{t("Sumber insight")}</span><strong>API</strong><small>{t("Data perangkat saja")}</small></div></div>
  </section>;
}
