"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { energyMetrics, energyDistribution, deviceStatus, predictionData, costSummaries } from "@/data/dummyData";
import type { DeviceStatus as DeviceStatusData, EnergyDistribution as EnergyDistributionData, Prediction, PowerReading } from "@/types/energy";
import { AlarmStatus } from "@/components/dashboard/AlarmStatus";
import { CostSummary } from "@/components/dashboard/CostSummary";
import { DataHistory } from "@/components/dashboard/DataHistory";
import { DeviceStatus } from "@/components/dashboard/DeviceStatus";
import { EnergyDistribution } from "@/components/dashboard/EnergyDistribution";
import { EnergyPrediction } from "@/components/dashboard/EnergyPrediction";
import { EnergySummary } from "@/components/dashboard/EnergySummary";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PowerChart } from "@/components/dashboard/PowerChart";

type ApiMetric = { value: number; unit: string; status: string };
type DashboardPayload = {
  metrics: { activePower: ApiMetric; current: ApiMetric; voltage: ApiMetric; powerFactor: ApiMetric; todayEnergy: ApiMetric & { cost: number } };
  powerHistory: PowerReading[];
  distribution: EnergyDistributionData[];
  device: DeviceStatusData;
  prediction: Prediction[];
};

export function DashboardView() {
  const [apiData, setApiData] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    apiRequest<DashboardPayload>("/api/dashboard").then(setApiData).catch(() => setApiData(null));
  }, []);

  const metrics = apiData ? [
    { ...energyMetrics[0], value: String(apiData.metrics.activePower.value), unit: apiData.metrics.activePower.unit, status: apiData.metrics.activePower.status },
    { ...energyMetrics[1], value: String(apiData.metrics.current.value), unit: apiData.metrics.current.unit, status: apiData.metrics.current.status },
    { ...energyMetrics[2], value: String(apiData.metrics.voltage.value), unit: apiData.metrics.voltage.unit, status: apiData.metrics.voltage.status },
    { ...energyMetrics[3], value: String(apiData.metrics.powerFactor.value), unit: apiData.metrics.powerFactor.unit, status: apiData.metrics.powerFactor.status },
    { ...energyMetrics[4], value: String(apiData.metrics.todayEnergy.value), unit: apiData.metrics.todayEnergy.unit, status: `Rp ${apiData.metrics.todayEnergy.cost.toLocaleString("id-ID")}` },
  ] : energyMetrics;

  return <div className="dashboard-grid"><div className="metrics-row">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div><PowerChart data={apiData?.powerHistory} /><EnergyDistribution data={apiData?.distribution ?? energyDistribution} /><div className="summary-row"><EnergySummary /><CostSummary summary={costSummaries[0]} /><CostSummary summary={costSummaries[1]} /><DeviceStatus deviceStatus={apiData?.device ?? deviceStatus} /><AlarmStatus /></div><DataHistory /><EnergyPrediction data={apiData?.prediction ?? predictionData} /></div>;
}
