import { Router } from "express";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { login, register, requestPasswordReset, resetPassword } from "../services/authService.js";
import { HttpError } from "../utils/errors.js";

export const authRoutes = Router();
authRoutes.post("/forgot-password", async (request, response, next) => {
  try {
    const { email } = request.body as { email?: unknown };
    if (typeof email !== "string" || !email.trim()) throw new HttpError(400, "Email wajib diisi");
    if (!env.smtpHost || !env.smtpUser || !env.smtpPassword || !env.smtpFrom) throw new HttpError(503, "Layanan email belum dikonfigurasi di backend");
    const reset = await requestPasswordReset(email);
    if (reset) {
      const transporter = nodemailer.createTransport({ host: env.smtpHost, port: env.smtpPort, secure: env.smtpPort === 465, auth: { user: env.smtpUser, pass: env.smtpPassword } });
      const link = `${env.frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(reset.token)}`;
      try {
        await transporter.sendMail({ from: env.smtpFrom, to: reset.user.email, subject: "Reset password SMART POWER WEB", html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#10243a"><h2>Reset password</h2><p>Halo ${escapeHtml(reset.user.name)}, kami menerima permintaan untuk mengganti password akun SMART POWER WEB kamu.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#0879df;color:#fff;text-decoration:none;border-radius:7px">Buat password baru</a></p><p>Tautan berlaku selama 20 menit. Jika kamu tidak meminta reset, abaikan email ini.</p></div>` });
      } catch (error) {
        await import("../db/pool.js").then(({ query }) => query("UPDATE users SET reset_password_token_hash=NULL, reset_password_expires=NULL WHERE id=(SELECT id FROM users WHERE lower(email)=lower($1))", [email.trim()]));
        throw error;
      }
    }
    response.status(202).json({ message: "Jika email terdaftar, instruksi reset akan dikirim." });
  } catch (error) { next(error); }
});
authRoutes.post("/reset-password", async (request, response, next) => {
  try {
    const { token, newPassword } = request.body as { token?: unknown; newPassword?: unknown };
    if (typeof token !== "string" || !token || typeof newPassword !== "string") throw new HttpError(400, "Token dan password baru wajib diisi");
    await resetPassword(token, newPassword);
    response.json({ message: "Password berhasil diperbarui" });
  } catch (error) { next(error); }
});

authRoutes.post("/register", async (request, response, next) => {
  try {
    const { name, email, password } = request.body as { name?: unknown; email?: unknown; password?: unknown };
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") throw new HttpError(400, "Nama, email, dan password wajib diisi");
    response.status(201).json(await register(name, email, password));
  } catch (error) { next(error); }
});

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char); }

authRoutes.post("/login", async (request, response, next) => {
  try {
    const { email, password } = request.body as { email?: unknown; password?: unknown };
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) throw new HttpError(400, "Email dan password wajib diisi");
    response.json(await login(email, password));
  } catch (error) { next(error); }
});
