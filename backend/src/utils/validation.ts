import { HttpError } from "./errors.js";

export type ReadingInput = { device_id: string; timestamp?: string; voltage: number; current: number; power: number; energy: number; frequency: number; power_factor: number; tariff_per_kwh?: number };

export function readingInput(body: unknown): ReadingInput {
  if (!body || typeof body !== "object") throw new HttpError(400, "Body pembacaan harus berupa JSON object");
  const input = body as Record<string, unknown>;
  const fields = ["device_id", "voltage", "current", "power", "energy", "frequency", "power_factor"];
  if (fields.some((field) => input[field] === undefined || input[field] === null || input[field] === "")) throw new HttpError(400, "Field pembacaan belum lengkap", { required: fields });
  if (typeof input.device_id !== "string" || input.device_id.length < 1 || input.device_id.length > 100) throw new HttpError(400, "device_id tidak valid");
  const numbers = ["voltage", "current", "power", "energy", "frequency", "power_factor"];
  if (numbers.some((field) => typeof input[field] !== "number" || !Number.isFinite(input[field]))) throw new HttpError(400, "Nilai pembacaan harus berupa angka");
  const ranges: Record<string, [number, number]> = { voltage: [0, 300], current: [0, 100], power: [0, 30000], energy: [0, 10000000], frequency: [40, 70], power_factor: [0, 1] };
  for (const field of numbers) { const [min, max] = ranges[field]; const value = input[field] as number; if (value < min || value > max) throw new HttpError(400, `${field} berada di luar rentang wajar`, { min, max }); }
  if (input.tariff_per_kwh !== undefined && (typeof input.tariff_per_kwh !== "number" || !Number.isFinite(input.tariff_per_kwh) || input.tariff_per_kwh < 0 || input.tariff_per_kwh > 100000)) throw new HttpError(400, "tariff_per_kwh harus berupa angka antara 0 sampai 100000");
  let timestamp: string | undefined;
  if (input.timestamp !== undefined) {
    if (typeof input.timestamp !== "string" || Number.isNaN(Date.parse(input.timestamp)) || !/(Z|[+-]\d{2}:\d{2})$/i.test(input.timestamp)) {
      throw new HttpError(400, "timestamp harus berupa ISO-8601 dengan zona waktu, contoh 2026-11-17T12:30:00+07:00");
    }
    timestamp = input.timestamp;
  }
  return { device_id: input.device_id, timestamp, voltage: input.voltage as number, current: input.current as number, power: input.power as number, energy: input.energy as number, frequency: input.frequency as number, power_factor: input.power_factor as number, tariff_per_kwh: input.tariff_per_kwh as number | undefined };
}

export function settingsInput(body: unknown) {
  if (!body || typeof body !== "object") throw new HttpError(400, "Body settings harus berupa JSON object");
  const input = body as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  if (input.tariff_class !== undefined) { if (typeof input.tariff_class !== "string" || !input.tariff_class.trim()) throw new HttpError(400, "tariff_class tidak valid"); result.tariff_class = input.tariff_class.trim(); }
  for (const field of ["tariff_per_kwh", "power_limit_w", "max_current_limit_a", "daily_cost_limit_rp", "daily_energy_limit_kwh"]) { if (input[field] !== undefined) { if (typeof input[field] !== "number" || !Number.isFinite(input[field]) || input[field] < 0) throw new HttpError(400, `${field} harus berupa angka tidak negatif`); result[field] = input[field]; } }
  return result;
}
