import Link from "next/link";
import { Activity, BarChart3, Bolt, CircleDollarSign, Gauge, ShieldCheck, Smartphone } from "lucide-react";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

const features = [
  { icon: Activity, tone: "blue", title: "Monitoring Real-time", copy: "Lihat daya, arus, tegangan, dan energi dalam satu tampilan yang mudah dipahami." },
  { icon: BarChart3, tone: "green", title: "Analisis Konsumsi", copy: "Temukan pola penggunaan melalui grafik historis, distribusi energi, dan prediksi mingguan." },
  { icon: CircleDollarSign, tone: "amber", title: "Kontrol Biaya", copy: "Pantau biaya hari ini, target bulanan, dan estimasi tagihan tanpa perhitungan rumit." },
  { icon: ShieldCheck, tone: "purple", title: "Alarm & Status", copy: "Dapatkan informasi kondisi perangkat dan tanda awal ketika konsumsi perlu diperhatikan." },
  { icon: Smartphone, tone: "blue", title: "Responsif di Semua Layar", copy: "Gunakan dashboard dengan nyaman dari laptop, tablet, maupun smartphone." },
  { icon: Gauge, tone: "green", title: "Siap untuk IoT", copy: "Struktur frontend dipersiapkan untuk menerima data ESP32 dan PZEM-004T di tahap berikutnya." },
];

export default function FeaturesPage() {
  return <div className="landing-page"><LandingHeader /><main className="public-page-main"><section className="public-hero"><span className="section-kicker">FITUR SMART POWER</span><h1>Semua informasi energi,<br /><span>dalam satu kendali.</span></h1><p>Mulai dari pemantauan real-time sampai estimasi biaya, SMART POWER WEB dirancang agar data listrik terasa lebih sederhana.</p></section><section className="public-feature-grid">{features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}</section><section className="public-cta"><div><span className="section-kicker">SIAP MENCOBA?</span><h2>Mulai pahami energi rumah Anda.</h2><p>Masuk ke dashboard demo dan lihat bagaimana data simulasi bekerja.</p></div><Link href="/login" className="hero-primary">Buka Dashboard <Bolt size={17} /></Link></section></main><LandingFooter /></div>;
}
