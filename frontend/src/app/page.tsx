import Link from "next/link";
import { Activity, ArrowRight, BarChart3, Bolt, CheckCircle2, CircleDollarSign, Gauge, Radio, ShieldCheck } from "lucide-react";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingPreview } from "@/components/landing/LandingPreview";

const featureCards = [
  { icon: Bolt, tone: "blue", title: "Monitoring enam parameter", copy: "Lihat tegangan, arus, daya, energi, frekuensi, dan faktor daya dari satu sensor di jalur masuk." },
  { icon: BarChart3, tone: "green", title: "Histori dan pola konsumsi", copy: "Tinjau perubahan daya dan energi dari pembacaan meter dari waktu ke waktu." },
  { icon: CircleDollarSign, tone: "amber", title: "Estimasi biaya listrik", copy: "Perkirakan biaya dari energi terukur dan tarif per kWh yang dipilih." },
  { icon: Activity, tone: "blue", title: "Analisis waktu pemakaian", copy: "Kenali jam dengan daya rata-rata tertinggi tanpa mengklaim pemakaian per alat." },
  { icon: Radio, tone: "green", title: "Status perangkat", copy: "Lihat status koneksi ESP32 dan waktu pembacaan terakhir." },
  { icon: ShieldCheck, tone: "amber", title: "Notifikasi ambang", copy: "Pantau peringatan saat daya, energi, atau estimasi biaya melewati batas akun." },
];

const steps = [
  "PZEM-004T membaca parameter listrik pada jalur masuk rumah.",
  "ESP32 mengumpulkan enam nilai dari sensor.",
  "LCD 20x4 menampilkan pembacaan secara lokal.",
  "ESP32 mengirim data lewat Wi-Fi ketika jaringan tersedia.",
  "Backend memvalidasi dan menyimpan pembacaan ke database.",
  "Dashboard menyajikan nilai, histori, analisis, biaya, dan notifikasi.",
];

export default function LandingPage() {
  return <div className="landing-page"><LandingHeader /><main>
    <section className="landing-hero" id="beranda"><div className="hero-copy"><div className="hero-eyebrow"><Bolt size={14} fill="currentColor" />Sistem Manajemen Energi Listrik</div><h1>Pahami Energi,<br /><span>Kelola Biaya</span></h1><p>SMART POWER WEB menghubungkan satu sensor pada jalur masuk rumah dengan dashboard untuk memantau parameter listrik, meninjau histori, dan memperkirakan biaya.</p><div className="hero-actions"><Link href="/login" className="hero-primary">Masuk ke dashboard <ArrowRight size={18} /></Link><Link href="#cara-kerja" className="hero-secondary">Lihat cara kerja</Link></div><div className="hero-benefits"><span><CheckCircle2 size={16} />Satu meter di jalur masuk</span><span><ShieldCheck size={16} />Data dari perangkat</span><span><Gauge size={16} />LCD dan website</span></div></div><LandingPreview /></section>
    <section className="feature-section" id="fitur"><div className="feature-intro"><span className="section-kicker">FITUR UTAMA</span><h2>Informasi energi<br /><span>di satu platform</span></h2><p>Ringkasan dihitung dari sensor di sisi masuk, bukan dari pemantauan per peralatan.</p></div><div className="feature-grid">{featureCards.map((feature) => <FeatureCard key={feature.title} {...feature} />)}</div></section>
    <section className="how-it-works" id="cara-kerja"><span className="section-kicker">CARA KERJA SISTEM</span><h2>Dari sensor ke dashboard</h2><p className="how-intro">LCD tetap menampilkan pembacaan lokal. Koneksi internet diperlukan untuk mengirim dan melihat data melalui web.</p><ol>{steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol></section>
    <section className="project-summary" id="tentang"><div><span className="section-kicker">TENTANG PROYEK</span><h2>Monitoring rumah tangga dari satu titik ukur</h2><p>Proyek ini mengembangkan prototipe ESP32, PZEM-004T, dan LCD menjadi platform website dengan histori, analisis pola konsumsi, estimasi biaya tarif, dan notifikasi.</p><p>Karena sensor berada pada jalur masuk, dashboard menyajikan konsumsi total rumah. Sistem tidak mengidentifikasi pemakaian tiap alat.</p></div><Link href="/tentang" className="inline-link">Tentang tim dan proyek <ArrowRight size={14} /></Link></section>
    <section className="landing-contact" id="kontak"><div><span className="section-kicker">KONTAK</span><h2>Ada pertanyaan tentang sistem?</h2><p>Kirim masukan atau pertanyaan melalui halaman kontak proyek.</p></div><Link href="/kontak" className="hero-primary">Hubungi tim <ArrowRight size={16} /></Link></section>
  </main><LandingFooter /></div>;
}