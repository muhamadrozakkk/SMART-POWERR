import { query } from "../db/pool.js";
import { jakartaStartOfDay, jakartaStartOfMonth, daysInJakartaMonth } from "../utils/energy.js";
import { resolveDeviceForUser } from "./deviceService.js";

type MeterRow = { ts: Date; energy: number; tariff_per_kwh: number };
function usageSince(rows: MeterRow[], start: Date) {
  let previous: MeterRow | undefined;
  let energy = 0;
  let cost = 0;
  for (const row of rows) {
    const timestamp = new Date(row.ts);
    if (timestamp < start) { previous = row; continue; }
    // If this is the first-ever stored meter sample, its counter is the best available baseline.
    const delta = previous ? row.energy - previous.energy : row.energy;
    if (delta >= 0) { energy += delta; cost += delta * row.tariff_per_kwh; }
    previous = row;
  }
  return { energy_kwh: Number(energy.toFixed(6)), cost_rp: Number(cost.toFixed(2)) };
}

export async function costSummary(userId: number, requestedDevice?: string) {
  const deviceId = await resolveDeviceForUser(userId, requestedDevice);
  const settingResult = await query<{ tariff_per_kwh: number }>("SELECT tariff_per_kwh FROM settings WHERE device_id=$1", [deviceId]);
  const configuredTariff = Number(settingResult.rows[0]?.tariff_per_kwh ?? 0);
  const startMonth = jakartaStartOfMonth();
  const result = await query<MeterRow>(
    `WITH previous AS (SELECT ts,energy,tariff_per_kwh FROM readings WHERE device_id=$1 AND ts<$2 ORDER BY ts DESC LIMIT 1), period AS (SELECT ts,energy,tariff_per_kwh FROM readings WHERE device_id=$1 AND ts>=$2) SELECT x.ts,x.energy,COALESCE(x.tariff_per_kwh,$3) AS tariff_per_kwh FROM (SELECT * FROM previous UNION ALL SELECT * FROM period) x ORDER BY x.ts ASC`,
    [deviceId, startMonth, configuredTariff],
  );
  const meterRows = result.rows.map((row) => ({ ts: new Date(row.ts), energy: Number(row.energy), tariff_per_kwh: Number(row.tariff_per_kwh) }));
  const latest = meterRows.at(-1);
  const tariff = latest?.tariff_per_kwh ?? configuredTariff;
  const startDay = jakartaStartOfDay();
  const month = usageSince(meterRows, startMonth);
  const today = usageSince(meterRows, startDay);
  const meterEnergy = latest?.energy ?? 0;
  const now = new Date();
  const elapsedDays = Math.max(1, Math.ceil((now.getTime() - startMonth.getTime()) / (24 * 60 * 60 * 1000)));
  const projectionEnergy = month.energy_kwh / elapsedDays * daysInJakartaMonth(now);
  const projectionCost = month.cost_rp / elapsedDays * daysInJakartaMonth(now);
  return {
    device_id: deviceId,
    tariff_per_kwh: tariff,
    meter: { energy_kwh: meterEnergy, cost_rp: Number((meterEnergy * tariff).toFixed(2)) },
    today,
    month,
    projection: { energy_kwh: Number(projectionEnergy.toFixed(6)), cost_rp: Number(projectionCost.toFixed(2)) },
  };
}
