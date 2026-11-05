import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env, requireConfig } from "../config/env.js";
import { query } from "../db/pool.js";
import { HttpError } from "../utils/errors.js";

export type AuthUser = { id: number; email: string; name: string };

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
