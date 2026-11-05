import { Router } from "express";
import { requireAuth, userId } from "../middleware/auth.js";
import { listNotifications, markNotificationRead } from "../services/notificationService.js";
import { HttpError } from "../utils/errors.js";

export const notificationRoutes = Router();
notificationRoutes.use(requireAuth);
notificationRoutes.get("/", async (request, response, next) => { try { response.json({ data: await listNotifications(userId(request), request.query.unread_only === "true") }); } catch (error) { next(error); } });
notificationRoutes.patch("/:id/read", async (request, response, next) => { try { const id = Number(request.params.id); if (!Number.isInteger(id)) throw new HttpError(400, "ID notifikasi tidak valid"); const result = await markNotificationRead(userId(request), id); if (!result) throw new HttpError(404, "Notifikasi tidak ditemukan"); response.json({ data: result }); } catch (error) { next(error); } });
