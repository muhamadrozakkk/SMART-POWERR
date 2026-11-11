import { Router } from "express";
import { login, register } from "../services/authService.js";
import { HttpError } from "../utils/errors.js";

export const authRoutes = Router();
authRoutes.post("/register", async (request, response, next) => {
  try {
    const { name, email, password } = request.body as { name?: unknown; email?: unknown; password?: unknown };
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") throw new HttpError(400, "Nama, email, dan password wajib diisi");
    response.status(201).json(await register(name, email, password));
  } catch (error) { next(error); }
});

authRoutes.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body as { email?: unknown; password?: unknown };
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) throw new HttpError(400, "Email dan password wajib diisi");
    response.json(await login(email, password));
  } catch (error) { next(error); }
});
