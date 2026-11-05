import { env } from "../config/env.js";
import { query, transaction } from "../db/pool.js";
import { HttpError } from "../utils/errors.js";
import { jakartaParts, consumptionFromCumulative } from "../utils/energy.js";
import type { ReadingInput } from "../utils/validation.js";
import { createWithCooldown } from "./notificationService.js";

export type Reading = { device_id: string; timestamp: string; voltage: number; current: number; power: number; energy: number; frequency: number; power_factor: number };

function map(row: Record<string, unknown>): Reading { return { device_id: String(row.device_id), timestamp: new Date(row.ts as string | Date).toISOString(), voltage: Number(row.voltage), current: Number(row.current), power: Number(row.power), energy: Number(row.energy), frequency: Number(row.frequency), power_factor: Number(row.power_factor) }; }

export async function saveReading(input: ReadingInput) {
  const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();
  if (Math.abs(Date.now() - timestamp.getTime()) > 24 * 60 * 60 * 1000) console.warn(`Timestamp pembacaan jauh dari waktu server: ${input.device_id}`);
  await transaction(async (client) => {
    await client.query("INSERT INTO devices(device_id, name, last_seen) VALUES($1, $2, $3) ON CONFLICT(device_id) DO UPDATE SET last_seen=EXCLUDED.last_seen", [input.device_id, "Smart Power Web", timestamp]);
    await client.query("INSERT INTO settings(device_id, tariff_class, tariff_per_kwh, power_limit_w, daily_cost_limit_rp) VALUES($1, 'CUSTOM', 0, 1500, 250000) ON CONFLICT(device_id) DO NOTHING", [input.device_id]);
    await client.query("INSERT INTO readings(device_id, ts, voltage, current, power, energy, frequency, power_factor) VALUES($1,$2,$3,$4,$5,$6,$7,$8)", [input.device_id, timestamp, input.voltage, input.current, input.power, input.energy, input.frequency, input.power_factor]);
  });
  const setting = await query<{ power_limit_w: number }>("SELECT power_limit_w FROM settings WHERE device_id=$1", [input.device_id]);
  if (setting.rows[0] && input.power > Number(setting.rows[0].power_limit_w)) await createWithCooldown(input.device_id, "power_limit", input.power, Number(setting.rows[0].power_limit_w));
  return { ok: true };
}

export async function latestReading(deviceId: string) {
  const result = await query("SELECT device_id, ts, voltage, current, power, energy, frequency, power_factor FROM readings WHERE device_id=$1 ORDER BY ts DESC LIMIT 1", [deviceId]);
  if (!result.rows[0]) throw new HttpError(404, "Belum ada pembacaan untuk perangkat ini");
  return map(result.rows[0]);
}

export async function readings(deviceId: string, from?: string, to?: string, interval?: "hour" | "day") {
  const values: unknown[] = [deviceId];
  const conditions = ["device_id=$1"];
  if (from) { if (Number.isNaN(Date.parse(from))) throw new HttpError(400, "Parameter from tidak valid"); values.push(new Date(from)); conditions.push(`ts >= $${values.length}`); }
  if (to) { if (Number.isNaN(Date.parse(to))) throw new HttpError(400, "Parameter to tidak valid"); values.push(new Date(to)); conditions.push(`ts <= $${values.length}`); }
  values.push(5000);
  const result = await query(`SELECT device_id, ts, voltage, current, power, energy, frequency, power_factor FROM readings WHERE ${conditions.join(" AND ")} ORDER BY ts ASC LIMIT $${values.length}`, values);
  const rows = result.rows.map(map);
  if (!interval) return rows;
  const groups = new Map<string, Reading[]>();
  for (const row of rows) { const parts = jakartaParts(new Date(row.timestamp)); const key = interval === "hour" ? `${parts.year}-${parts.month}-${parts.day}-${parts.hour}` : `${parts.year}-${parts.month}-${parts.day}`; groups.set(key, [...(groups.get(key) ?? []), row]); }
  return [...groups.entries()].map(([key, group]) => { const first = group[0]; const parts = key.split("-").map(Number); const timestamp = interval === "hour" ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3] + 7)).toISOString() : new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 7)).toISOString(); return { device_id: deviceId, timestamp, voltage: average(group.map((item) => item.voltage)), current: average(group.map((item) => item.current)), power: average(group.map((item) => item.power)), energy: consumptionFromCumulative(group.map((item) => ({ ts: new Date(item.timestamp), energy: item.energy }))), frequency: average(group.map((item) => item.frequency)), power_factor: average(group.map((item) => item.power_factor)), first_energy: first.energy }; });
}

function average(values: number[]) { return Number((values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)).toFixed(4)); }
