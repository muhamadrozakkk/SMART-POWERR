import { env } from "../config/env.js";
import { query, transaction } from "../db/pool.js";
import { HttpError } from "../utils/errors.js";
import { jakartaStartOfDay, consumptionFromCumulative } from "../utils/energy.js";
import type { ReadingInput } from "../utils/validation.js";
import { createWithCooldown } from "./notificationService.js";

export type Reading = { device_id: string; timestamp: string; voltage: number; current: number; power: number; energy: number; frequency: number; power_factor: number };

function map(row: Record<string, unknown>): Reading { return { device_id: String(row.device_id), timestamp: new Date(row.ts as string | Date).toISOString(), voltage: Number(row.voltage), current: Number(row.current), power: Number(row.power), energy: Number(row.energy), frequency: Number(row.frequency), power_factor: Number(row.power_factor) }; }

export async function saveReading(input: ReadingInput) {
  const timestamp = input.timestamp ? new Date(input.timestamp) : new Date();
  if (Math.abs(Date.now() - timestamp.getTime()) > 24 * 60 * 60 * 1000) console.warn(`Timestamp pembacaan jauh dari waktu server: ${input.device_id}`);
  await transaction(async (client) => {
    await client.query("INSERT INTO devices(device_id, name, last_seen) VALUES($1, $2, $3) ON CONFLICT(device_id) DO UPDATE SET last_seen=EXCLUDED.last_seen", [input.device_id, "Smart Power Web", timestamp]);
    await client.query("INSERT INTO settings(device_id, tariff_class, tariff_per_kwh, power_limit_w, daily_cost_limit_rp) VALUES($1, 'R1_1300VA', 1444.70, 1500, 250000) ON CONFLICT(device_id) DO NOTHING", [input.device_id]);
    await client.query("INSERT INTO readings(device_id, ts, voltage, current, power, energy, frequency, power_factor) VALUES($1,$2,$3,$4,$5,$6,$7,$8)", [input.device_id, timestamp, input.voltage, input.current, input.power, input.energy, input.frequency, input.power_factor]);
  });
  const setting = await query<{ power_limit_w: number; max_current_limit_a: number; daily_energy_limit_kwh: number; daily_cost_limit_rp: number; tariff_per_kwh: number }>("SELECT power_limit_w, max_current_limit_a, daily_energy_limit_kwh, daily_cost_limit_rp, tariff_per_kwh FROM settings WHERE device_id=$1", [input.device_id]);
  if (setting.rows[0]) {
    const powerLimit = Number(setting.rows[0].power_limit_w);
    const currentLimit = Number(setting.rows[0].max_current_limit_a);
    const powerAlert = powerLimit > 0 && input.power > powerLimit ? await createWithCooldown(input.device_id, "power_limit", input.power, powerLimit) : false;
    const currentAlert = currentLimit > 0 && input.current > currentLimit ? await createWithCooldown(input.device_id, "current_limit", input.current, currentLimit) : false;
    const todayResult = await query<{ ts: Date; energy: number }>("SELECT ts, energy FROM readings WHERE device_id=$1 AND ts >= $2 AND ts <= $3 ORDER BY ts ASC", [input.device_id, jakartaStartOfDay(timestamp), timestamp]);
    const todayEnergy = consumptionFromCumulative(todayResult.rows.map((row) => ({ ts: new Date(row.ts), energy: Number(row.energy) })));
    const energyLimit = Number(setting.rows[0].daily_energy_limit_kwh);
    const dailyCostLimit = Number(setting.rows[0].daily_cost_limit_rp);
    const estimatedCost = todayEnergy * Number(setting.rows[0].tariff_per_kwh);
    const energyAlert = energyLimit > 0 && todayEnergy > energyLimit ? await createWithCooldown(input.device_id, "energy_limit", todayEnergy, energyLimit) : false;
    const costAlert = dailyCostLimit > 0 && estimatedCost > dailyCostLimit ? await createWithCooldown(input.device_id, "cost_limit", estimatedCost, dailyCostLimit) : false;
    const reason = powerAlert ? "power_limit" : currentAlert ? "current_limit" : energyAlert ? "energy_limit" : costAlert ? "cost_limit" : null;
    if (reason) await query("INSERT INTO hardware_commands(device_id,command,payload) VALUES($1,'buzzer',$2::jsonb)", [input.device_id, JSON.stringify({ enabled: true, duration_ms: 5000, reason })]);
  }
  return { ok: true };
}

