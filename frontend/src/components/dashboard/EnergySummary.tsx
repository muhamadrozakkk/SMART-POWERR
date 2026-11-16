import { Bolt } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { useI18n } from "@/lib/i18n";

export function EnergySummary({ energyKwh = 0 }: { energyKwh?: number }) {
  const { t, locale } = useI18n();
  const numberLocale = locale === "EN" ? "en-US" : "id-ID";
  return <SectionCard className="summary-card energy-summary"><div className="summary-icon icon-blue"><Bolt size={19} /></div><h3>{t("Energi Bulan Ini")}</h3><div className="summary-value">{energyKwh.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <small>kWh</small></div><p>{t("Akumulasi bulan berjalan")}</p><strong>{new Date().toLocaleDateString(numberLocale, { month: "long", year: "numeric" })}</strong><Bolt className="summary-watermark" size={59} /></SectionCard>;
}
