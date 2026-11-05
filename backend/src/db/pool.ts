import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { env } from "../config/env.js";

export const pool = env.databaseUrl ? new Pool({ connectionString: env.databaseUrl, ssl: env.nodeEnv === "production" ? { rejectUnauthorized: false } : undefined, max: 10 }) : null;

export function database() {
  if (!pool) throw new Error("DATABASE_URL belum dikonfigurasi");
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []): Promise<QueryResult<T>> {
  return database().query<T>(text, values);
}

export async function transaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await database().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
