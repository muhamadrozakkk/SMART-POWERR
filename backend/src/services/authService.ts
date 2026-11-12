import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env, requireConfig } from "../config/env.js";
import { query } from "../db/pool.js";
import { HttpError } from "../utils/errors.js";

export type AuthUser = { id: number; email: string; name: string; role: "DEVELOPER" | "USER" };

function signUser(user: AuthUser) {
  const token = jwt.sign({ id: user.id, sub: String(user.id), email: user.email, role: user.role }, requireConfig("JWT_SECRET"), { expiresIn: "8h" });
  return { token, user: { ...user, role: user.role } };
}

export async function register(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  if (!normalizedName || !normalizedEmail || !password) throw new HttpError(400, "Nama, email, dan password wajib diisi");
  if (password.length < 8) throw new HttpError(400, "Password minimal 8 karakter");

  const passwordHash = await bcrypt.hash(password, 12);
  let user: AuthUser;
  try {
    const result = await query<{ id: number; email: string; name: string; role: "USER" }>(
      "INSERT INTO users(email, password_hash, name) VALUES($1, $2, $3) RETURNING id, email, name, role",
      [normalizedEmail, passwordHash, normalizedName],
    );
    user = result.rows[0];
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      throw new HttpError(409, "Email sudah terdaftar");
    }
    throw error;
  }

  return signUser(user);
}

export async function login(email: string, password: string) {
  const result = await query<{ id: number; email: string; name: string; role: "DEVELOPER" | "USER"; password_hash: string }>("SELECT id, email, name, role, password_hash FROM users WHERE lower(email)=lower($1)", [email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new HttpError(401, "Email atau password salah");
  return signUser(user);
}

export function verifyToken(token: string): AuthUser {
  try {
    const payload = jwt.verify(token, requireConfig("JWT_SECRET")) as jwt.JwtPayload;
    const id = Number(payload.id ?? payload.sub);
    if (!Number.isInteger(id) || typeof payload.email !== "string" || !["DEVELOPER", "USER"].includes(String(payload.role))) throw new Error("Token tidak lengkap");
    return { id, email: payload.email, name: typeof payload.name === "string" ? payload.name : payload.email, role: payload.role as AuthUser["role"] };
  } catch {
    throw new HttpError(401, "Token tidak valid atau sudah kedaluwarsa");
  }
}

export async function requestPasswordReset(email: string) {
  const token = (await import("node:crypto")).randomBytes(32).toString("hex");
  const tokenHash = (await import("node:crypto")).createHash("sha256").update(token).digest("hex");
  const result = await query<{ email: string; name: string }>("UPDATE users SET reset_password_token_hash=$2, reset_password_expires=NOW() + INTERVAL '20 minutes' WHERE lower(email)=lower($1) RETURNING email, name", [email.trim(), tokenHash]);
  if (result.rows[0]) return { token, user: result.rows[0] };
  return null;
}

export async function resetPassword(token: string, newPassword: string) {
  if (newPassword.length < 8) throw new HttpError(400, "Password minimal 8 karakter");
  const crypto = await import("node:crypto");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const result = await query("UPDATE users SET password_hash=$2, reset_password_token_hash=NULL, reset_password_expires=NULL WHERE reset_password_token_hash=$1 AND reset_password_expires > NOW() RETURNING id", [tokenHash, passwordHash]);
  if (!result.rowCount) throw new HttpError(400, "Link reset password tidak valid atau sudah kedaluwarsa");
}

export async function ensureDeveloperAccount() {
  const email = env.developerEmail.toLowerCase();
  const password = env.developerPassword;
  if (!email || !password) {
    console.warn("Akun developer tidak dibuat: DEVELOPER_EMAIL dan DEVELOPER_PASSWORD wajib dikonfigurasi.");
    return false;
  }
  if (password.length < 12) {
    console.warn("Akun developer tidak dibuat: DEVELOPER_PASSWORD harus minimal 12 karakter.");
    return false;
  }
  const existing = await query<{ id: number; role: AuthUser["role"] }>("SELECT id, role FROM users WHERE lower(email)=lower($1)", [email]);
  if (existing.rows[0]) {
    if (existing.rows[0].role !== "DEVELOPER") await query("UPDATE users SET role='DEVELOPER' WHERE id=$1", [existing.rows[0].id]);
    return false;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await query("INSERT INTO users(name, email, password_hash, role) VALUES($1,$2,$3,'DEVELOPER')", ["Developer", email, passwordHash]);
  return true;
}
