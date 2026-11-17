"use client";

import { Activity, BatteryCharging, Bolt, Gauge, Receipt, Waves } from "lucide-react";
import type { EnergyReading } from "@/types/energy";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

const iconMap = { bolt: Bolt, current: Activity, voltage: Gauge, wave: Waves, energy: BatteryCharging, cost: Receipt };
const accentMap: Record<string, { icon: string; line: string }> = {
  blue: { icon: "icon-blue", line: "#3eaaf7" }, sky: { icon: "icon-sky", line: "#249cf2" }, purple: { icon: "icon-purple", line: "#9951ed" }, amber: { icon: "icon-amber", line: "#ffb414" }, green: { icon: "icon-green", line: "#2ccf61" },
};

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${29 - ((value - min) / range) * 23}`).join(" ");
  return <svg className="sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />{values.map((value, index) => <circle key={`${value}-${index}`} cx={(index / (values.length - 1)) * 100} cy={29 - ((value - min) / range) * 23} r="1.3" fill={color} />)}</svg>;
}

export function MetricCard({ metric }: { metric: EnergyReading }) {
  const { t, locale } = useI18n();
  const numberLocale = locale === "EN" ? "en-US" : "id-ID";
  const parseValue = (value: string) => Number(locale === "ID" ? value.replace(/\./g, "").replace(",", ".") : value.replace(/,/g, "")) || 0;
  const targetValue = parseValue(metric.value);
  const animated = useRef(targetValue);
  const [displayValue, setDisplayValue] = useState(metric.value);
  useEffect(() => {
    const from = animated.current;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 520);
      const eased = 1 - (1 - progress) ** 3;
      const value = from + (targetValue - from) * eased;
      setDisplayValue(value.toLocaleString(numberLocale, { maximumFractionDigits: 3 }));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else animated.current = targetValue;
    };
    if (from !== targetValue) frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numberLocale, targetValue]);
  const Icon = iconMap[metric.icon as keyof typeof iconMap] ?? Bolt;
  const accent = accentMap[metric.accent];
  return <article className="metric-card"><div className={`metric-icon ${accent.icon}`}><Icon size={25} /></div><div className="metric-content"><span className="metric-label">{t(metric.label)}</span><div className="metric-value">{displayValue} <small>{metric.unit}</small></div><StatusBadge tone={metric.statusTone}>{t(metric.status)}</StatusBadge></div><Sparkline values={metric.trend} color={accent.line} /></article>;
}
