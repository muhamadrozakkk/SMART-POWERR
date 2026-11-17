import { randomBytes, createHash } from "node:crypto";
import { Router } from "express";
import { query, transaction } from "../db/pool.js";
import { requireAuth, requireRole, userId } from "../middleware/auth.js";
import { deviceStatus, resolveDeviceForUser } from "../services/deviceService.js";
import { HttpError } from "../utils/errors.js";
import { env } from "../config/env.js";

export const deviceRoutes = Router();
deviceRoutes.use(requireAuth);

deviceRoutes.get("/", async (request, response, next) => {
  try {
    const role = await query<{ role: string }>("SELECT role FROM users WHERE id=$1", [userId(request)]);
    const isDeveloper = role.rows[0]?.role === "DEVELOPER";
    const result = isDeveloper
      ? await query("SELECT d.device_id,d.name,d.location,d.last_seen,s.user_id,u.name AS owner_name,u.email AS owner_email FROM devices d LEFT JOIN settings s ON s.device_id=d.device_id LEFT JOIN users u ON u.id=s.user_id ORDER BY d.created_at DESC")
      : await query("SELECT d.device_id,d.name,d.location,d.last_seen,s.user_id FROM devices d JOIN settings s ON s.device_id=d.device_id WHERE s.user_id=$1 ORDER BY d.created_at DESC", [userId(request)]);
    response.json({ data: result.rows.map((device) => ({ ...device, is_online: Boolean(device.last_seen && Date.now() - new Date(device.last_seen as string).getTime() <= env.onlineThresholdSeconds * 1000) })) });
  } catch (error) { next(error); }
});

deviceRoutes.post("/", async (request, response, next) => {
  try {
    const account = await query<{ role: string }>("SELECT role FROM users WHERE id=$1", [userId(request)]);
    const role = account.rows[0]?.role;
    if (role !== "DEVELOPER" && role !== "USER") throw new HttpError(403, "Akun tidak diizinkan mendaftarkan perangkat");
    const { name, location } = request.body as { name?: unknown; location?: unknown };
    if (typeof name !== "string" || !name.trim() || name.trim().length > 120 || typeof location !== "string" || !location.trim() || location.trim().length > 240) throw new HttpError(400, "Nama perangkat dan lokasi wajib diisi (maksimal 120 dan 240 karakter)");
    const deviceId = `SPW-${randomBytes(8).toString("hex").toUpperCase()}`;
    const apiKey = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(apiKey).digest("hex");
    await transaction(async (client) => {
      await client.query("INSERT INTO devices(device_id,name,location) VALUES($1,$2,$3)", [deviceId, name.trim(), location.trim()]);
      if (role === "USER") await client.query("INSERT INTO settings(device_id,user_id) VALUES($1,$2)", [deviceId, userId(request)]);
      else await client.query("INSERT INTO settings(device_id) VALUES($1)", [deviceId]);
      await client.query("INSERT INTO device_api_keys(device_id,token_hash) VALUES($1,$2)", [deviceId, tokenHash]);
    });
    response.status(201).json({ data: { device_id: deviceId, name: name.trim(), location: location.trim(), user_id: role === "USER" ? userId(request) : null }, api_key: apiKey, message: role === "USER" ? "Perangkat berhasil didaftarkan dan ditautkan ke akunmu. Simpan API key sekarang; key hanya ditampilkan sekali." : "Simpan API key sekarang; key hanya ditampilkan sekali." });
  } catch (error) { next(error); }
});

deviceRoutes.get("/:id/status", async (request, response, next) => { try { const id = await resolveDeviceForUser(userId(request), String(request.params.id)); response.json(await deviceStatus(id)); } catch (error) { next(error); } });
