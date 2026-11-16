"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useI18n } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setMessage(""); setError(""); try { const result = await apiRequest<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }); setMessage(result.message); } catch (reason) { setError(reason instanceof Error ? reason.message : t("Permintaan gagal dikirim")); } finally { setLoading(false); } }
  return <main className="login-page"><div className="login-top-actions"><Link href="/login" className="login-back">← {t("Kembali ke login")}</Link><LanguageToggle /></div><section className="login-card"><div className="login-heading"><h1>{t("Lupa password?")}</h1><p>{t("Masukkan email akunmu. Jika terdaftar, kami kirim tautan reset yang berlaku 20 menit.")}</p></div><form onSubmit={submit}><label htmlFor="email">Email</label><div className="login-input"><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder={t("nama@email.com")} /></div>{message && <p className="settings-status" role="status">{message}</p>}{error && <p className="login-error" role="alert">{error}</p>}<button className="login-submit" disabled={loading}>{t(loading ? "Mengirim..." : "Kirim tautan reset")}</button></form></section></main>;
}
