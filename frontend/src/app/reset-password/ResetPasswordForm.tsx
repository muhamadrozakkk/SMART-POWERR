"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(""); setError(""); if (password !== confirm) { setError("Konfirmasi password tidak sama."); return; } setLoading(true); try { const result = await apiRequest<{ message: string }>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword: password }) }); setMessage(result.message); } catch (reason) { setError(reason instanceof Error ? reason.message : "Password gagal diperbarui"); } finally { setLoading(false); } }
  if (!token) return <section className="login-card"><div className="login-heading"><h1>Tautan tidak valid</h1><p>Token reset tidak ditemukan pada tautan ini.</p></div><Link href="/forgot-password">Minta tautan baru</Link></section>;
  return <section className="login-card"><div className="login-heading"><h1>Buat password baru</h1><p>Gunakan password minimal 8 karakter.</p></div><form onSubmit={submit}><label htmlFor="password">Password baru</label><div className="login-input"><input id="password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></div><label htmlFor="confirm">Ulangi password</label><div className="login-input"><input id="confirm" type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></div>{message && <p className="settings-status" role="status">{message} <Link href="/login">Masuk ke akun</Link></p>}{error && <p className="login-error" role="alert">{error}</p>}<button className="login-submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan password baru"}</button></form></section>;
}
