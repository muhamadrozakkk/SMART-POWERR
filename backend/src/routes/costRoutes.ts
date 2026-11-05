import { Router } from "express";
import { requireAuth, userId } from "../middleware/auth.js";
import { costSummary } from "../services/costService.js";

export const costRoutes = Router();
costRoutes.get("/summary", requireAuth, async (request, response, next) => { try { response.json(await costSummary(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined)); } catch (error) { next(error); } });
