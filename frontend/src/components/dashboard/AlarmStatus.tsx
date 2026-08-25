import { Bell, Check } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";

export function AlarmStatus() {
  return <SectionCard className="summary-card alarm-card"><div className="summary-icon icon-red"><Bell size={18} /></div><h3>Alarm</h3><div className="alarm-check"><Check size={31} strokeWidth={3} /></div><strong>Tidak ada alarm</strong><p>Sistem berjalan normal</p></SectionCard>;
}
