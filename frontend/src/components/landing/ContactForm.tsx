"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { apiRequest } from "@/lib/api";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("Pesan diterima oleh backend aplikasi.");
  const [error, setError] = useState("");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    try {
      await apiRequest("/api/contact", { method: "POST", body: JSON.stringify({ name: form.get("name"), email: form.get("email"), subject: form.get("subject"), message: form.get("message") }) });
      setMessage("Pesan diterima oleh backend aplikasi. Pengiriman email otomatis belum tersedia.");
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Pesan belum terkirim. Periksa koneksi lalu coba lagi.");
    } finally {
      setSending(false);
    }
  }
  if (sent) return <div className="contact-success"><CheckCircle2 size={30} /><h3>Pesan diterima</h3><p>{message}</p><button className="hero-secondary" onClick={() => setSent(false)}>Kirim pesan lain</button></div>;
  return <form className="contact-form" onSubmit={handleSubmit}><div className="form-grid"><div className="form-field"><label htmlFor="contact-name">Nama</label><input id="contact-name" name="name" required placeholder="Nama Anda" /></div><div className="form-field"><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" required type="email" placeholder="email@contoh.com" /></div></div><div className="form-field"><label htmlFor="contact-subject">Subjek</label><input id="contact-subject" name="subject" required placeholder="Bagaimana kami dapat membantu?" /></div><div className="form-field"><label htmlFor="contact-message">Pesan</label><textarea id="contact-message" name="message" required rows={5} placeholder="Tulis pesan Anda di sini..." /></div>{error && <p className="login-error" role="alert">{error}</p>}<button type="submit" className="hero-primary" disabled={sending}>{sending ? "Mengirim..." : "Kirim Pesan"} <Send size={16} /></button></form>;
}
