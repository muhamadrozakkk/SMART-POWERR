import { Router } from "express";
import { requireAuth, userId } from "../middleware/auth.js";
import { requireDeviceApiKey } from "../middleware/apiKey.js";
import { resolveDeviceForUser } from "../services/deviceService.js";
import { latestReading, readings, saveReading } from "../services/readingService.js";
import { readingInput } from "../utils/validation.js";
import { HttpError } from "../utils/errors.js";

export const readingRoutes = Router();
readingRoutes.post("/", requireDeviceApiKey, async (request, response, next) => { try { response.json(await saveReading(readingInput(request.body))); } catch (error) { next(error); } });
readingRoutes.get("/latest", requireAuth, async (request, response, next) => { try { const deviceId = await resolveDeviceForUser(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined); response.json(await latestReading(deviceId)); } catch (error) { next(error); } });
readingRoutes.get("/", requireAuth, async (request, response, next) => { try { const interval = request.query.interval; if (interval !== undefined && !["hour", "day", "week", "month"].includes(String(interval))) throw new HttpError(400, "interval harus hour, day, week, atau month"); const deviceId = await resolveDeviceForUser(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined); response.json({ data: await readings(deviceId, typeof request.query.from === "string" ? request.query.from : undefined, typeof request.query.to === "string" ? request.query.to : undefined, interval as "hour" | "day" | "week" | "month" | undefined) }); } catch (error) { next(error); } });
