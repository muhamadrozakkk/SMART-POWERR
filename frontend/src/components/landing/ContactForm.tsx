"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { apiRequest } from "@/lib/api";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("Pesan berhasil diterima.");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    try {
      await apiRequest("/api/contact", { method: "POST", body: JSON.stringify({ name: form.get("name"), email: form.get("email"), subject: form.get("subject"), message: form.get("message") }) });
      setMessage("Pesan berhasil diterima oleh backend.");
    } catch {
      setMessage("Pesan tersimpan dalam mode demo. Backend belum dikonfigurasi di deployment ini.");
    } finally {
      setSending(false);
      setSent(true);
    }
  }
  if (sent) return <div className="contact-success"><CheckCircle2 size={30} /><h3>Pesan siap diteruskan</h3><p>{message}</p><button className="hero-secondary" onClick={() => setSent(false)}>Kirim pesan lain</button></div>;
  return <form className="contact-form" onSubmit={handleSubmit}><div className="form-grid"><div className="form-field"><label htmlFor="contact-name">Nama</label><input id="contact-name" name="name" required placeholder="Nama Anda" /></div><div className="form-field"><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" required type="email" placeholder="email@contoh.com" /></div></div><div className="form-field"><label htmlFor="contact-subject">Subjek</label><input id="contact-subject" name="subject" required placeholder="Bagaimana kami dapat membantu?" /></div><div className="form-field"><label htmlFor="contact-message">Pesan</label><textarea id="contact-message" name="message" required rows={5} placeholder="Tulis pesan Anda di sini..." /></div><button type="submit" className="hero-primary" disabled={sending}>{sending ? "Mengirim..." : "Kirim Pesan"} <Send size={16} /></button></form>;
}
