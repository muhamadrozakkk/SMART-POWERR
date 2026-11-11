import { access, readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { database } from "./pool.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
let migrationsDir = path.join(currentDir, "migrations");
try { await access(migrationsDir); } catch { migrationsDir = path.resolve(currentDir, "../../src/db/migrations"); }
const db = database();
await db.query("CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
const applied = new Set((await db.query<{ filename: string }>("SELECT filename FROM schema_migrations")).rows.map((row) => row.filename));
const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
for (const file of files) {
  if (applied.has(file)) continue;
  const client = await db.connect();
  try { await client.query("BEGIN"); await client.query(await readFile(path.join(migrationsDir, file), "utf8")); await client.query("INSERT INTO schema_migrations(filename) VALUES($1)", [file]); await client.query("COMMIT"); console.log(`Migration berhasil: ${file}`); } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}
await db.end();
