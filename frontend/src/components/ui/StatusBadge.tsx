"use client";

import { CheckCircle2, CircleAlert, Wifi } from "lucide-react";
import type { MetricStatus } from "@/types/energy";
import { useI18n } from "@/lib/i18n";

const toneMap: Record<MetricStatus, string> = {
  normal: "status-green",
  stable: "status-green",
  good: "status-green",
  warning: "status-amber",
  danger: "status-red",
};

export function StatusBadge({ children, tone = "normal", dot = true }: { children: React.ReactNode; tone?: MetricStatus; dot?: boolean }) {
  const { t } = useI18n();
  return <span className={`status-badge ${toneMap[tone]}`}>{dot ? <span className="status-dot" /> : null}{typeof children === "string" ? t(children) : children}</span>;
}

export function OnlineBadge({ children = "Online", online = true }: { children?: React.ReactNode; online?: boolean }) {
  const { t } = useI18n();
  return <span className={`online-badge ${online ? "online-badge-active" : "online-badge-inactive"}`}><Wifi size={13} />{typeof children === "string" ? t(children) : children}</span>;
}

export function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const { t } = useI18n();
  const config = { low: ["Rendah", "status-green", CheckCircle2], medium: ["Sedang", "status-amber", CircleAlert], high: ["Tinggi", "status-red", CircleAlert] } as const;
  const [label, tone, Icon] = config[severity];
  return <span className={`status-badge ${tone}`}><Icon size={13} />{t(label)}</span>;
}
