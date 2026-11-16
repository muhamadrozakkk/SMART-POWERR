"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Mic, MicOff, Send, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAmbientAudio } from "@/components/audio/AmbientAudioProvider";

type Message = { id: number; role: "assistant" | "user"; text: string };
type SpeechResult = { transcript: string };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<{ 0: SpeechResult; isFinal: boolean }> };
type RecognitionInstance = { lang: string; interimResults: boolean; continuous: boolean; onresult: ((event: RecognitionEvent) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort: () => void };
type RecognitionConstructor = new () => RecognitionInstance;
type DashboardContext = { latest?: { voltage: number; current: number; power: number; energy: number; frequency: number; power_factor: number; timestamp: string }; tariff?: { class: string; perKwh: number }; history24h?: Array<{ timestamp: string; power: number; energy: number }>; device?: { id: string; online: boolean; lastSeen: string | null }; unreadNotifications?: number };

export function SmartPowerAssistant() {
  const { locale, t } = useI18n();
  const { setDucked } = useAmbientAudio();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [error, setError] = useState("");
  const [context, setContext] = useState<DashboardContext>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const nextId = useRef(0);
  const assistantGreeting = locale === "EN" ? "Hello! I am PowerMate, your SMART POWER WEB energy assistant. Ask me about your latest readings, device status, usage history, or estimated electricity cost." : "Halo! Aku PowerMate, asisten energi SMART POWER WEB. Tanyakan pembacaan terbaru, status perangkat, riwayat pemakaian, atau estimasi biaya listrik.";

  useEffect(() => {
    const voiceTimer = window.setTimeout(() => setVoiceEnabled(window.localStorage.getItem("spw_ai_voice_enabled") === "1"), 0);
    const updateContext = (event: Event) => setContext((event as CustomEvent<DashboardContext>).detail ?? {});
    window.addEventListener("spw:dashboard-context", updateContext);
    return () => { window.clearTimeout(voiceTimer); window.removeEventListener("spw:dashboard-context", updateContext); window.speechSynthesis?.cancel(); recognitionRef.current?.abort(); };
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === "EN" ? "en-US" : "id-ID";
    utterance.pitch = 1.25;
    utterance.rate = 0.96;
    utterance.volume = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const languageVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(locale === "EN" ? "en" : "id"));
    utterance.voice = languageVoices.find((voice) => /female|woman|gadis|google.*bahasa|indonesia.*female/i.test(voice.name)) ?? languageVoices[0] ?? null;
    utterance.onstart = () => setDucked(true);
    utterance.onend = () => setDucked(false);
    utterance.onerror = () => setDucked(false);
    window.speechSynthesis.speak(utterance);
  }, [locale, setDucked, voiceEnabled]);

  function stopVoice() {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
    setDucked(false);
  }

  function toggleVoice() {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    window.localStorage.setItem("spw_ai_voice_enabled", next ? "1" : "0");
    if (!next) stopVoice();
  }

  function toggleMic() {
    if (listening) { recognitionRef.current?.stop(); setListening(false); setDucked(false); return; }
    const speechWindow = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setError(locale === "EN" ? "Voice input is not supported by this browser." : "Input suara belum didukung browser ini."); return; }
    const recognition = new Recognition();
    recognition.lang = locale === "EN" ? "en-US" : "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => { const result = event.results[event.resultIndex]?.[0]?.transcript; if (result) { setDraft(result); void sendMessage(result); } };
    recognition.onerror = (event) => setError(locale === "EN" ? `Microphone error: ${event.error}` : `Mikrofon bermasalah: ${event.error}`);
    recognition.onend = () => { setListening(false); setDucked(false); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    setError("");
    setListening(true);
    setDucked(true);
    try { recognition.start(); } catch { setListening(false); setDucked(false); setError(locale === "EN" ? "Could not start the microphone." : "Mikrofon tidak dapat dimulai."); }
  }

  const sendMessage = useCallback(async (raw: string) => {
    const message = raw.trim();
    if (!message || loading) return;
    const userMessage: Message = { id: ++nextId.current, role: "user", text: message };
    setMessages((current) => current.length ? [...current, userMessage] : [{ id: 0, role: "assistant", text: assistantGreeting }, userMessage]);
    setDraft("");
    setError("");
    setLoading(true);
    try {
      const result = await apiRequest<{ answer: string }>("/api/ai-assistant", { method: "POST", body: JSON.stringify({ message, language: locale, context }) });
      const answer: Message = { id: ++nextId.current, role: "assistant", text: result.answer };
      setMessages((current) => [...current, answer]);
      speak(answer.text);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (locale === "EN" ? "The assistant could not respond." : "Asisten belum dapat menjawab."));
    } finally { setLoading(false); }
  }, [assistantGreeting, context, loading, locale, speak]);

  const close = () => { stopVoice(); window.speechSynthesis?.cancel(); setOpen(false); };
  const suggestions = locale === "EN" ? ["What is my latest power reading?", "How is my estimated cost calculated?", "Is my device online?"] : ["Berapa daya terbaru saya?", "Bagaimana estimasi biaya dihitung?", "Apakah perangkat saya online?"];

  return <aside className="smart-assistant" aria-label={t("Asisten SMART POWER WEB")}>
    {open && <section className="assistant-panel smart-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="smart-assistant-title">
      <header className="assistant-header"><span className="assistant-avatar"><Image src="/images/logo-smartpower.png" alt="Logo SMART POWER WEB" width={43} height={43} /></span><div><strong id="smart-assistant-title">PowerMate</strong><span><Sparkles size={12} />{t("Asisten energi personal")}</span></div><button className="voice-toggle" type="button" onClick={toggleVoice} aria-pressed={voiceEnabled} title={voiceEnabled ? t("Matikan suara AI") : t("Nyalakan suara AI")}>{voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}<small>{voiceEnabled ? t("Suara AI: Aktif") : t("Suara AI: Bisu")}</small></button><button type="button" onClick={close} aria-label={t("Tutup asisten")}><X size={19} /></button></header>
      <div className="assistant-messages" aria-live="polite">
        {!messages.length && <div className="assistant-message assistant"><span>{assistantGreeting}</span></div>}
        {messages.map((message) => <div className={`assistant-message ${message.role}`} key={message.id}><span>{message.text}</span></div>)}
        {loading && <div className="assistant-message assistant"><span className="assistant-typing">{locale === "EN" ? "Checking your latest data…" : "Memeriksa data terbaru…"}</span></div>}
        {!messages.some((message) => message.role === "user") && <div className="assistant-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void sendMessage(suggestion)}>{suggestion}</button>)}</div>}
      </div>
      {error && <p className="assistant-error" role="alert">{error}</p>}
      <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); void sendMessage(draft); }}><button className={`assistant-mic ${listening ? "recording" : ""}`} type="button" onClick={toggleMic} aria-label={listening ? t("Hentikan mikrofon") : t("Mulai bicara")}>{listening ? <MicOff size={17} /> : <Mic size={17} />}</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={locale === "EN" ? "Ask about your energy data…" : "Tanyakan tentang data energi…"} aria-label={t("Tulis pertanyaan untuk PowerMate")} /><button type="submit" aria-label={t("Kirim pertanyaan")} disabled={!draft.trim() || loading}><Send size={18} /></button></form>
      <div className={`assistant-voice-indicator ${voiceEnabled ? "active" : ""}`} aria-hidden="true"><AudioLines size={12} /><span>{voiceEnabled ? t("Suara AI aktif") : t("Jawaban teks")}</span></div>
    </section>}
    <button className="assistant-launcher" type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? t("Tutup PowerMate") : t("Buka PowerMate")}><Sparkles size={23} /></button>
  </aside>;
}
