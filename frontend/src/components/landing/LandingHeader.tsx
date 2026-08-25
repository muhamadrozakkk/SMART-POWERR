import Link from "next/link";
import { Bolt, ShieldCheck } from "lucide-react";
import { PartnerLogos } from "@/components/landing/PartnerLogos";

export function LandingHeader() {
  return <header className="landing-header"><Link href="/" className="landing-brand"><span className="landing-brand-mark"><Bolt size={23} fill="currentColor" /></span><span>SMART <em>POWER</em> WEB</span></Link><PartnerLogos className="landing-header-partners" /><nav className="landing-nav" aria-label="Navigasi utama"><Link href="/">Beranda</Link><Link href="/fitur">Fitur</Link><Link href="/tentang">Tentang</Link><Link href="/kontak">Kontak</Link></nav><Link href="/login" className="landing-login"><ShieldCheck size={16} />Masuk</Link></header>;
}
