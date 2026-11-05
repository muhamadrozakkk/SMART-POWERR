import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { deviceStatus } from "../services/deviceService.js";

export const deviceRoutes = Router();
deviceRoutes.get("/:id/status", requireAuth, async (request, response, next) => { try { response.json(await deviceStatus(String(request.params.id))); } catch (error) { next(error); } });
