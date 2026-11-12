import { Bolt } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export function EnergySummary({ energyKwh = 0 }: { energyKwh?: number }) {
  return <SectionCard className="summary-card energy-summary"><div className="summary-icon icon-blue"><Bolt size={19} /></div><h3>Energi Bulan Ini</h3><div className="summary-value">{energyKwh.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <small>kWh</small></div><p>Akumulasi bulan berjalan</p><strong>{new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</strong><Bolt className="summary-watermark" size={59} /></SectionCard>;
}
