import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../utils/errors.js";

export const avatarRoutes = Router();
avatarRoutes.use(requireAuth);

avatarRoutes.get("/", async (request, response, next) => {
  try {
    const result = await query<{ avatar_data: string | null; avatar_mime: string | null }>(
      "SELECT CASE WHEN avatar_data IS NULL THEN NULL ELSE encode(avatar_data, 'base64') END AS avatar_data, avatar_mime FROM users WHERE id=$1",
      [request.user?.id],
    );
    const row = result.rows[0];
    if (!row) throw new HttpError(404, "Akun tidak ditemukan");
    response.json({ avatarUrl: row.avatar_data && row.avatar_mime ? `data:${row.avatar_mime};base64,${row.avatar_data}` : null });
  } catch (error) { next(error); }
});

avatarRoutes.post("/", async (request, response, next) => {
  try {
    const { image, mimeType } = request.body as { image?: unknown; mimeType?: unknown };
    if (typeof image !== "string" || typeof mimeType !== "string") throw new HttpError(400, "Foto dan jenis file wajib dikirim");
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) throw new HttpError(415, "Format foto harus JPG, PNG, atau WebP");
    const base64 = image.replace(/^data:image\/(?:jpeg|png|webp);base64,/i, "");
    if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new HttpError(400, "Data foto tidak valid");
    const bytes = Buffer.from(base64, "base64");
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new HttpError(413, "Ukuran foto maksimal 2 MB");
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
    const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!(mimeType === "image/jpeg" && isJpeg) && !(mimeType === "image/png" && isPng) && !(mimeType === "image/webp" && isWebp)) throw new HttpError(400, "Isi file tidak cocok dengan format gambar yang dipilih");
    const saved = await query("UPDATE users SET avatar_data=decode($2,'base64'), avatar_mime=$3 WHERE id=$1 RETURNING id", [request.user?.id, bytes.toString("base64"), mimeType]);
    if (!saved.rows[0]) throw new HttpError(404, "Akun tidak ditemukan");
    response.json({ avatarUrl: `data:${mimeType};base64,${bytes.toString("base64")}`, message: "Foto profil berhasil diperbarui." });
  } catch (error) { next(error); }
});

avatarRoutes.delete("/", async (request, response, next) => {
  try {
    const result = await query("UPDATE users SET avatar_data=NULL, avatar_mime=NULL WHERE id=$1 RETURNING id", [request.user?.id]);
    if (!result.rows[0]) throw new HttpError(404, "Akun tidak ditemukan");
    response.json({ avatarUrl: null, message: "Foto profil dihapus." });
  } catch (error) { next(error); }
});
