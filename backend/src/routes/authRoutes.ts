import { Router } from "express";
import { login } from "../services/authService.js";
import { HttpError } from "../utils/errors.js";

export const authRoutes = Router();
authRoutes.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body as { email?: unknown; password?: unknown };
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) throw new HttpError(400, "Email dan password wajib diisi");
    response.json(await login(email, password));
  } catch (error) { next(error); }
});
