import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { query } from "../db/pool.js";
import { requireAuth, userId } from "../middleware/auth.js";
import { costSummary } from "../services/costService.js";
import { deviceStatus, resolveDeviceForUser } from "../services/deviceService.js";
import { countUnreadNotifications } from "../services/notificationService.js";
import { latestReading, readings } from "../services/readingService.js";
import { HttpError } from "../utils/errors.js";

export const aiAssistantRoutes = Router();
const assistantLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Terlalu banyak pertanyaan. Coba lagi beberapa menit." } });
aiAssistantRoutes.use(requireAuth, assistantLimiter);

type Language = "ID" | "EN";
type ChatTurn = { role: "user" | "assistant"; content: string };
type Context = {
  device: { id: string; online: boolean; lastSeen: string | null } | null;
  latest: { timestamp: string; voltage: number; current: number; power: number; energy: number; frequency: number; power_factor: number } | null;
  tariff: { class: string; perKwh: number } | null;
  history24h: { count: number; averagePowerW: number; peakPowerW: number; energyKwh: number };
  unreadNotifications: number;
};

async function loadContext(id: number): Promise<Context> {
  const empty: Context = { device: null, latest: null, tariff: null, history24h: { count: 0, averagePowerW: 0, peakPowerW: 0, energyKwh: 0 }, unreadNotifications: 0 };
  empty.unreadNotifications = await countUnreadNotifications(id);
  let deviceId: string;
  try { deviceId = await resolveDeviceForUser(id); } catch (error) { if (error instanceof HttpError && error.status === 404) return empty; throw error; }
  const [status, costs, values, settings] = await Promise.all([
    deviceStatus(deviceId),
    costSummary(id, deviceId),
    readings(deviceId, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    query<{ tariff_class: string }>("SELECT tariff_class FROM settings WHERE user_id=$1 AND device_id=$2", [id, deviceId]),
  ]);
  let latest: Context["latest"] = null;
  try { latest = await latestReading(deviceId); } catch (error) { if (!(error instanceof HttpError && error.status === 404)) throw error; }
  const powerValues = values.map((row) => row.power);
  const energyValues = values.map((row) => row.energy);
  const energyKwh = energyValues.length > 1 ? Math.max(0, energyValues[energyValues.length - 1] - energyValues[0]) : 0;
  return {
    device: { id: status.device_id, online: status.is_online, lastSeen: status.last_seen },
    latest,
    tariff: { class: settings.rows[0]?.tariff_class ?? "Tidak dipilih", perKwh: costs.tariff_per_kwh },
    history24h: { count: values.length, averagePowerW: powerValues.length ? Math.round(powerValues.reduce((sum, value) => sum + value, 0) / powerValues.length) : 0, peakPowerW: powerValues.length ? Math.max(...powerValues) : 0, energyKwh: Number(energyKwh.toFixed(4)) },
    unreadNotifications: empty.unreadNotifications,
  };
}

function localAnswer(message: string, language: Language, context: Context) {
  const question = message.toLowerCase();
  if (/^(hai|halo|hello|hi|hey|pagi|siang|sore|malam|apa kabar)[!.?\s]*$/i.test(question)) return language === "EN" ? "Hello! I am PowerMate. I can help with general questions and your SMART POWER energy dashboard. What would you like to talk about?" : "Halo! Aku PowerMate. Aku bisa membantu pertanyaan umum maupun dashboard energi SMART POWER. Kamu ingin membahas apa?";
  if (/\b(terima kasih|makasih|thanks|thank you|thx)\b/i.test(question)) return language === "EN" ? "You’re welcome! Feel free to ask me anything else." : "Sama-sama! Silakan tanya hal lain kapan saja.";
  if (/\b(siapa kamu|who are you|namamu siapa)\b/i.test(question)) return language === "EN" ? "I am PowerMate, a general assistant built into SMART POWER WEB. I can chat about general topics and help interpret your energy dashboard." : "Aku PowerMate, asisten yang ada di SMART POWER WEB. Aku bisa membahas berbagai hal umum sekaligus membantu membaca dashboard energimu.";
  if (/\b(jam berapa|what time is it|tanggal berapa|what is today's date)\b/i.test(question)) {
    const now = new Intl.DateTimeFormat(language === "EN" ? "en-US" : "id-ID", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date());
    return language === "EN" ? `The current time in Jakarta is ${now}.` : `Sekarang di zona waktu Jakarta ${now}.`;
  }
  if (/\b(cuaca|weather|berita terbaru|latest news|harga saham|latest price)\b/i.test(question)) return language === "EN" ? "I cannot access live internet data in local assistant mode, so I cannot verify that right now. If you enable Gemini in the backend, I can answer a much broader range of general questions, though live facts may still need a search source." : "Mode lokal belum terhubung ke data internet langsung, jadi aku belum bisa memastikan informasi terkini. Jika Gemini diaktifkan di backend, aku dapat menjawab lebih banyak pertanyaan umum; informasi live tetap memerlukan sumber pencarian.";
  if (language === "EN") {
    if (question.includes("cost") || question.includes("tariff")) return `The selected tariff is ${context.tariff?.class ?? "not set"} at Rp ${context.tariff?.perKwh ?? 0}/kWh. Cost estimates are calculated from stored meter readings and are not an official PLN bill.`;
    if (question.includes("device") || question.includes("online")) return context.device ? `Your device is currently ${context.device.online ? "online" : "offline"}. The dashboard uses the latest real reading saved by this device.` : "No device is linked to this account yet. Ask the developer to link a device before monitoring readings.";
    if (question.includes("power") || question.includes("voltage") || question.includes("current")) return context.latest ? `The latest inlet reading is ${context.latest.power} W, ${context.latest.voltage} V, and ${context.latest.current} A. One sensor measures the total inlet load, not individual appliances.` : "No real sensor reading is available yet. The dashboard will show readings after the ESP32 sends data.";
    return "I can explain your real energy readings, tariff estimate, device status, and history. Ask about one of those topics and I will use the latest account data.";
  }
  if (question.includes("biaya") || question.includes("tarif")) return `Tarif akunmu ${context.tariff?.class ?? "belum dipilih"} sebesar Rp ${(context.tariff?.perKwh ?? 0).toLocaleString("id-ID")}/kWh. Estimasi dihitung dari pembacaan meter yang tersimpan, bukan tagihan resmi PLN.`;
  if (question.includes("perangkat") || question.includes("online") || question.includes("offline")) return context.device ? `Perangkatmu sedang ${context.device.online ? "online" : "offline"}. Dashboard menggunakan pembacaan nyata terakhir yang tersimpan dari perangkat ini.` : "Belum ada perangkat yang ditautkan ke akun ini. Minta Developer menautkan perangkat agar pembacaan dapat dipantau.";
  if (question.includes("daya") || question.includes("tegangan") || question.includes("arus")) return context.latest ? `Pembacaan terakhir di jalur masuk: ${context.latest.power} W, ${context.latest.voltage} V, dan ${context.latest.current} A. Satu sensor mengukur total beban di jalur masuk, bukan tiap peralatan.` : "Belum ada pembacaan sensor nyata. Data akan tampil setelah ESP32 mengirim telemetry ke backend.";
  return "Saat ini aku sedang dalam mode lokal, jadi pengetahuan umumku terbatas. Aktifkan Gemini API key yang valid di backend agar aku bisa menjawab berbagai pertanyaan umum. Aku tetap bisa menjawab pertanyaan dasar tentang dashboard, perangkat, tarif, dan pembacaan listrik.";
}

async function generateAnswer(message: string, language: Language, context: Context, history: ChatTurn[]): Promise<{ answer: string; provider: "openai-compatible" | "local" | "local-fallback" }> {
  if (!env.aiApiKey) return { answer: localAnswer(message, language, context), provider: "local" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const accountContext = JSON.stringify(context);
    const response = await fetch(env.aiApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.aiApiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.aiModel,
        temperature: 0.4,
        max_tokens: 180,
        messages: [
          { role: "system", content: `Kamu adalah PowerMate, asisten AI umum yang ramah, cerdas, dan komunikatif di SMART POWER WEB. Jawab semua topik yang aman dan sesuai kemampuan pengetahuan umum; jangan membatasi jawaban hanya ke listrik atau aplikasi ini. Pahami ejaan informal, typo, singkatan, dan pertanyaan lanjutan dari riwayat percakapan. Jika pertanyaan berhubungan dengan SMARTPOWER, gunakan konteks akun bila tersedia dan jangan mengarang angka, status, atau pembacaan. Sistem SMARTPOWER memiliki satu sensor di jalur masuk sehingga hanya bisa menjelaskan beban total, bukan identifikasi pemakaian tiap alat. Estimasi biaya bukan tagihan resmi. Untuk fakta live seperti cuaca atau berita, jelaskan keterbatasan jika tidak ada sumber browsing. Waktu server saat ini: ${new Intl.DateTimeFormat("id-ID", { dateStyle: "full", timeStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date())}. Jawab dalam ${language === "EN" ? "English" : "Bahasa Indonesia"}, dengan bahasa natural, akurat, ramah, dan ringkas; gunakan daftar/markdown hanya jika membantu. Konteks akun (hanya dikirim jika pertanyaan tentang SMARTPOWER): ${accountContext}` },
          ...(history.length ? history.map((turn) => ({ role: turn.role, content: turn.content })) : [{ role: "user", content: message }]),
        ],
      }),
    });
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
    if (!response.ok) throw new Error(result.error?.message ?? `AI provider returned ${response.status}`);
    const answer = result.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("AI provider returned an empty response");
    return { answer: answer.replace(/[*#`]/g, "").replace(/\s+/g, " ").slice(0, 1200), provider: "openai-compatible" };
  } catch (error) {
    console.warn("AI provider unavailable; using local contextual response.", error instanceof Error ? error.message : "Unknown provider error");
    return { answer: localAnswer(message, language, context), provider: "local-fallback" };
  } finally { clearTimeout(timeout); }
}

aiAssistantRoutes.post("/", async (request, response, next) => {
  try {
    const body = request.body as { message?: unknown; language?: unknown; history?: unknown };
    if (typeof body.message !== "string" || !body.message.trim() || body.message.length > 1000) throw new HttpError(400, "Pesan wajib diisi dan maksimal 1000 karakter");
    const language: Language = body.language === "EN" ? "EN" : "ID";
    const history: ChatTurn[] = Array.isArray(body.history) ? body.history.slice(-10).flatMap((item): ChatTurn[] => {
      if (!item || typeof item !== "object") return [];
      const turn = item as { role?: unknown; content?: unknown };
      if ((turn.role !== "user" && turn.role !== "assistant") || typeof turn.content !== "string") return [];
      const content = turn.content.trim().slice(0, 1000);
      return content ? [{ role: turn.role, content }] : [];
    }) : [];
    // Resolve context on the server so every request gets fresh, account-scoped data.
    // Client-provided context is intentionally not trusted for device or meter values.
    const context: Context = await loadContext(userId(request));
    const result = await generateAnswer(body.message.trim(), language, context, history);
    response.json({ ...result, context });
  } catch (error) { next(error); }
});
