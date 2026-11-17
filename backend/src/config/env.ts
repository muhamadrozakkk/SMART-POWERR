import "dotenv/config";

const productionCorsOrigins = ["https://www.smartpower.web.id", "https://smartpower.web.id"];
const configuredCorsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const developmentCorsOrigins = process.env.NODE_ENV === "production"
  ? []
  : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  deviceApiKey: process.env.DEVICE_API_KEY ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  corsOrigins: [...new Set([...productionCorsOrigins, ...configuredCorsOrigins, ...developmentCorsOrigins])],
  timezone: process.env.TZ ?? "Asia/Jakarta",
  developerEmail: process.env.DEVELOPER_EMAIL?.trim() ?? "",
  developerPassword: process.env.DEVELOPER_PASSWORD ?? "",
  onlineThresholdSeconds: Number(process.env.ONLINE_THRESHOLD_SECONDS ?? 120),
  notificationCooldownSeconds: Number(process.env.NOTIFICATION_COOLDOWN_SECONDS ?? 600),
  frontendUrl: process.env.FRONTEND_URL ?? "https://www.smartpower.web.id",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  smtpFrom: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "",
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiApiUrl: process.env.AI_API_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  aiModel: process.env.AI_MODEL ?? "gemini-3.5-flash-lite",
};

export function requireConfig(name: "DATABASE_URL" | "DEVICE_API_KEY" | "JWT_SECRET") {
  const value = name === "DATABASE_URL" ? env.databaseUrl : name === "DEVICE_API_KEY" ? env.deviceApiKey : env.jwtSecret;
  if (!value) throw new Error(`${name} belum dikonfigurasi`);
  return value;
}