export async function latestReading(deviceId: string) {
  const result = await query("SELECT device_id, ts, voltage, current, power, energy, frequency, power_factor FROM readings WHERE device_id=$1 ORDER BY ts DESC LIMIT 1", [deviceId]);
  if (!result.rows[0]) throw new HttpError(404, "Belum ada pembacaan untuk perangkat ini");
  return map(result.rows[0]);
}

export async function readings(deviceId: string, from?: string, to?: string, interval?: "hour" | "day" | "week" | "month") {
  const values: unknown[] = [deviceId];
  const conditions = ["device_id=$1"];
  if (from) { if (Number.isNaN(Date.parse(from))) throw new HttpError(400, "Parameter from tidak valid"); values.push(new Date(from)); conditions.push(`ts >= $${values.length}`); }
  if (to) { if (Number.isNaN(Date.parse(to))) throw new HttpError(400, "Parameter to tidak valid"); values.push(new Date(to)); conditions.push(`ts <= $${values.length}`); }
  if (interval) {
    const bucket = interval === "hour" ? "hour" : interval === "day" ? "day" : interval === "week" ? "week" : "month";
    const toParam = to ? `$${values.length}` : null;
    const rangeConditions = [from ? "ts >= $2" : null, toParam ? `ts <= ${toParam}` : null].filter(Boolean).join(" AND ");
    const predecessor = from ? `, predecessor AS (SELECT device_id, ts, voltage, current, power, energy, frequency, power_factor FROM readings WHERE device_id=$1 AND ts < $2 ORDER BY ts DESC LIMIT 1)` : "";
    const unionPredecessor = from ? "UNION ALL SELECT * FROM predecessor" : "";
    const result = await query<{ timestamp: Date; voltage: number; current: number; power: number; energy: number; frequency: number; power_factor: number }>(
      `WITH scoped AS (SELECT device_id, ts, voltage, current, power, energy, frequency, power_factor FROM readings WHERE ${conditions.join(" AND ")})${predecessor}, combined AS (SELECT * FROM scoped ${unionPredecessor}), deltas AS (SELECT *, energy - LAG(energy) OVER (ORDER BY ts) AS energy_delta FROM combined), grouped AS (SELECT date_trunc('${bucket}', ts AT TIME ZONE 'Asia/Jakarta') AS local_bucket, voltage, current, power, energy, frequency, power_factor, energy_delta, ts FROM deltas${rangeConditions ? ` WHERE ${rangeConditions}` : ""}) SELECT (local_bucket AT TIME ZONE 'Asia/Jakarta') AS timestamp, AVG(voltage) AS voltage, AVG(current) AS current, AVG(power) AS power, COALESCE(SUM(GREATEST(energy_delta, 0)), 0) AS energy, AVG(frequency) AS frequency, AVG(power_factor) AS power_factor FROM grouped GROUP BY local_bucket ORDER BY local_bucket ASC`,
      values,
    );
    return result.rows.map((row) => ({ device_id: deviceId, timestamp: new Date(row.timestamp).toISOString(), voltage: Number(row.voltage), current: Number(row.current), power: Number(row.power), energy: Number(row.energy), frequency: Number(row.frequency), power_factor: Number(row.power_factor) }));
  }
  values.push(5000);
  const result = await query(`SELECT * FROM (SELECT device_id, ts, voltage, current, power, energy, frequency, power_factor FROM readings WHERE ${conditions.join(" AND ")} ORDER BY ts DESC LIMIT $${values.length}) recent ORDER BY ts ASC`, values);
  return result.rows.map(map);
}
