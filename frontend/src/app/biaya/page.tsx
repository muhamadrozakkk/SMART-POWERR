"use client";

import { useState } from "react";
import { ReceiptText, Target } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SimpleBarChart } from "@/components/common/SimpleBarChart";
import { StatGrid } from "@/components/common/StatGrid";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionCard } from "@/components/ui/SectionCard";

const costData = [{ day: "18/05", value: 22 }, { day: "19/05", value: 25 }, { day: "20/05", value: 19 }, { day: "21/05", value: 27 }, { day: "22/05", value: 23 }, { day: "23/05", value: 21 }, { day: "24/05", value: 28 }];
const ranges = ["Hari ini", "7 Hari", "Bulan ini"] as const;

export default function CostPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("Bulan ini");
  const stats = [{ label: "Biaya hari ini", value: "Rp 5.640", detail: "8.42 kWh digunakan", icon: "receipt" as const, tone: "blue" }, { label: "Biaya 7 hari", value: "Rp 38.920", detail: "Rata-rata Rp 5.560/hari", icon: "calendar" as const, tone: "green" }, { label: "Biaya bulan ini", value: "Rp 168.675", detail: "67% dari target", icon: "money" as const, tone: "amber" }, { label: "Estimasi tagihan", value: "Rp 183.500", detail: "Sisa Rp 66.500", icon: "target" as const, tone: "purple" }];
  return <><PageHeader title="Biaya" description="Pantau biaya listrik dan kendalikan penggunaan sesuai target." action={<div className="filters">{ranges.map((item) => <button key={item} className={range === item ? "primary-button" : "secondary-button"} onClick={() => setRange(item)} aria-pressed={range === item}>{item}</button>)}</div>} /><p className="settings-status">Periode aktif: {range}</p><StatGrid stats={stats} /><div className="two-column"><SectionCard title="Grafik biaya harian"><SimpleBarChart data={costData} unit="ribu" color="#ffb519" /></SectionCard><SectionCard title="Target biaya bulanan"><div className="data-highlight"><div><span>Penggunaan saat ini</span><strong>Rp 168.675</strong><span>Target Rp 250.000</span></div><Target color="#ffbf2d" size={32} /></div><div className="progress-row" style={{ marginTop: 22 }}><ProgressBar value={67} tone="amber" /><strong>67%</strong></div><div className="info-list"><div className="info-row"><span>Tarif listrik simulasi</span><strong>Rp 1.350 / kWh</strong></div><div className="info-row"><span>Sisa anggaran</span><strong style={{ color: "#34dc6c" }}>Rp 81.325</strong></div></div></SectionCard></div><SectionCard title="Catatan"><div className="empty-state" style={{ minHeight: 110 }}><ReceiptText size={24} /><span>Perhitungan biaya saat ini menggunakan tarif simulasi dan dapat diganti saat API tarif tersedia.</span></div></SectionCard></>;
}
