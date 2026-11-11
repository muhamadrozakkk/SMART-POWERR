import { env } from "../config/env.js";
import { query } from "../db/pool.js";
import { cooldownElapsed } from "../utils/cooldown.js";

export type NotificationType = "power_limit" | "current_limit" | "cost_limit" | "device_offline";

export async function createWithCooldown(deviceId: string, type: NotificationType, value: number, limitValue: number) {
  const recent = await query<{ created_at: Date }>("SELECT created_at FROM notifications WHERE device_id=$1 AND type=$2 ORDER BY created_at DESC LIMIT 1", [deviceId, type]);
  if (recent.rows[0] && !cooldownElapsed(new Date(recent.rows[0].created_at), new Date(), env.notificationCooldownSeconds)) return false;
  await query("INSERT INTO notifications(device_id, type, value, limit_value) VALUES($1, $2, $3, $4)", [deviceId, type, value, limitValue]);
  return true;
}

export async function listNotifications(userId: number, unreadOnly = false) {
  const result = await query("SELECT n.id, n.device_id, n.type, n.value, n.limit_value AS limit, n.created_at, n.is_read FROM notifications n JOIN settings s ON s.device_id=n.device_id WHERE s.user_id=$1 AND ($2=false OR n.is_read=false) ORDER BY n.created_at DESC LIMIT 100", [userId, unreadOnly]);
  return result.rows;
}

export async function markNotificationRead(userId: number, id: number) {
  const result = await query("UPDATE notifications n SET is_read=true FROM settings s WHERE n.id=$1 AND s.device_id=n.device_id AND s.user_id=$2 RETURNING n.id, n.is_read", [id, userId]);
  return result.rows[0] ?? null;
}

export async function checkOfflineDevices() {
  const result = await query<{ device_id: string; last_seen: Date | null }>("SELECT device_id, last_seen FROM devices WHERE last_seen IS NULL OR last_seen < NOW() - ($1 * INTERVAL '1 second')", [env.onlineThresholdSeconds]);
  for (const device of result.rows) await createWithCooldown(device.device_id, "device_offline", device.last_seen ? Math.floor((Date.now() - new Date(device.last_seen).getTime()) / 1000) : env.onlineThresholdSeconds, env.onlineThresholdSeconds);
}
