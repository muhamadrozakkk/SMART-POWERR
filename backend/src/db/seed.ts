import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { database } from "./pool.js";

const db = database();
const passwordHash = await bcrypt.hash(env.demoPassword, 12);
const user = await db.query<{ id: number }>("INSERT INTO users(email, password_hash, name) VALUES($1, $2, $3) ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name, password_hash=EXCLUDED.password_hash RETURNING id", [env.demoEmail, passwordHash, "Rozak"]);
await db.query("INSERT INTO devices(device_id, name) VALUES($1, $2) ON CONFLICT(device_id) DO NOTHING", ["ESP32-001", "Smart Power Web"]);
await db.query("INSERT INTO settings(device_id, user_id, tariff_class, tariff_per_kwh, power_limit_w, daily_cost_limit_rp) VALUES($1, $2, $3, $4, $5, $6) ON CONFLICT(device_id) DO NOTHING", ["ESP32-001", user.rows[0].id, "CUSTOM", 0, 1500, 250000]);
console.log(`Seed berhasil untuk ${env.demoEmail} dan ESP32-001`);
await db.end();
