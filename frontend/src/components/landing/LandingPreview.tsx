"use client";

import { Activity, Bell, Bolt, CircleUserRound, Gauge, LayoutGrid, Settings, WalletCards } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const previewMetrics = [
  { label: "Daya aktif", value: "350", unit: "W", points: "0,22 14,18 28,20 42,11 56,14 70,7 84,10 100,4" },
  { label: "Arus", value: "1,6", unit: "A", points: "0,19 14,16 28,20 42,10 56,14 70,8 84,12 100,5" },
  { label: "Tegangan", value: "220,4", unit: "V", points: "0,16 14,13 28,15 42,12 56,14 70,10 84,12 100,9" },
  { label: "Energi", value: "12,4", unit: "kWh", points: "0,23 14,20 28,18 42,17 56,12 70,10 84,7 100,4" },
  { label: "Frekuensi", value: "50,0", unit: "Hz", points: "0,15 14,14 28,15 42,13 56,14 70,12 84,13 100,11" },
  { label: "Faktor daya", value: "0,98", unit: "pf", points: "0,17 14,15 28,16 42,13 56,14 70,11 84,12 100,9" },
];
const previewLinks = [[LayoutGrid, "Ringkasan"], [Activity, "Monitoring"], [Gauge, "Riwayat"], [Bolt, "Analisis"], [WalletCards, "Biaya"], [Settings, "Pengaturan"], [CircleUserRound, "Profil"]] as const;

export function LandingPreview() {
  const { t } = useI18n();
  return <div className="landing-preview" aria-label={t("Mockup dashboard dengan nilai ilustratif, bukan data perangkat langsung")}>
    <aside className="preview-sidebar"><div className="preview-brand"><Bolt size={13} fill="currentColor" />SMART POWER WEB</div><div className="preview-nav">{previewLinks.map(([Icon, label], index) => <div key={label} className={index === 0 ? "active" : ""}><Icon size={10} />{t(label)}</div>)}</div></aside>
    <div className="preview-content">
      <div className="preview-top"><div><strong>{t("Ringkasan energi rumah")}</strong><span>{t("Contoh tampilan dashboard")}</span></div><div className="preview-user"><Bell size={11} /><span className="preview-avatar">SP</span></div></div>
      <div className="preview-metrics">{previewMetrics.map((metric) => <div className="preview-metric" key={metric.label}><span>{t(metric.label)}</span><strong>{metric.value}<small>{metric.unit}</small></strong><svg className="preview-sparkline" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true"><polyline points={metric.points} /></svg><small>{t("Contoh pembacaan")}</small></div>)}</div>
      <div className="preview-bottom"><div className="preview-chart"><div className="preview-heading"><strong>{t("Grafik daya · 24 jam")}</strong><span>{t("Contoh histori")}</span></div><svg viewBox="0 0 400 150" preserveAspectRatio="none" role="img" aria-label={t("Grafik ilustratif daya selama 24 jam")}><path className="preview-chart-grid" d="M0 30H400M0 70H400M0 110H400M0 149H400M40 0V150M130 0V150M220 0V150M310 0V150M399 0V150" /><polyline className="preview-line-blue" points="0,120 35,92 70,80 105,89 140,55 175,67 210,42 245,50 280,30 315,62 350,44 400,54" /><polyline className="preview-line-green" points="0,132 35,115 70,108 105,83 140,92 175,75 210,88 245,57 280,69 315,47 350,61 400,34" /><polyline className="preview-line-purple" points="0,140 35,125 70,118 105,130 140,96 175,105 210,81 245,92 280,66 315,79 350,72 400,86" /></svg><div className="preview-chart-labels"><span>00</span><span>06</span><span>12</span><span>18</span><span>24 {t("jam")}</span></div></div><div className="preview-donut"><strong>{t("Status sistem")}</strong><div className="preview-donut-body preview-system-flow"><span>{t("Satu sensor pada jalur masuk")}</span><span>ESP32 · Wi-Fi · {t("Database")}</span><span>{t("LCD lokal dan dashboard web")}</span></div></div></div>
      <div className="preview-footnote"><span>{t("Nilai dan grafik hanya contoh visual.")}</span><span>{t("Data akun tampil setelah perangkat mengirim pembacaan.")}</span></div>
    </div>
  </div>;
}
