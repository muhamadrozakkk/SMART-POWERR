"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bolt, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("rozak@example.com");
  const [password, setPassword] = useState("smartpower");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.cookie = "spw_demo_auth=1; path=/; max-age=86400";
    router.push("/dashboard");
  }

  return <main className="login-page"><div className="login-glow login-glow-left" /><div className="login-glow login-glow-right" /><Link href="/" className="login-back"><ArrowLeft size={16} />Kembali ke beranda</Link><section className="login-card"><div className="login-logo"><span><Bolt size={25} fill="currentColor" /></span><strong>SMART <em>POWER</em> WEB</strong></div><div className="login-heading"><h1>Selamat datang kembali</h1><p>Masuk untuk melihat penggunaan energi rumah Anda.</p></div><form onSubmit={handleSubmit}><label htmlFor="email">Email</label><div className="login-input"><Mail size={17} /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><label htmlFor="password">Password</label><div className="login-input"><LockKeyhole size={17} /><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><div className="login-options"><label><input type="checkbox" defaultChecked /> Ingat saya</label><a href="#bantuan">Lupa password?</a></div><button type="submit" className="login-submit">Masuk ke Dashboard</button></form><div className="login-demo-note"><ShieldCheck size={16} /><span>Mode demo frontend — gunakan data simulasi untuk mencoba dashboard.</span></div></section><p className="login-footer">© 2026 SMART POWER WEB</p></main>;
}
