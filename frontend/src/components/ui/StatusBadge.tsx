import { CheckCircle2, CircleAlert, Wifi } from "lucide-react";
import type { MetricStatus } from "@/types/energy";

const toneMap: Record<MetricStatus, string> = {
  normal: "status-green",
  stable: "status-green",
  good: "status-green",
  warning: "status-amber",
  danger: "status-red",
};

export function StatusBadge({ children, tone = "normal", dot = true }: { children: React.ReactNode; tone?: MetricStatus; dot?: boolean }) {
  return <span className={`status-badge ${toneMap[tone]}`}>{dot ? <span className="status-dot" /> : null}{children}</span>;
}

export function OnlineBadge({ children = "Online" }: { children?: React.ReactNode }) {
  return <span className="online-badge"><Wifi size={13} />{children}</span>;
}

export function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const config = { low: ["Rendah", "status-green", CheckCircle2], medium: ["Sedang", "status-amber", CircleAlert], high: ["Tinggi", "status-red", CircleAlert] } as const;
  const [label, tone, Icon] = config[severity];
  return <span className={`status-badge ${tone}`}><Icon size={13} />{label}</span>;
}
