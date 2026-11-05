import { query } from "../db/pool.js";
import { jakartaStartOfDay, jakartaStartOfMonth, daysInJakartaMonth, consumptionFromCumulative } from "../utils/energy.js";
import { resolveDeviceForUser } from "./deviceService.js";

export async function costSummary(userId: number, requestedDevice?: string) {
  const deviceId = await resolveDeviceForUser(userId, requestedDevice);
  const settingResult = await query<{ tariff_per_kwh: number }>("SELECT tariff_per_kwh FROM settings WHERE device_id=$1", [deviceId]);
  const tariff = Number(settingResult.rows[0]?.tariff_per_kwh ?? 0);
  const startMonth = jakartaStartOfMonth();
  const result = await query<{ ts: Date; energy: number }>("SELECT ts, energy FROM readings WHERE device_id=$1 AND ts >= $2 ORDER BY ts ASC", [deviceId, startMonth]);
  const readings = result.rows.map((row) => ({ ts: new Date(row.ts), energy: Number(row.energy) }));
  const monthEnergy = consumptionFromCumulative(readings);
  const startDay = jakartaStartOfDay();
  const dayEnergy = consumptionFromCumulative(readings.filter((row) => row.ts >= startDay));
  const now = new Date();
  const elapsedDays = Math.max(1, Math.ceil((now.getTime() - startMonth.getTime()) / (24 * 60 * 60 * 1000)));
  const projection = monthEnergy / elapsedDays * daysInJakartaMonth(now);
  return { device_id: deviceId, tariff_per_kwh: tariff, today: { energy_kwh: dayEnergy, cost_rp: Number((dayEnergy * tariff).toFixed(2)) }, month: { energy_kwh: monthEnergy, cost_rp: Number((monthEnergy * tariff).toFixed(2)) }, projection: { energy_kwh: Number(projection.toFixed(6)), cost_rp: Number((projection * tariff).toFixed(2)) } };
}
