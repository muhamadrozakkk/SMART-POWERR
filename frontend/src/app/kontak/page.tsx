import { MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/landing/ContactForm";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

export default function ContactPage() {
  return <div className="landing-page"><LandingHeader /><main className="public-page-main"><section className="public-hero"><span className="section-kicker">KONTAK PROYEK</span><h1>Ada masukan<br /><span>tentang sistem?</span></h1><p>Kirim pertanyaan atau masukan melalui form kontak SMART POWER WEB.</p></section><section className="contact-grid"><div className="contact-info"><div className="contact-info-card"><MessageCircle size={20} /><div><strong>Form kontak proyek</strong><span>Pesan dikirim ke backend aplikasi.</span></div></div><div className="contact-note"><MessageCircle size={20} /><p>Form saat ini mencatat penerimaan di backend dan belum mengirim email otomatis kepada tim.</p></div></div><ContactForm /></section></main><LandingFooter /></div>;
}