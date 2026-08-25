import Link from "next/link";

export function LandingFooter() {
  return <footer className="landing-footer"><div><Link href="/" className="footer-brand">SMART POWER WEB</Link><p>Platform manajemen energi rumah tangga berbasis IoT.</p></div><div className="footer-links"><Link href="/fitur">Fitur</Link><Link href="/tentang">Tentang</Link><Link href="/kontak">Kontak</Link><Link href="/login">Masuk</Link></div><span>© 2026 SMART POWER WEB. All rights reserved.</span></footer>;
}
