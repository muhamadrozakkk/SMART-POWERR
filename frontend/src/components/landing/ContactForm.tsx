"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }
  if (sent) return <div className="contact-success"><CheckCircle2 size={30} /><h3>Pesan siap diteruskan</h3><p>Terima kasih. Form kontak ini masih dalam mode demo frontend.</p><button className="hero-secondary" onClick={() => setSent(false)}>Kirim pesan lain</button></div>;
  return <form className="contact-form" onSubmit={handleSubmit}><div className="form-grid"><div className="form-field"><label htmlFor="contact-name">Nama</label><input id="contact-name" required placeholder="Nama Anda" /></div><div className="form-field"><label htmlFor="contact-email">Email</label><input id="contact-email" required type="email" placeholder="email@contoh.com" /></div></div><div className="form-field"><label htmlFor="contact-subject">Subjek</label><input id="contact-subject" required placeholder="Bagaimana kami dapat membantu?" /></div><div className="form-field"><label htmlFor="contact-message">Pesan</label><textarea id="contact-message" required rows={5} placeholder="Tulis pesan Anda di sini..." /></div><button type="submit" className="hero-primary">Kirim Pesan <Send size={16} /></button></form>;
}
