"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Bolt, Send, Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Message = { role: "assistant" | "user"; text: string };
const suggestions = ["Apa arti daya aktif?", "Bagaimana biaya dihitung?", "Bagaimana data ESP32 masuk?"];

function getAnswer(question: string, locale: "ID" | "EN") {
  const text = question.toLowerCase();
  if (locale === "EN") {
    if (text.includes("cost") || text.includes("tariff")) return "Estimated cost is calculated by multiplying recorded energy (kWh) by your selected tariff per kWh. It is an estimate, not an official PLN bill.";
    if (text.includes("esp") || text.includes("data") || text.includes("pzem") || text.includes("send")) return "The PZEM-004T measures six parameters on the incoming line. The ESP32 sends readings over Wi-Fi to the backend, which stores them for the dashboard.";
    if (text.includes("power") || text.includes("watt") || text.includes("reading")) return "Active power (W) shows the electrical load at the time of a reading. Since the sensor is on the incoming line, it measures the total load, not each appliance.";
    if (text.includes("history") || text.includes("chart")) return "The History page shows readings saved by the backend. Its chart fills after the device sends data and the backend stores it.";
    return "I can explain the six readings, usage history, cost estimates, and the ESP32-to-dashboard flow. Try asking about one of these topics.";
  }
  if (text.includes("biaya") || text.includes("tarif")) return "Estimasi biaya dihitung dari energi (kWh) yang tercatat dikalikan tarif per kWh pilihanmu. Hasilnya merupakan perkiraan pemakaian, bukan tagihan resmi PLN.";
  if (text.includes("esp") || text.includes("data") || text.includes("pzem") || text.includes("kirim")) return "PZEM-004T mengukur enam parameter di jalur masuk. ESP32 membaca sensor lalu mengirim pembacaan melalui Wi-Fi ke backend, yang menyimpannya agar bisa ditampilkan di dashboard.";
  if (text.includes("daya") || text.includes("watt") || text.includes("parameter")) return "Daya aktif (W) menunjukkan laju pemakaian listrik pada saat pembacaan. Karena sensor dipasang di jalur masuk, nilainya mewakili total beban yang terukur, bukan konsumsi tiap alat.";
  if (text.includes("histori") || text.includes("riwayat") || text.includes("grafik")) return "Menu Riwayat menampilkan pembacaan yang sudah tersimpan. Grafik akan terisi setelah perangkat mengirim data dan backend menerima pembacaan tersebut.";
  return "Aku bisa membantu menjelaskan pemantauan enam parameter, histori, estimasi biaya, dan alur ESP32 ke dashboard. Coba pilih salah satu topik di atas.";
}

export function LandingAssistant() {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (!window.localStorage.getItem("spw_landing_assistant_seen")) {
          setOpen(true);
          window.localStorage.setItem("spw_landing_assistant_seen", "1");
        }
      } catch { /* Widget tetap bisa dibuka manual jika penyimpanan browser tidak tersedia. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function sendMessage(value: string) {
    const question = value.trim();
    if (!question) return;
    setMessages((current) => [...current, { role: "user", text: question }, { role: "assistant", text: getAnswer(question, locale) }]);
    setDraft("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(draft);
  }

  return <aside className="landing-assistant" aria-label="Asisten SMART POWER WEB">
    {open && <section className="assistant-panel" role="dialog" aria-modal="false" aria-labelledby="assistant-title">
      <header className="assistant-header"><span className="assistant-avatar"><Image src="/images/logo-smartpower.png" alt="Logo SMART POWER WEB" width={43} height={43} priority /></span><div><strong id="assistant-title">PowerMate</strong><span><Sparkles size={12} /> {t("Panduan energi rumah")}</span></div><button type="button" onClick={() => setOpen(false)} aria-label={t("Tutup asisten")}><X size={19} /></button></header>
      <div className="assistant-messages" aria-live="polite">{!messages.length && <div className="assistant-message assistant"><span>{t("Halo! Aku PowerMate, asisten SMART POWER WEB. Aku bisa bantu memahami pemakaian energi, estimasi biaya listrik, dan cara kerja ESP32 + PZEM-004T.")}</span></div>}{messages.map((message, index) => <div className={`assistant-message ${message.role}`} key={`${index}-${message.role}`}><span>{message.text}</span></div>)}
        {!messages.length && <div className="assistant-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => sendMessage(t(suggestion))}>{t(suggestion)}</button>)}</div>}
      </div>
      <form className="assistant-composer" onSubmit={handleSubmit}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={locale === "EN" ? "Ask about energy…" : "Tanyakan tentang energi..."} aria-label={t("Tulis pertanyaan untuk PowerMate")} /><button type="submit" aria-label={t("Kirim pertanyaan")} disabled={!draft.trim()}><Send size={18} /></button></form>
    </section>}
    <button className="assistant-launcher" type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? "Tutup PowerMate" : "Buka PowerMate"}><Bolt size={25} fill="currentColor" /></button>
  </aside>;
}
