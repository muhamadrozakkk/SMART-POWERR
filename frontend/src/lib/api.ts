import { alarmData, deviceStatus as mockDevice, energyMetrics, powerHistory } from "@/data/dummyData";
import type { DeviceStatus } from "@/types/energy";

export type Reading = { device_id: string; timestamp: string; voltage: number; current: number; power: number; energy: number; frequency: number; power_factor: number };
export type Settings = { device_id: string; tariff_class: string; tariff_per_kwh: number; power_limit_w: number; max_current_limit_a: number; daily_cost_limit_rp: number };
export type CostSummary = { device_id: string; tariff_per_kwh: number; today: { energy_kwh: number; cost_rp: number }; month: { energy_kwh: number; cost_rp: number }; projection: { energy_kwh: number; cost_rp: number } };
export type ApiNotification = { id: number; device_id: string; type: "power_limit" | "current_limit" | "cost_limit" | "device_offline"; value: number; limit: number; created_at: string; is_read: boolean };
export type ApiDeviceStatus = { device_id: string; name: string; is_online: boolean; last_seen: string | null };

export class ApiRequestError extends Error { constructor(message: string, public readonly status: number) { super(message); this.name = "ApiRequestError"; } }

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const hasConfiguredApi = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL);
// Data mock hanya dipakai jika diminta secara eksplisit; selain itu request selalu ke backend.
const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
function mockReading(): Reading { return { device_id: "ESP32-001", timestamp: new Date().toISOString(), voltage: Number(energyMetrics[2].value), current: Number(energyMetrics[1].value), power: Number(energyMetrics[0].value), energy: Number(energyMetrics[4].value), frequency: 50.01, power_factor: Number(energyMetrics[3].value) }; }
function mockSettings(): Settings { return { device_id: "ESP32-001", tariff_class: "R1_1300VA", tariff_per_kwh: 1444.7, power_limit_w: 2200, max_current_limit_a: 10, daily_cost_limit_rp: 250000 }; }
function mockCost(): CostSummary { const reading = mockReading(); return { device_id: reading.device_id, tariff_per_kwh: 0, today: { energy_kwh: reading.energy, cost_rp: 0 }, month: { energy_kwh: 112.45, cost_rp: 0 }, projection: { energy_kwh: 140, cost_rp: 0 } }; }

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (useMock) return mockRequest<T>(path, init);
  const token = typeof window !== "undefined" ? window.localStorage.getItem("spw_access_token") : null;
  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => ({})) as T & { error?: string };
  if (response.status === 401 && typeof window !== "undefined") { window.localStorage.removeItem("spw_access_token"); document.cookie = "spw_demo_auth=; path=/; max-age=0"; window.dispatchEvent(new CustomEvent("spw:unauthorized")); }
  if (!response.ok) throw new ApiRequestError(payload.error ?? `API request gagal (${response.status})`, response.status);
  return payload;
}

async function mockRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const reading = mockReading();
  if (path.startsWith("/api/readings/latest")) return reading as T;
  if (path.startsWith("/api/readings")) return { data: powerHistory.map((item, index) => ({ ...reading, timestamp: new Date(Date.now() - (powerHistory.length - index) * 3600000).toISOString(), voltage: item.voltage, current: item.current, power: item.power, energy: item.energy })) } as T;
  if (path.startsWith("/api/cost/summary")) return mockCost() as T;
  if (path.startsWith("/api/settings")) return (init?.method === "PUT" || init?.method === "PATCH" ? { ...mockSettings(), ...(JSON.parse(String(init.body ?? "{}")) as Partial<Settings>) } : mockSettings()) as T;
  if (path.startsWith("/api/notifications")) return { data: alarmData.map((_, index) => ({ id: index + 1, device_id: "ESP32-001", type: "power_limit", value: 1850, limit: 1500, created_at: new Date().toISOString(), is_read: false })) } as T;
  if (path === "/api/device") return { data: { device_id: mockDevice.deviceId, name: mockDevice.name, is_online: true, last_seen: new Date().toISOString() }, simulation: true } as T;
  if (path.startsWith("/api/devices/")) return { device_id: mockDevice.deviceId, name: mockDevice.name, is_online: true, last_seen: new Date().toISOString() } as T;
  if (path === "/api/user/relay") return { state: init?.method === "PUT" ? (JSON.parse(String(init.body ?? "{}")) as { state: boolean }).state : true } as T;
  if (path === "/api/auth/login") return { token: "mock-token", user: { id: 1, email: "rozak@example.com", name: "Rozak", role: "USER" } } as T;
  throw new Error("Endpoint mock belum tersedia");
}

export function isApiConfigured() { return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL); }
export function isMockMode() { return useMock; }
export function toDeviceStatus(status: ApiDeviceStatus): DeviceStatus { return { name: status.name, deviceId: status.device_id, online: status.is_online, lastUpdate: status.last_seen ? new Date(status.last_seen).toLocaleString("id-ID") : "Belum ada data", wifi: status.is_online ? "Terhubung" : "Terputus", sensor: "PZEM-004T", lcd: status.is_online ? "Aktif" : "Tidak aktif" }; }
