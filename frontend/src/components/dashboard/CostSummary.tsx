import { ReceiptText } from "lucide-react";
import type { CostSummary as CostSummaryType } from "@/types/energy";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionCard } from "@/components/ui/SectionCard";

export function CostSummary({ summary }: { summary: CostSummaryType }) {
  return <SectionCard className="summary-card cost-summary"><div className={`summary-icon ${summary.tone === "amber" ? "icon-amber" : "icon-green"}`}><ReceiptText size={18} /></div><h3>{summary.title}</h3><div className="summary-value">{summary.value}</div><p>{summary.detail}</p><div className="progress-row"><ProgressBar value={summary.progress} tone={summary.tone === "amber" ? "amber" : "green"} /><strong>{summary.progress}%</strong></div></SectionCard>;
}
