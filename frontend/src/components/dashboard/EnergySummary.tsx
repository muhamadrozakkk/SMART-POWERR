import { Bolt } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export function EnergySummary() {
  return <SectionCard className="summary-card energy-summary"><div className="summary-icon icon-blue"><Bolt size={19} /></div><h3>Energi Bulan Ini</h3><div className="summary-value">112.45 <small>kWh</small></div><p>Periode</p><strong>1 - 24 Mei 2025</strong><Bolt className="summary-watermark" size={59} /></SectionCard>;
}
