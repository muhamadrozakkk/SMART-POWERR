import { ReceiptText, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { useI18n } from "@/lib/i18n";

export function LiveCostCard({ value = 0, tariff = 0 }: { value?: number; tariff?: number }) {
  const { t, locale } = useI18n();
  const numberLocale = locale === "EN" ? "en-US" : "id-ID";
  return <SectionCard className="live-cost-card"><div className="live-cost-heading"><div className="summary-icon icon-amber"><ReceiptText size={19} /></div><span>{t("Estimasi Biaya Listrik")}</span><span className="live-pill"><i /> {t("Real-time")}</span></div><strong>Rp {value.toLocaleString(numberLocale)}</strong><p>{t("Perkiraan berdasarkan tarif Rp")} {tariff.toLocaleString(numberLocale)} / kWh</p><TrendingUp className="live-cost-watermark" size={76} /></SectionCard>;
}
