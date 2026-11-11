import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AuthUser } from "../services/authService.js";
import { HttpError } from "../utils/errors.js";
import { query } from "../db/pool.js";

declare global {
  namespace Express { interface Request { user?: AuthUser } }
}

export function requireAuth(request: Request, _response: Response, next: NextFunction) {
  const header = request.header("authorization");
  if (!header?.startsWith("Bearer ")) return next(new HttpError(401, "Authorization Bearer wajib diisi"));
  try { request.user = verifyToken(header.slice(7)); next(); } catch (error) { next(error); }
}

export function userId(request: Request) {
  if (!request.user) throw new HttpError(401, "Sesi pengguna tidak ditemukan");
  return request.user.id;
}

export function requireRole(roles: Array<AuthUser["role"]>) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      if (!request.user) throw new HttpError(401, "Sesi pengguna tidak ditemukan");
      const result = await query<{ role: AuthUser["role"] }>("SELECT role FROM users WHERE id=$1", [request.user.id]);
      const currentRole = result.rows[0]?.role;
      if (!currentRole) throw new HttpError(401, "Akun tidak ditemukan");
      request.user.role = currentRole;
      if (!roles.includes(currentRole)) throw new HttpError(403, "Kamu tidak memiliki akses ke fitur ini");
      next();
    } catch (error) { next(error); }
  };
}
