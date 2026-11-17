"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AudioLines, FileText, History, Image as ImageIcon, Mic, MicOff, MessageSquarePlus, Paperclip, Send, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useAmbientAudio } from "@/components/audio/AmbientAudioProvider";

type Message = { id: string; role: "assistant" | "user"; text: string; attachments?: { name: string; mimeType: string }[] };
type PendingAttachment = { id: string; name: string; mimeType: string; size: number; text?: string; dataUrl?: string };
type Conversation = { id: string; title: string; updatedAt: number; messages: Message[] };
type SpeechResult = { transcript: string };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<{ 0: SpeechResult; isFinal: boolean }> };
type RecognitionInstance = { lang: string; interimResults: boolean; continuous: boolean; onresult: ((event: RecognitionEvent) => void) | null; onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; abort: () => void };
type RecognitionConstructor = new () => RecognitionInstance;

function detectMessageLanguage(text: string): "ID" | "EN" {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const id = new Set(["apa", "bagaimana", "gimana", "kenapa", "tolong", "bisa", "saya", "aku", "kamu", "anda", "yang", "dan", "atau", "ini", "itu", "untuk", "dengan", "dari", "enggak", "nggak", "gak", "ga", "tidak", "apakah", "berapa", "dong", "masih", "buat", "jelaskan", "kok", "sih", "nih", "ya", "udah", "belum", "aja", "kayak", "gimana"]);
  const en = new Set(["hi", "hello", "hey", "what", "how", "why", "please", "can", "could", "would", "you", "your", "the", "and", "or", "this", "that", "for", "with", "from", "not", "is", "are", "do", "does", "did", "tell", "explain", "help", "about", "show", "thanks", "thank", "good", "morning", "evening", "where", "when", "who", "which", "have", "has", "will", "should"]);
  const count = (set: Set<string>) => words.reduce((total, word) => total + Number(set.has(word)), 0);
  return count(en) > count(id) ? "EN" : "ID";
}

function accountStorageKey() {
  const token = window.localStorage.getItem("spw_access_token") ?? "guest";
  try {
    const payloadPart = token.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? "";
    const payload = JSON.parse(atob(payloadPart)) as { sub?: string; id?: number };
    return `spw_powermate_chats_${payload.sub ?? payload.id ?? "guest"}`;
  } catch { return "spw_powermate_chats_guest"; }
}

async function extractXlsxText(file: File) {
  const data = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const decoder = new TextDecoder();
  const eocdMin = Math.max(0, data.length - 65_557);
  let eocd = -1;
  for (let i = data.length - 22; i >= eocdMin; i--) if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error(`${file.name}: spreadsheet tidak terbaca.`);
  const entryCount = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const entries = new Map<string, { method: number; compressed: number; uncompressed: number; offset: number }>();
  for (let i = 0; i < entryCount && cursor + 46 <= data.length; i++) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const compressed = view.getUint32(cursor + 20, true);
    const uncompressed = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const offset = view.getUint32(cursor + 42, true);
    const nameStart = cursor + 46;
    const name = decoder.decode(data.subarray(nameStart, nameStart + nameLength));
    if (uncompressed > 20 * 1024 * 1024) throw new Error(`${file.name}: isi file terlalu besar untuk diproses.`);
    entries.set(name, { method, compressed, uncompressed, offset });
    cursor = nameStart + nameLength + extraLength + commentLength;
  }
  const readEntry = async (name: string) => {
    const entry = entries.get(name);
    if (!entry) return "";
    if (entry.method !== 0 && entry.method !== 8) throw new Error(`${file.name}: metode kompresi spreadsheet tidak didukung.`);
    const localName = view.getUint16(entry.offset + 26, true);
    const localExtra = view.getUint16(entry.offset + 28, true);
    const start = entry.offset + 30 + localName + localExtra;
    const compressed = data.slice(start, start + entry.compressed);
    if (entry.method === 0) return decoder.decode(compressed);
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return decoder.decode(await new Response(stream).arrayBuffer());
  };
  const sharedXml = await readEntry("xl/sharedStrings.xml");
  const sharedDoc = sharedXml ? new DOMParser().parseFromString(sharedXml, "application/xml") : null;
  const shared = sharedDoc ? Array.from(sharedDoc.getElementsByTagName("si"), (item) => Array.from(item.getElementsByTagName("t"), (text) => text.textContent ?? "").join("")) : [];
  const sheetNames = Array.from(entries.keys()).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort().slice(0, 5);
  const sheets = await Promise.all(sheetNames.map(async (name, index) => {
    const xml = await readEntry(name);
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const rows = Array.from(doc.getElementsByTagName("row")).slice(0, 120).map((row) => Array.from(row.getElementsByTagName("c"), (cell) => {
      const value = cell.getElementsByTagName("v")[0]?.textContent ?? Array.from(cell.getElementsByTagName("t"), (part) => part.textContent ?? "").join("");
      return cell.getAttribute("t") === "s" ? (shared[Number(value)] ?? "") : value;
    }).join("\t")).join("\n");
    return `Sheet ${index + 1}\n${rows}`;
  }));
  return sheets.join("\n\n").slice(0, 10_000);
}

