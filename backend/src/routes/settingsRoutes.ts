import { Router } from "express";
import { requireAuth, userId } from "../middleware/auth.js";
import { getSettings, updateSettings } from "../services/settingsService.js";

export const settingsRoutes = Router();
settingsRoutes.use(requireAuth);
settingsRoutes.get("/", async (request, response, next) => { try { response.json(await getSettings(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined)); } catch (error) { next(error); } });
settingsRoutes.put("/", async (request, response, next) => { try { response.json(await updateSettings(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined, request.body)); } catch (error) { next(error); } });
settingsRoutes.patch("/", async (request, response, next) => { try { response.json(await updateSettings(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined, request.body)); } catch (error) { next(error); } });
