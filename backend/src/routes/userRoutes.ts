import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth, userId } from "../middleware/auth.js";
import { resolveDeviceForUser } from "../services/deviceService.js";
import { HttpError } from "../utils/errors.js";

export const userRoutes = Router();
userRoutes.use(requireAuth);
userRoutes.get("/relay", async (request, response, next) => {
  try {
    const deviceId = await resolveDeviceForUser(userId(request));
    const result = await query("SELECT relay_state FROM devices WHERE device_id=$1", [deviceId]);
    response.json({ device_id: deviceId, state: Boolean(result.rows[0]?.relay_state) });
  } catch (error) { next(error); }
});
userRoutes.put("/relay", async (request, response, next) => {
  try {
    const { state } = request.body as { state?: unknown };
    if (typeof state !== "boolean") throw new HttpError(400, "state harus berupa boolean");
    const deviceId = await resolveDeviceForUser(userId(request));
    await query("UPDATE devices SET relay_state=$2 WHERE device_id=$1", [deviceId, state]);
    await query("INSERT INTO hardware_commands(device_id,command,payload) VALUES($1,'relay',$2::jsonb)", [deviceId, JSON.stringify({ state })]);
    response.json({ device_id: deviceId, state, message: "Perintah relay masuk antrean perangkat." });
  } catch (error) { next(error); }
});
