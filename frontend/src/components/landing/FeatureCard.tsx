import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function FeatureCard({ icon: Icon, tone, title, copy }: { icon: LucideIcon; tone: string; title: string; copy: string }) {
  const { t } = useI18n();
  return <article className="feature-card"><div className={`feature-icon ${tone}`}><Icon size={22} /></div><h3>{t(title)}</h3><p>{t(copy)}</p></article>;
}
