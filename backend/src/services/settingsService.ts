import { query } from "../db/pool.js";
import { HttpError } from "../utils/errors.js";
import { settingsInput } from "../utils/validation.js";
import { resolveDeviceForUser } from "./deviceService.js";
import { PLN_TARIFFS } from "../config/tariffs.js";

export type Settings = { device_id: string; tariff_class: string; tariff_per_kwh: number; power_limit_w: number; max_current_limit_a: number; daily_energy_limit_kwh: number; daily_cost_limit_rp: number };

function map(row: Record<string, unknown>): Settings { return { device_id: String(row.device_id), tariff_class: String(row.tariff_class), tariff_per_kwh: Number(row.tariff_per_kwh), power_limit_w: Number(row.power_limit_w), max_current_limit_a: Number(row.max_current_limit_a), daily_energy_limit_kwh: Number(row.daily_energy_limit_kwh), daily_cost_limit_rp: Number(row.daily_cost_limit_rp) }; }

export async function getSettings(userId: number, requestedDevice?: string) {
  const deviceId = await resolveDeviceForUser(userId, requestedDevice);
  const result = await query("SELECT device_id, tariff_class, tariff_per_kwh, power_limit_w, max_current_limit_a, daily_energy_limit_kwh, daily_cost_limit_rp FROM settings WHERE device_id=$1", [deviceId]);
  if (!result.rows[0]) throw new HttpError(404, "Settings perangkat belum tersedia");
  return map(result.rows[0]);
}

export async function updateSettings(userId: number, requestedDevice: string | undefined, body: unknown) {
  const deviceId = await resolveDeviceForUser(userId, requestedDevice);
  const input = settingsInput(body);
  const tariffClass = typeof input.tariff_class === "string" ? input.tariff_class : undefined;
  if (tariffClass && tariffClass !== "CUSTOM" && !(tariffClass in PLN_TARIFFS)) throw new HttpError(400, "Golongan tarif tidak dikenal");
  if (tariffClass && tariffClass !== "CUSTOM") input.tariff_per_kwh = PLN_TARIFFS[tariffClass as keyof typeof PLN_TARIFFS].tariff_per_kwh;
  const fields = Object.keys(input);
  if (!fields.length) return getSettings(userId, deviceId);
  const allowed = new Set(["tariff_class", "tariff_per_kwh", "power_limit_w", "max_current_limit_a", "daily_energy_limit_kwh", "daily_cost_limit_rp"]);
  if (fields.some((field) => !allowed.has(field))) throw new HttpError(400, "Field settings tidak dikenal");
  const assignments = fields.map((field, index) => `${field}=$${index + 2}`).join(", ");
  const values = fields.map((field) => input[field]);
  const result = await query(`UPDATE settings SET ${assignments}, updated_at=NOW() WHERE device_id=$1 RETURNING device_id, tariff_class, tariff_per_kwh, power_limit_w, max_current_limit_a, daily_energy_limit_kwh, daily_cost_limit_rp`, [deviceId, ...values]);
  if (input.tariff_class !== undefined || input.power_limit_w !== undefined) {
    await query("UPDATE users SET tariff_group=COALESCE($2,tariff_group), max_power_limit=COALESCE($3,max_power_limit) WHERE id=$1", [userId, input.tariff_class ?? null, input.power_limit_w ?? null]);
  }
  return map(result.rows[0]);
}
