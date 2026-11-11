import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env, requireConfig } from "../config/env.js";
import { query } from "../db/pool.js";
import { HttpError } from "../utils/errors.js";

export type AuthUser = { id: number; email: string; name: string };

export async function register(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  if (!normalizedName || !normalizedEmail || !password) throw new HttpError(400, "Nama, email, dan password wajib diisi");
  if (password.length < 8) throw new HttpError(400, "Password minimal 8 karakter");

  const passwordHash = await bcrypt.hash(password, 12);
  let user: { id: number; email: string; name: string };
  try {
    const result = await query<{ id: number; email: string; name: string }>(
      "INSERT INTO users(email, password_hash, name) VALUES($1, $2, $3) RETURNING id, email, name",
      [normalizedEmail, passwordHash, normalizedName],
    );
    user = result.rows[0];
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new HttpError(409, "Email sudah terdaftar");
    }
    throw error;
  }

  const token = jwt.sign({ sub: String(user.id), email: user.email, name: user.name }, requireConfig("JWT_SECRET"), { expiresIn: "8h" });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: "Admin" } };
}

export async function login(email: string, password: string) {
  const result = await query<{ id: number; email: string; name: string; password_hash: string }>("SELECT id, email, name, password_hash FROM users WHERE lower(email)=lower($1)", [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new HttpError(401, "Email atau password salah");
  const token = jwt.sign({ sub: String(user.id), email: user.email, name: user.name }, requireConfig("JWT_SECRET"), { expiresIn: "8h" });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: "Admin" } };
}

export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, requireConfig("JWT_SECRET")) as jwt.JwtPayload;
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string") throw new Error("Token tidak lengkap");
    return { id: Number(payload.sub), email: payload.email, name: payload.name };
  } catch {
    throw new HttpError(401, "Token tidak valid atau sudah kedaluwarsa");
  }
}

export const demoCredentials = { email: env.demoEmail, password: env.demoPassword };