async function readAttachment(file: File): Promise<PendingAttachment> {
  const id = crypto.randomUUID();
  const name = file.name.slice(0, 160);
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const supported = ["pdf", "docx", "xlsx", "csv", "txt", "png", "jpg", "jpeg", "webp", "gif"];
  if (!supported.includes(extension)) throw new Error(`${name}: gunakan PDF, DOCX, XLSX, CSV, TXT, atau gambar.`);
  const isImage = file.type.startsWith("image/");
  if (file.size > (isImage ? 1_800_000 : 4 * 1024 * 1024)) throw new Error(`${name}: ukuran gambar maksimal 1,8 MB dan dokumen maksimal 4 MB.`);
  const attachment: PendingAttachment = { id, name, mimeType: file.type || "application/octet-stream", size: file.size };
  if (isImage) {
    attachment.dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Gambar tidak dapat dibaca."));
      reader.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
      reader.readAsDataURL(file);
    });
  } else if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 8); pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
    }
    attachment.text = pages.join("\n").slice(0, 10_000);
  } else if (extension === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    attachment.text = result.value.slice(0, 10_000);
  } else if (extension === "xlsx") {
    attachment.text = await extractXlsxText(file);
  } else {
    attachment.text = (await file.text()).slice(0, 10_000);
  }
  return attachment;
}

