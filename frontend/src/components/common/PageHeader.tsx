"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

export function PageHeader({ eyebrow = "SMART POWER WEB", title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  const { t } = useI18n();
  return <div className="page-heading"><div><span className="eyebrow">{t(eyebrow)}</span><h1>{t(title)}</h1><p>{t(description)}</p></div>{action}</div>;
}
