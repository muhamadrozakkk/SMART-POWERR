import type { LucideIcon } from "lucide-react";

export function FeatureCard({ icon: Icon, tone, title, copy }: { icon: LucideIcon; tone: string; title: string; copy: string }) {
  return <article className="feature-card"><div className={`feature-icon ${tone}`}><Icon size={22} /></div><h3>{title}</h3><p>{copy}</p></article>;
}
