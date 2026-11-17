import type { DeviceStatus } from "@/types/energy";
import { formatWibDateTime } from "@/lib/datetime";

export type Reading = { device_id: string; timestamp: string; voltage: number; current: number; power: number; energy: number; frequency: number; power_factor: number };
export type Settings = { device_id: string; tariff_class: string; tariff_per_kwh: number; power_limit_w: number; max_current_limit_a: number; daily_energy_limit_kwh: number; daily_cost_limit_rp: number };
export type CostSummary = { device_id: string; tariff_per_kwh: number; today: { energy_kwh: number; cost_rp: number }; month: { energy_kwh: number; cost_rp: number }; projection: { energy_kwh: number; cost_rp: number } };
export type ApiNotification = { id: number; device_id: string; type: "power_limit" | "current_limit" | "energy_limit" | "cost_limit" | "device_offline"; value: number; limit: number; created_at: string; is_read: boolean };
export type ApiDeviceStatus = { device_id: string; name: string; is_online: boolean; last_seen: string | null };

export function notificationLabel(type: ApiNotification["type"]) {
  const labels: Record<ApiNotification["type"], string> = {
    power_limit: "Batas daya terlampaui",
    current_limit: "Batas arus terlampaui",
    energy_limit: "Batas energi harian terlampaui",
    cost_limit: "Batas biaya harian terlampaui",
    device_offline: "Perangkat tidak terhubung",
  };
  return labels[type] ?? "Peringatan perangkat";
}

export class ApiRequestError extends Error { constructor(message: string, public readonly status: number) { super(message); this.name = "ApiRequestError"; } }

export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) throw new ApiRequestError("NEXT_PUBLIC_API_URL belum dikonfigurasi", 0);
  const token = typeof window !== "undefined" ? window.localStorage.getItem("spw_access_token") : null;
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (response.status === 401 && typeof window !== "undefined") { window.localStorage.removeItem("spw_access_token"); document.cookie = "spw_auth=; path=/; max-age=0"; document.cookie = "spw_role=; path=/; max-age=0"; window.dispatchEvent(new CustomEvent("spw:unauthorized")); }
  if (!response.ok) throw new ApiRequestError(payload.error ?? `API request gagal (${response.status})`, response.status);
  return payload;
}

export function isApiConfigured() { return Boolean(process.env.NEXT_PUBLIC_API_URL); }
export function toDeviceStatus(status: ApiDeviceStatus): DeviceStatus { return { name: status.name, deviceId: status.device_id, online: status.is_online, lastUpdate: status.last_seen ? formatWibDateTime(status.last_seen) : "Belum ada data", wifi: status.is_online ? "Terhubung" : "Terputus", sensor: "PZEM-004T", lcd: status.is_online ? "Aktif" : "Tidak aktif" }; }
