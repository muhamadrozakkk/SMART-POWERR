import { randomBytes, createHash } from "node:crypto";
import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError } from "../utils/errors.js";

export const adminRoutes = Router();
adminRoutes.use(requireAuth, requireRole(["DEVELOPER"]));

adminRoutes.get("/users", async (_request, response, next) => {
  try {
    const result = await query("SELECT u.id, u.name, u.email, u.role, u.tariff_group, u.max_power_limit, u.created_at, COALESCE(json_agg(json_build_object('device_id',d.device_id,'name',d.name,'last_seen',d.last_seen)) FILTER (WHERE d.device_id IS NOT NULL), '[]') AS devices FROM users u LEFT JOIN settings s ON s.user_id=u.id LEFT JOIN devices d ON d.device_id=s.device_id GROUP BY u.id ORDER BY u.created_at DESC");
    response.json({ data: result.rows });
  } catch (error) { next(error); }
});

adminRoutes.patch("/users/:id/role", async (request, response, next) => {
  try {
    const id = Number(request.params.id);
    const { role } = request.body as { role?: unknown };
    if (!Number.isSafeInteger(id) || !["DEVELOPER", "USER"].includes(String(role))) throw new HttpError(400, "ID atau role tidak valid");
    if (id === request.user?.id && role !== "DEVELOPER") throw new HttpError(400, "Kamu tidak dapat mengubah role akun sendiri");
    if (role === "USER") {
      const count = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM users WHERE role='DEVELOPER'");
      const target = await query<{ role: string }>("SELECT role FROM users WHERE id=$1", [id]);
      if (target.rows[0]?.role === "DEVELOPER" && Number(count.rows[0]?.count) <= 1) throw new HttpError(400, "Minimal harus ada satu akun DEVELOPER");
    }
    const updated = await query("UPDATE users SET role=$2 WHERE id=$1 RETURNING id, name, email, role", [id, role]);
    if (!updated.rows[0]) throw new HttpError(404, "Pengguna tidak ditemukan");
    response.json({ data: updated.rows[0] });
  } catch (error) { next(error); }
});

adminRoutes.post("/devices/:deviceId/reset-token", async (request, response, next) => {
  try {
    const deviceId = String(request.params.deviceId);
    const exists = await query("SELECT 1 FROM devices WHERE device_id=$1", [deviceId]);
    if (!exists.rowCount) throw new HttpError(404, "Perangkat tidak ditemukan");
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await query("INSERT INTO device_api_keys(device_id, token_hash) VALUES($1,$2) ON CONFLICT(device_id) DO UPDATE SET token_hash=EXCLUDED.token_hash, updated_at=NOW()", [deviceId, tokenHash]);
    response.json({ device_id: deviceId, token, message: "Simpan token sekarang dan perbarui firmware ESP32. Token hanya ditampilkan sekali." });
  } catch (error) { next(error); }
});

adminRoutes.put("/devices/:deviceId/owner", async (request, response, next) => {
  try {
    const deviceId = String(request.params.deviceId);
    const userId = Number((request.body as { user_id?: unknown })?.user_id);
    if (!Number.isSafeInteger(userId) || userId < 1) throw new HttpError(400, "user_id tidak valid");
    const result = await query("UPDATE settings SET user_id=$2, updated_at=NOW() WHERE device_id=$1 AND EXISTS (SELECT 1 FROM users WHERE id=$2) RETURNING device_id, user_id", [deviceId, userId]);
    if (!result.rows[0]) throw new HttpError(404, "Perangkat atau pengguna tidak ditemukan");
    response.json({ data: result.rows[0] });
  } catch (error) { next(error); }
});

adminRoutes.get("/system/logs", async (request, response, next) => {
  try {
    const limit = Math.min(Math.max(Number(request.query.limit ?? 100), 1), 500);
    const result = await query("SELECT id, level, message, details, created_at FROM system_logs ORDER BY created_at DESC LIMIT $1", [limit]);
    response.json({ data: result.rows });
  } catch (error) { next(error); }
});

adminRoutes.get("/config/tariff", async (_request, response, next) => {
  try {
    const result = await query<{ value: number }>("SELECT value::text::numeric AS value FROM system_config WHERE key='tariff_per_kwh'");
    response.json({ tariff_per_kwh: Number(result.rows[0]?.value ?? 1444.7) });
  } catch (error) { next(error); }
});

adminRoutes.put("/config/tariff", async (request, response, next) => {
  try {
    const value = Number((request.body as { tariff_per_kwh?: unknown })?.tariff_per_kwh);
    if (!Number.isFinite(value) || value < 0 || value > 100000) throw new HttpError(400, "Tarif harus berupa angka antara 0 sampai 100000");
    await query("INSERT INTO system_config(key,value) VALUES('tariff_per_kwh',to_jsonb($1::numeric)) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()", [value]);
    response.json({ tariff_per_kwh: value });
  } catch (error) { next(error); }
});

adminRoutes.post("/relay", async (request, response, next) => {
  try {
    const { state } = request.body as { state?: unknown };
    if (typeof state !== "boolean") throw new HttpError(400, "state harus berupa boolean");
    const result = await query("UPDATE devices SET relay_state=$1 RETURNING device_id", [state]);
    for (const device of result.rows) await query("INSERT INTO hardware_commands(device_id,command,payload) VALUES($1,'relay',$2::jsonb)", [device.device_id, JSON.stringify({ state })]);
    response.json({ queued: result.rowCount, state, message: "Perintah antrean dibuat; ESP32 harus mengambilnya melalui /api/hardware/commands." });
  } catch (error) { next(error); }
});

adminRoutes.get("/hardware/latest", async (_request, response, next) => {
  try {
    const result = await query("SELECT d.device_id, d.name, d.last_seen, r.ts, r.voltage, r.current, r.power, r.energy, r.frequency, r.power_factor FROM devices d LEFT JOIN LATERAL (SELECT * FROM readings WHERE device_id=d.device_id ORDER BY ts DESC LIMIT 1) r ON true ORDER BY d.device_id");
    response.json({ data: result.rows.map((row) => ({ ...row, is_online: row.ts ? Date.now() - new Date(row.ts as string).getTime() <= 60_000 : false })) });
  } catch (error) { next(error); }
});
