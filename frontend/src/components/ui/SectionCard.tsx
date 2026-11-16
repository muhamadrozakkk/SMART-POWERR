"use client";

import { useI18n } from "@/lib/i18n";

export function SectionCard({ children, className = "", title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  const { t } = useI18n();
  return <section className={`panel-card ${className}`}>{title ? <div className="panel-heading"><h2>{t(title)}</h2>{action}</div> : null}{children}</section>;
}