export function SmartPowerAssistant() {
  const { locale, t } = useI18n();
  const { setDucked } = useAmbientAudio();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [readingFiles, setReadingFiles] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const storageKeyRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const [aiMode, setAiMode] = useState<"unknown" | "general" | "local" | "limited">("unknown");
  const assistantGreeting = locale === "EN" ? "Hello! I am PowerMate, your general AI assistant in SMART POWER WEB. Ask me about everyday topics, the project, or your energy dashboard." : "Halo! Aku PowerMate, asisten AI umum di SMART POWER WEB. Tanyakan apa saja—topik sehari-hari, konsep proyek ini, atau data dashboard energimu.";
  const messages = useMemo(() => conversations.find((conversation) => conversation.id === activeConversationId)?.messages ?? [], [activeConversationId, conversations]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      setVoiceEnabled(window.localStorage.getItem("spw_ai_voice_enabled") === "1");
      const key = accountStorageKey();
      storageKeyRef.current = key;
      try {
        const saved = JSON.parse(window.localStorage.getItem(key) ?? "[]") as Conversation[];
        const safe = Array.isArray(saved) ? saved.filter((item) => item && typeof item.id === "string" && Array.isArray(item.messages)).slice(0, 30) : [];
        setConversations(safe);
        setActiveConversationId(safe[0]?.id ?? "");
      } catch { setConversations([]); }
      setHistoryLoaded(true);
    }, 0);
    return () => { window.clearTimeout(loadTimer); window.speechSynthesis?.cancel(); recognitionRef.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!historyLoaded || !storageKeyRef.current) return;
    try { window.localStorage.setItem(storageKeyRef.current, JSON.stringify(conversations.slice(0, 30))); } catch { /* Keep chat usable if browser storage is full. */ }
  }, [conversations, historyLoaded]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const spokenText = (text.match(/[^.!?]+[.!?]?/g) ?? [text]).slice(0, 3).join(" ").trim().slice(0, 420);
    const language = detectMessageLanguage(text);
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = language === "EN" ? "en-US" : "id-ID";
    utterance.pitch = 1.2;
    utterance.rate = 0.96;
    utterance.volume = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const languageVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(language === "EN" ? "en" : "id"));
    utterance.voice = languageVoices.find((voice) => /female|woman|perempuan|gadis|damayanti|google.*bahasa|indonesia.*female|siti/i.test(voice.name)) ?? languageVoices[0] ?? null;
    utterance.onstart = () => setDucked(true);
    utterance.onend = () => setDucked(false);
    utterance.onerror = () => setDucked(false);
    window.speechSynthesis.speak(utterance);
  }, [setDucked, voiceEnabled]);

  function appendToConversation(conversationId: string, message: Message) {
    setConversations((current) => {
      const existing = current.find((item) => item.id === conversationId);
      if (!existing) return [{ id: conversationId, title: message.role === "user" ? message.text.slice(0, 36) || "Percakapan baru" : "Percakapan baru", updatedAt: Date.now(), messages: [message] }, ...current].slice(0, 30);
      return [{ ...existing, title: existing.title === "Percakapan baru" && message.role === "user" ? message.text.slice(0, 36) || existing.title : existing.title, updatedAt: Date.now(), messages: [...existing.messages, message] }, ...current.filter((item) => item.id !== conversationId)].slice(0, 30);
    });
  }

  function newConversation() {
    const id = crypto.randomUUID();
    setConversations((current) => [{ id, title: "Percakapan baru", updatedAt: Date.now(), messages: [] }, ...current].slice(0, 30));
    setActiveConversationId(id);
    setAttachments([]);
    setDraft("");
    setError("");
    setHistoryOpen(false);
  }

  const speakMessage = useCallback((text: string) => speak(text), [speak]);

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

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;
    if (attachments.length + selected.length > 3) { setError(locale === "EN" ? "Attach up to three files per message." : "Lampirkan maksimal tiga file per pesan."); return; }
    setReadingFiles(true);
    setError("");
    try {
      const parsed = await Promise.all(selected.map(readAttachment));
      const imageBytes = [...attachments, ...parsed].reduce((sum, file) => sum + (file.dataUrl?.length ?? 0), 0);
      if (imageBytes > 4_500_000) throw new Error(locale === "EN" ? "Combined image size is too large. Choose smaller images." : "Ukuran total gambar terlalu besar. Pilih gambar yang lebih kecil.");
      setAttachments((current) => [...current, ...parsed]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (locale === "EN" ? "Could not read that file." : "File tidak dapat dibaca."));
    } finally { setReadingFiles(false); }
  }

  const sendMessage = useCallback(async (raw: string) => {
    const message = raw.trim();
    if ((!message && !attachments.length) || loading) return;
    const conversationId = activeConversationId || crypto.randomUUID();
    if (!activeConversationId) setActiveConversationId(conversationId);
    const shownText = message || (locale === "EN" ? "Please analyze the attached file." : "Tolong analisis file yang saya lampirkan.");
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: shownText, attachments: attachments.map(({ name, mimeType }) => ({ name, mimeType })) };
    const previous = conversations.find((item) => item.id === conversationId)?.messages ?? [];
    const history = previous.slice(-10).map(({ role, text }) => ({ role, content: text }));
    const payloadAttachments = attachments.map(({ name, mimeType, text, dataUrl }) => ({ name, mimeType, text, dataUrl }));
    appendToConversation(conversationId, userMessage);
    setDraft("");
    setAttachments([]);
    setError("");
    setLoading(true);
    try {
      const result = await apiRequest<{ answer: string; provider?: string }>("/api/ai-assistant", { method: "POST", body: JSON.stringify({ message, history, attachments: payloadAttachments }) });
      setAiMode(result.provider === "openai-compatible" ? "general" : result.provider === "local-fallback" ? "limited" : "local");
      const answer: Message = { id: crypto.randomUUID(), role: "assistant", text: result.answer };
      appendToConversation(conversationId, answer);
      speakMessage(answer.text);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (locale === "EN" ? "The assistant could not respond." : "Asisten belum dapat menjawab."));
    } finally { setLoading(false); }
  }, [activeConversationId, attachments, conversations, loading, locale, speakMessage]);

  const close = () => { stopVoice(); setOpen(false); };
  const suggestions = locale === "EN" ? ["Explain how this website works", "What is power factor?", "Tell me something interesting"] : ["Jelaskan cara kerja website ini", "Apa itu faktor daya?", "Ceritakan hal menarik"];
  const startNewLabel = locale === "EN" ? "New chat" : "Percakapan baru";
  const historyLabel = locale === "EN" ? "Chat history" : "Riwayat percakapan";

  return <aside className="smart-assistant" aria-label={t("Asisten SMART POWER WEB")}>
    {open && <section className="assistant-panel smart-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="smart-assistant-title">
    <header className="assistant-header"><span className="assistant-avatar"><Image src="/images/logo-smartpower.png" alt="Logo SMART POWER WEB" width={43} height={43} /></span><div><strong id="smart-assistant-title">PowerMate</strong><span><Sparkles size={12} />{t("Asisten energi personal")}</span></div><button className="voice-toggle" type="button" onClick={toggleVoice} aria-pressed={voiceEnabled} title={voiceEnabled ? t("Matikan suara AI") : t("Nyalakan suara AI")}>{voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}<small>{voiceEnabled ? t("Suara AI: Aktif") : t("Suara AI: Bisu")}</small></button><button type="button" onClick={close} aria-label={t("Tutup asisten")}><X size={19} /></button></header>
      <div className="assistant-chat-tools"><button type="button" onClick={newConversation}><MessageSquarePlus size={15} />{startNewLabel}</button><button type="button" onClick={() => setHistoryOpen((value) => !value)} aria-expanded={historyOpen}><History size={15} />{historyLabel}</button></div>
      {historyOpen && <div className="assistant-history" aria-label={historyLabel}>{conversations.filter((item) => item.messages.length).map((item) => <button type="button" className={item.id === activeConversationId ? "active" : ""} key={item.id} onClick={() => { setActiveConversationId(item.id); setAttachments([]); setHistoryOpen(false); }}>{item.title}</button>)}{!conversations.some((item) => item.messages.length) && <span>{locale === "EN" ? "No conversations yet." : "Belum ada percakapan."}</span>}</div>}
      <div className="assistant-messages" aria-live="polite">
        {!messages.length && <div className="assistant-message assistant"><span>{assistantGreeting}</span></div>}
        {messages.map((message) => <div className={`assistant-message ${message.role}`} key={message.id}><span>{message.text}{Boolean(message.attachments?.length) && <small className="assistant-message-files">{message.attachments?.map((file) => <i key={file.name}>{file.mimeType.startsWith("image/") ? <ImageIcon size={13} /> : <FileText size={13} />}{file.name}</i>)}</small>}</span></div>)}
        {loading && <div className="assistant-message assistant"><span className="assistant-typing">{locale === "EN" ? "Thinking…" : "Sedang menyiapkan jawaban…"}</span></div>}
        <div ref={messagesEndRef} />
        {!messages.some((message) => message.role === "user") && <div className="assistant-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void sendMessage(suggestion)}>{suggestion}</button>)}</div>}
      </div>
      {aiMode !== "unknown" && aiMode !== "general" && <p className="assistant-mode-note" role="status">{aiMode === "limited" ? (locale === "EN" ? "AI provider unavailable; using limited local answers." : "AI umum belum tersedia; sedang memakai jawaban lokal terbatas.") : (locale === "EN" ? "Local mode: basic answers only. Add a Gemini key for broad general chat." : "Mode lokal: jawaban umum terbatas. Tambahkan Gemini API key untuk percakapan umum yang lebih luas.")}</p>}
      {error && <p className="assistant-error" role="alert">{error}</p>}
      {attachments.length > 0 && <div className="assistant-pending-files">{attachments.map((file) => <span key={file.id}>{file.mimeType.startsWith("image/") ? <ImageIcon size={13} /> : <FileText size={13} />}{file.name}<button type="button" onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))} aria-label={`Remove ${file.name}`}><X size={13} /></button></span>)}</div>}
      <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); void sendMessage(draft); }}><input ref={fileInputRef} className="assistant-file-input" type="file" multiple accept=".pdf,.docx,.xlsx,.csv,.txt,image/png,image/jpeg,image/webp,image/gif" onChange={(event) => void handleFiles(event)} /><button className="assistant-attach" type="button" onClick={() => fileInputRef.current?.click()} aria-label={locale === "EN" ? "Attach a file" : "Lampirkan file"} title={locale === "EN" ? "Attach a file" : "Lampirkan file"} disabled={readingFiles || attachments.length >= 3}><Paperclip size={18} /></button><button className={`assistant-mic ${listening ? "recording" : ""}`} type="button" onClick={toggleMic} aria-label={listening ? t("Hentikan mikrofon") : t("Mulai bicara")}>{listening ? <MicOff size={17} /> : <Mic size={17} />}</button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={readingFiles ? (locale === "EN" ? "Reading file…" : "Membaca file…") : (locale === "EN" ? "Ask me anything…" : "Tanyakan apa saja…")} aria-label={t("Tulis pertanyaan untuk PowerMate")} /><button type="submit" aria-label={t("Kirim pertanyaan")} disabled={(!draft.trim() && !attachments.length) || loading || readingFiles}><Send size={18} /></button></form>
      <div className={`assistant-voice-indicator ${voiceEnabled ? "active" : ""}`} aria-hidden="true"><AudioLines size={12} /><span>{voiceEnabled ? t("Suara AI aktif") : t("Jawaban teks")}</span></div>
    </section>}
    <button className="assistant-launcher" type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? t("Tutup PowerMate") : t("Buka PowerMate")}><Image src="/images/logo-smartpower.png" alt="" width={44} height={44} /></button>
  </aside>;
}
