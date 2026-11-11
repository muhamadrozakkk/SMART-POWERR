import { Router } from "express";
import { query } from "../db/pool.js";
import { requireDeviceApiKey } from "../middleware/apiKey.js";
import { HttpError } from "../utils/errors.js";

export const hardwareRoutes = Router();
hardwareRoutes.get("/commands", requireDeviceApiKey, async (request, response, next) => {
  try {
    const deviceId = typeof request.query.device_id === "string" ? request.query.device_id : "";
    if (!deviceId) throw new HttpError(400, "device_id wajib diisi");
    const result = await query("UPDATE hardware_commands SET status='sent' WHERE id IN (SELECT id FROM hardware_commands WHERE device_id=$1 AND status='pending' ORDER BY created_at LIMIT 20) RETURNING id, command, payload", [deviceId]);
    response.json({ data: result.rows });
  } catch (error) { next(error); }
});
hardwareRoutes.post("/commands/:id/ack", requireDeviceApiKey, async (request, response, next) => {
  try {
    const { device_id: deviceId, success } = request.body as { device_id?: unknown; success?: unknown };
    if (typeof deviceId !== "string" || typeof success !== "boolean") throw new HttpError(400, "device_id dan success wajib diisi");
    const result = await query("UPDATE hardware_commands SET status=$3, completed_at=NOW() WHERE id=$1 AND device_id=$2 AND status='sent' RETURNING id", [Number(request.params.id), deviceId, success ? "done" : "failed"]);
    if (!result.rowCount) throw new HttpError(404, "Command tidak ditemukan atau sudah diproses");
    response.json({ ok: true });
  } catch (error) { next(error); }
});
