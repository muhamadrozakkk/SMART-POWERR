"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bolt, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

type AuthResult = { token?: string };

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest<AuthResult>(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      if (result.token) window.localStorage.setItem("spw_access_token", result.token);
      document.cookie = "spw_demo_auth=1; path=/; max-age=28800; samesite=lax";
      router.push("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsRegister((current) => !current);
    setError("");
    setPassword("");
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-left" />
      <div className="login-glow login-glow-right" />
      <Link href="/" className="login-back"><ArrowLeft size={16} />Kembali ke beranda</Link>
      <section className="login-card">
        <div className="login-logo"><span><Bolt size={25} fill="currentColor" /></span><strong>SMART <em>POWER</em> WEB</strong></div>
        <div className="login-heading">
          <h1>{isRegister ? "Buat akun baru" : "Selamat datang kembali"}</h1>
          <p>{isRegister ? "Daftar untuk mulai memantau penggunaan energi rumah Anda." : "Masuk untuk melihat penggunaan energi rumah Anda."}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {isRegister && <><label htmlFor="name">Nama</label><div className="login-input"><UserRound size={17} /><input id="name" type="text" autoComplete="name" placeholder="Nama Anda" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></div></>}
          <label htmlFor="email">Email</label>
          <div className="login-input"><Mail size={17} /><input id="email" type="email" autoComplete="email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <label htmlFor="password">Password</label>
          <div className="login-input"><LockKeyhole size={17} /><input id="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "Minimal 8 karakter" : "Masukkan password"} minLength={isRegister ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          {!isRegister && <div className="login-options"><label><input type="checkbox" /> Ingat saya</label><a href="mailto:hello@smartpower.web?subject=Bantuan%20akses%20SMART%20POWER%20WEB">Lupa password?</a></div>}
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          <button type="submit" className="login-submit" disabled={loading}>{loading ? "Memproses..." : isRegister ? "Buat Akun" : "Masuk ke Dashboard"}</button>
        </form>
        <p className="login-switch">{isRegister ? "Sudah punya akun?" : "Belum punya akun?"} <button type="button" onClick={switchMode}>{isRegister ? "Masuk" : "Daftar sekarang"}</button></p>
        {!isRegister && <div className="login-demo-note"><ShieldCheck size={16} /><span>Mode demo menggunakan data simulasi untuk mencoba dashboard.</span></div>}
      </section>
      <p className="login-footer">© 2026 SMART POWER WEB</p>
    </main>
  );
}
