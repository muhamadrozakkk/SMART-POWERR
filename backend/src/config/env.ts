import "dotenv/config";

const csv = (value: string | undefined, fallback: string) => (value ?? fallback).split(",").map((item) => item.trim()).filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  deviceApiKey: process.env.DEVICE_API_KEY ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  corsOrigins: csv(process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL, "http://localhost:3000"),
  timezone: process.env.TZ ?? "Asia/Jakarta",
  demoEmail: process.env.DEMO_EMAIL ?? "rozak@example.com",
  demoPassword: process.env.DEMO_PASSWORD ?? "smartpower",
  onlineThresholdSeconds: Number(process.env.ONLINE_THRESHOLD_SECONDS ?? 60),
  notificationCooldownSeconds: Number(process.env.NOTIFICATION_COOLDOWN_SECONDS ?? 600),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  smtpFrom: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "",
};

export function requireConfig(name: "DATABASE_URL" | "DEVICE_API_KEY" | "JWT_SECRET") {
  const value = name === "DATABASE_URL" ? env.databaseUrl : name === "DEVICE_API_KEY" ? env.deviceApiKey : env.jwtSecret;
  if (!value) throw new Error(`${name} belum dikonfigurasi`);
  return value;
}
