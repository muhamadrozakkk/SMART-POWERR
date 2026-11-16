"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bolt, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useI18n } from "@/lib/i18n";

type AuthResult = { token?: string; user?: { role?: "DEVELOPER" | "USER" } };

export default function LoginPage() {
  const { t } = useI18n();
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
      window.localStorage.setItem("spw_ambient_start_on_login", "1");
      window.dispatchEvent(new Event("spw:login-success"));
      const role = result.user?.role ?? "USER";
      document.cookie = "spw_auth=1; path=/; max-age=28800; samesite=lax";
      document.cookie = `spw_role=${role}; path=/; max-age=28800; samesite=lax`;
      router.push(role === "DEVELOPER" ? "/dashboard/developer" : "/dashboard/user");
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
      <div className="login-top-actions"><Link href="/" className="login-back"><ArrowLeft size={16} />{t("Kembali ke beranda")}</Link><LanguageToggle /></div>
      <section className="login-card">
        <div className="login-logo"><span><Bolt size={25} fill="currentColor" /></span><strong>SMART <em>POWER</em> WEB</strong></div>
        <div className="login-heading">
          <h1>{t(isRegister ? "Buat akun baru" : "Selamat datang kembali")}</h1>
          <p>{t(isRegister ? "Daftar untuk mulai memantau penggunaan energi rumah Anda." : "Masuk untuk melihat penggunaan energi rumah Anda.")}</p>
        </div>
        <form onSubmit={handleSubmit}>
          {isRegister && <><label htmlFor="name">{t("Nama")}</label><div className="login-input"><UserRound size={17} /><input id="name" type="text" autoComplete="name" placeholder={t("Nama Anda")} value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} /></div></>}
          <label htmlFor="email">{t("Email")}</label>
          <div className="login-input"><Mail size={17} /><input id="email" type="email" autoComplete="email" placeholder={t("nama@email.com")} value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <label htmlFor="password">{t("Password")}</label>
          <div className="login-input"><LockKeyhole size={17} /><input id="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} placeholder={t(isRegister ? "Minimal 8 karakter" : "Masukkan password")} minLength={isRegister ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={t(showPassword ? "Sembunyikan password" : "Tampilkan password")}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          {!isRegister && <div className="login-options"><Link href="/forgot-password">{t("Lupa password?")}</Link></div>}
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          <button type="submit" className="login-submit" disabled={loading}>{t(loading ? "Memproses..." : isRegister ? "Buat Akun" : "Masuk ke Dashboard")}</button>
        </form>
        <p className="login-switch">{t(isRegister ? "Sudah punya akun?" : "Belum punya akun?")} <button type="button" onClick={switchMode}>{t(isRegister ? "Masuk" : "Daftar sekarang")}</button></p>
        {!isRegister && <p className="login-info">{t("SMART POWER siap digunakan. Masuk untuk melihat data perangkat dan riwayat pemakaian yang terhubung ke akun Anda.")}</p>}
      </section>
      <p className="login-footer">© 2026 SMART POWER WEB</p>
    </main>
  );
}
