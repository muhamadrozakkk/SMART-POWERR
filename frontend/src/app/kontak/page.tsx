import { Clock3, Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/landing/ContactForm";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

export default function ContactPage() {
  return <div className="landing-page"><LandingHeader /><main className="public-page-main"><section className="public-hero"><span className="section-kicker">KONTAK</span><h1>Punya pertanyaan<br /><span>tentang energi?</span></h1><p>Hubungi tim SMART POWER WEB untuk berbagi masukan, kebutuhan, atau rencana integrasi perangkat Anda.</p></section><section className="contact-grid"><div className="contact-info"><div className="contact-info-card"><Mail size={20} /><div><strong>Email</strong><a href="mailto:hello@smartpower.web">hello@smartpower.web</a></div></div><div className="contact-info-card"><MapPin size={20} /><div><strong>Lokasi pengembangan</strong><span>Indonesia</span></div></div><div className="contact-info-card"><Clock3 size={20} /><div><strong>Waktu respons</strong><span>Senin–Jumat, 09.00–17.00 WIB</span></div></div><div className="contact-note"><MessageCircle size={20} /><p>Semua fitur kontak masih berjalan sebagai simulasi frontend dan belum mengirim data ke backend.</p></div></div><ContactForm /></section></main><LandingFooter /></div>;
}
