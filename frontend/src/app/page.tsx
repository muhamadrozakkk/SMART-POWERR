import Link from "next/link";
import { ArrowRight, BarChart3, Bolt, CheckCircle2, CircleDollarSign, Gauge, ShieldCheck } from "lucide-react";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingPreview } from "@/components/landing/LandingPreview";

const featureCards = [
  { icon: Bolt, tone: "blue", title: "Monitoring Real-time", copy: "Pantau penggunaan listrik secara langsung dengan data akurat dan update berkala." },
  { icon: BarChart3, tone: "green", title: "Analisis Mendalam", copy: "Lihat pola konsumsi energi melalui grafik yang mudah dipahami." },
  { icon: CircleDollarSign, tone: "amber", title: "Estimasi Biaya", copy: "Dapatkan estimasi biaya listrik dan kelola anggaran energi dengan lebih baik." },
];

export default function LandingPage() {
  return <div className="landing-page"><LandingHeader /><main><section className="landing-hero" id="beranda"><div className="hero-copy"><div className="hero-eyebrow"><Bolt size={14} fill="currentColor" />Sistem Manajemen Energi Listrik</div><h1>Kelola Energi,<br /><span>Kendalikan Biaya</span></h1><p>Pantau penggunaan listrik rumah Anda secara real-time, pahami pola konsumsi, dan hemat biaya dengan <strong>SMART POWER WEB.</strong></p><div className="hero-actions"><Link href="/login" className="hero-primary">Mulai Sekarang <ArrowRight size={18} /></Link><Link href="/fitur" className="hero-secondary">Pelajari Lebih Lanjut <span>⌄</span></Link></div><div className="hero-benefits"><span><CheckCircle2 size={16} />Real-time Monitoring</span><span><ShieldCheck size={16} />Data Akurat</span><span><Gauge size={16} />Mudah Digunakan</span></div></div><LandingPreview /></section><section className="feature-section" id="fitur"><div className="feature-intro"><span className="section-kicker">FITUR UTAMA</span><h2>Semua yang Anda <span>Butuhkan</span></h2><p>Fitur lengkap untuk membantu Anda mengelola penggunaan energi listrik dengan lebih efektif.</p><Link href="/fitur" className="inline-link">Lihat semua fitur <ArrowRight size={14} /></Link></div><div className="feature-grid">{featureCards.map((feature) => <FeatureCard key={feature.title} {...feature} />)}</div></section><section className="landing-stats" id="tentang"><div><BarChart3 size={22} /><strong>500+</strong><span>Pengguna Aktif</span></div><div><Bolt size={22} /><strong>1.2M+</strong><span>Data Terkumpul</span></div><div><Gauge size={22} /><strong>98.5%</strong><span>Akurasi Data</span></div><div><ShieldCheck size={22} /><strong>24/7</strong><span>Monitoring</span></div></section></main><LandingFooter /></div>;
}
