import { ReceiptText, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export function LiveCostCard({ value = 0, tariff = 0 }: { value?: number; tariff?: number }) {
  return <SectionCard className="live-cost-card"><div className="live-cost-heading"><div className="summary-icon icon-amber"><ReceiptText size={19} /></div><span>Estimasi Biaya Listrik</span><span className="live-pill"><i /> Real-time</span></div><strong>Rp {value.toLocaleString("id-ID")}</strong><p>Perkiraan berdasarkan tarif Rp {tariff.toLocaleString("id-ID")} / kWh</p><TrendingUp className="live-cost-watermark" size={76} /></SectionCard>;
}
