import { costSummaries, energyMetrics } from "@/data/dummyData";
import { AlarmStatus } from "@/components/dashboard/AlarmStatus";
import { CostSummary } from "@/components/dashboard/CostSummary";
import { DataHistory } from "@/components/dashboard/DataHistory";
import { DeviceStatus } from "@/components/dashboard/DeviceStatus";
import { EnergyDistribution } from "@/components/dashboard/EnergyDistribution";
import { EnergyPrediction } from "@/components/dashboard/EnergyPrediction";
import { EnergySummary } from "@/components/dashboard/EnergySummary";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PowerChart } from "@/components/dashboard/PowerChart";

export function DashboardView() {
  return <div className="dashboard-grid"><div className="metrics-row">{energyMetrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><PowerChart /><EnergyDistribution /><div className="summary-row"><EnergySummary /><CostSummary summary={costSummaries[0]} /><CostSummary summary={costSummaries[1]} /><DeviceStatus /><AlarmStatus /></div><DataHistory /><EnergyPrediction /></div>;
}
