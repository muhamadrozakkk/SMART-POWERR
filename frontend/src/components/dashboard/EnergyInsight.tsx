import { Activity, CircleDollarSign, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function EnergyInsight({ power, todayCost, monthCost, monthEnergy }: { power: number; todayCost: number; monthCost: number; monthEnergy: number }) {
  const { t, locale } = useI18n();
  const numberLocale = locale === "EN" ? "en-US" : "id-ID";
  return <section className="energy-insight" aria-label="Energy insight dari pembacaan terbaru">
    <div className="energy-insight-copy"><span className="energy-insight-icon"><Sparkles size={17} /></span><div><span className="energy-insight-kicker">AI ENERGY INSIGHT · {t("INSIGHT ENERGI")}</span><h2>{t("Ringkasan penggunaan terkini")}</h2><p>{t("Daya aktif terakhir")} <strong>{power.toLocaleString(numberLocale)} W</strong>. {t("Estimasi biaya dihitung dari data energi tersimpan dan tarif akun.")}</p></div></div>
    <div className="energy-insight-stats"><div><span><Activity size={14} /> {t("Hari ini")}</span><strong>Rp {todayCost.toLocaleString(numberLocale)}</strong></div><div><span><CircleDollarSign size={14} /> {t("Bulan ini")}</span><strong>Rp {monthCost.toLocaleString(numberLocale)}</strong><small>{monthEnergy.toFixed(2)} kWh {t("tercatat")}</small></div></div>
  </section>;
}
