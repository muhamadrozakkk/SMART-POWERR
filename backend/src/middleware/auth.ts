import type { NextFunction, Request, Response } from "express";
import { verifyToken, type AuthUser } from "../services/authService.js";
import { HttpError } from "../utils/errors.js";

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
