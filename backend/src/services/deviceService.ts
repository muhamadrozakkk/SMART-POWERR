import { query } from "../db/pool.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/errors.js";

export async function resolveDeviceForUser(userId: number, requested?: string) {
  const result = requested
    ? await query<{ device_id: string }>("SELECT d.device_id FROM devices d JOIN settings s ON s.device_id=d.device_id WHERE d.device_id=$1 AND s.user_id=$2", [requested, userId])
    : await query<{ device_id: string }>("SELECT d.device_id FROM devices d JOIN settings s ON s.device_id=d.device_id WHERE s.user_id=$1 ORDER BY d.device_id LIMIT 1", [userId]);
  if (!result.rows[0]) throw new HttpError(404, "Perangkat tidak ditemukan untuk akun ini");
  return result.rows[0].device_id;
}

export async function deviceStatus(deviceId: string) {
  const result = await query<{ device_id: string; name: string; last_seen: Date | null }>("SELECT device_id, name, last_seen FROM devices WHERE device_id=$1", [deviceId]);
  const device = result.rows[0];
  if (!device) throw new HttpError(404, "Perangkat tidak ditemukan");
  const lastSeen = device.last_seen ? new Date(device.last_seen) : null;
  return { device_id: device.device_id, name: device.name, is_online: Boolean(lastSeen && Date.now() - lastSeen.getTime() <= env.onlineThresholdSeconds * 1000), last_seen: lastSeen?.toISOString() ?? null };
}
