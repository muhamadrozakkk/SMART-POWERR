import Link from "next/link";
import { Activity, BarChart3, Bolt, CircleDollarSign, Gauge, ShieldCheck, Smartphone } from "lucide-react";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

const features = [
  { icon: Activity, tone: "blue", title: "Enam parameter listrik", copy: "Tegangan, arus, daya aktif, energi, frekuensi, dan faktor daya dari satu PZEM-004T." },
  { icon: BarChart3, tone: "green", title: "Histori dan analisis", copy: "Lihat tren per jam, hari, minggu, dan bulan serta waktu daya rata-rata tertinggi." },
  { icon: CircleDollarSign, tone: "amber", title: "Estimasi biaya", copy: "Kalikan energi terukur dengan tarif per kWh dari golongan yang dipilih." },
  { icon: ShieldCheck, tone: "purple", title: "Notifikasi ambang", copy: "Catat peringatan ketika daya, energi harian, atau estimasi biaya harian melewati batas." },
  { icon: Smartphone, tone: "blue", title: "LCD dan dashboard", copy: "Pantau dari LCD 20x4 secara lokal atau website ketika koneksi internet tersedia." },
  { icon: Gauge, tone: "green", title: "Satu meter untuk rumah", copy: "Tampilkan konsumsi total pada jalur masuk; sistem tidak membagi hasil per alat." },
];

export default function FeaturesPage() {
  return <div className="landing-page"><LandingHeader /><main className="public-page-main"><section className="public-hero"><span className="section-kicker">FITUR SMART POWER</span><h1>Informasi energi rumah,<br /><span>dalam satu dashboard.</span></h1><p>Fitur bekerja dari satu sensor yang dipasang pada sisi masuk instalasi listrik.</p></section><section className="public-feature-grid">{features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}</section><section className="public-cta"><div><span className="section-kicker">MULAI MENGGUNAKAN</span><h2>Tinjau data dari perangkat Anda.</h2><p>Masuk untuk melihat pembacaan yang diterima sistem.</p></div><Link href="/login" className="hero-primary">Masuk <Bolt size={17} /></Link></section></main><LandingFooter /></div>;
}