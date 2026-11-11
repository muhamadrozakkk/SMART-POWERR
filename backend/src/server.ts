import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { pool, query } from "./db/pool.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { authRoutes } from "./routes/authRoutes.js";
import { readingRoutes } from "./routes/readingRoutes.js";
import { costRoutes } from "./routes/costRoutes.js";
import { settingsRoutes } from "./routes/settingsRoutes.js";
import { notificationRoutes } from "./routes/notificationRoutes.js";
import { deviceRoutes } from "./routes/deviceRoutes.js";
import { requireAuth, userId } from "./middleware/auth.js";
import { costSummary } from "./services/costService.js";
import { deviceStatus, resolveDeviceForUser } from "./services/deviceService.js";
import { listNotifications } from "./services/notificationService.js";
import { latestReading, readings } from "./services/readingService.js";
import { checkOfflineDevices } from "./services/notificationService.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { ensureDeveloperAccount } from "./services/authService.js";
import { hardwareRoutes } from "./routes/hardwareRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: (origin, callback) => { if (!origin || env.corsOrigins.includes(origin)) return callback(null, true); return callback(new Error("Origin tidak diizinkan oleh CORS")); }, credentials: true }));
app.use(express.json({ limit: "32kb" }));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Terlalu banyak percobaan login. Coba lagi nanti." } });
async function healthHandler(_request: Request, response: Response) {
  if (!pool) return response.status(503).json({ status: "degraded", database: "not_configured", service: "smart-power-api" });
  try { await query("SELECT 1"); return response.json({ status: "ok", database: "connected", service: "smart-power-api", timestamp: new Date().toISOString() }); } catch { return response.status(503).json({ status: "degraded", database: "unavailable", service: "smart-power-api" }); }
}
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

app.use("/api/auth", loginLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/hardware", hardwareRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/cost", costRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/devices", deviceRoutes);

app.get("/api/dashboard", requireAuth, async (request, response, next) => {
  try {
    const deviceId = await resolveDeviceForUser(userId(request));
    const history = await readings(deviceId);
    const latest = history.at(-1) ?? await latestReading(deviceId);
    const costs = await costSummary(userId(request), deviceId);
    const device = await deviceStatus(deviceId);
    const notifications = await listNotifications(userId(request));
    response.json({ metrics: { activePower: { value: latest.power, unit: "W", status: latest.power > 1500 ? "Melebihi batas" : "Penggunaan Normal" }, current: { value: latest.current, unit: "A", status: "Penggunaan Normal" }, voltage: { value: latest.voltage, unit: "V", status: "Stabil" }, powerFactor: { value: latest.power_factor, unit: "", status: "Baik" }, todayEnergy: { value: costs.today.energy_kwh, unit: "kWh", cost: costs.today.cost_rp } }, powerHistory: history.map((row) => ({ time: row.timestamp, power: row.power, energy: row.energy, current: row.current, voltage: row.voltage })), distribution: [], device, alarms: notifications, prediction: [], simulation: false });
  } catch (error) { next(error); }
});

app.get("/api/device", requireAuth, async (request, response, next) => { try { response.json({ data: await deviceStatus(await resolveDeviceForUser(userId(request))), simulation: false }); } catch (error) { next(error); } });
app.get("/api/alarms", requireAuth, async (request, response, next) => { try { const data = await listNotifications(userId(request)); response.json({ data, total: data.length, simulation: false }); } catch (error) { next(error); } });
app.get("/api/prediction", requireAuth, async (request, response, next) => { try { const summary = await costSummary(userId(request)); response.json({ data: [], unit: "kWh / hari", summary, simulation: false }); } catch (error) { next(error); } });
app.get("/api/energy/distribution", requireAuth, (_request, response) => response.json({ data: [], simulation: false }));

app.post("/api/contact", (request, response) => {
  const body = request.body as Record<string, unknown>;
  const valid = ["name", "email", "subject", "message"].every((key) => typeof body[key] === "string" && String(body[key]).trim());
  if (!valid) return response.status(400).json({ error: "Nama, email, subjek, dan pesan wajib diisi" });
  console.info(`Pesan kontak diterima dari ${String(body.email).trim()}`);
  return response.status(201).json({ ok: true, message: "Pesan berhasil diterima" });
});

app.use(notFound);
app.use(errorHandler);

if (pool) {
  try {
    const created = await ensureDeveloperAccount();
    console.log(created ? "Akun developer awal berhasil dibuat" : "Akun developer utama sudah tersedia");
  } catch (error) { console.error("Seed akun developer gagal:", error); }
}
const server = app.listen(env.port, () => console.log(`SMART POWER API berjalan di http://localhost:${env.port} (${env.timezone})`));
if (pool) {
  const timer = setInterval(() => { checkOfflineDevices().catch((error) => console.error("Pengecekan offline gagal", error)); }, 30_000);
  timer.unref();
}
export default server;
