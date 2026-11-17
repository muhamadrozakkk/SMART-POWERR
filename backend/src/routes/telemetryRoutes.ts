import { Router } from "express";
import { requireAuth, userId } from "../middleware/auth.js";
import { requireDeviceApiKey } from "../middleware/apiKey.js";
import { resolveDeviceForUser } from "../services/deviceService.js";
import { latestReading, readings } from "../services/readingService.js";
import { receiveReading } from "./readingRoutes.js";
import { HttpError } from "../utils/errors.js";

export const telemetryRoutes = Router();
telemetryRoutes.post("/", requireDeviceApiKey, receiveReading);
telemetryRoutes.get("/latest", requireAuth, async (request, response, next) => {
  try {
    let deviceId: string;
    try { deviceId = await resolveDeviceForUser(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined); }
    catch (error) { if (error instanceof HttpError && error.status === 404) return response.json(null); throw error; }
    const latest = await latestReading(deviceId).catch((error) => { if (error instanceof HttpError && error.status === 404) return null; throw error; });
    response.json(latest);
  } catch (error) { next(error); }
});
telemetryRoutes.get("/history", requireAuth, async (request, response, next) => {
  try {
    let deviceId: string;
    try { deviceId = await resolveDeviceForUser(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined); }
    catch (error) { if (error instanceof HttpError && error.status === 404) return response.json({ data: [] }); throw error; }
    const defaultFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const interval = request.query.interval;
    if (interval !== undefined && !["hour", "day", "week", "month", "raw"].includes(String(interval))) throw new HttpError(400, "interval harus hour, day, week, month, atau raw");
    const data = await readings(deviceId, typeof request.query.from === "string" ? request.query.from : defaultFrom, typeof request.query.to === "string" ? request.query.to : undefined, (interval as "hour" | "day" | "week" | "month" | "raw" | undefined) ?? "hour");
    response.json({ data });
  } catch (error) { next(error); }
});
telemetryRoutes.get("/:deviceId", requireAuth, async (request, response, next) => {
  try {
    const deviceId = await resolveDeviceForUser(userId(request), String(request.params.deviceId));
    const interval = request.query.interval;
    if (interval !== undefined && !["hour", "day", "week", "month", "raw"].includes(String(interval))) throw new HttpError(400, "interval harus hour, day, week, month, atau raw");
    const [latest, history] = await Promise.all([
      latestReading(deviceId).catch((error) => { if (error instanceof HttpError && error.status === 404) return null; throw error; }),
      readings(deviceId, typeof request.query.from === "string" ? request.query.from : undefined, typeof request.query.to === "string" ? request.query.to : undefined, interval as "hour" | "day" | "week" | "month" | "raw" | undefined),
    ]);
    response.json({ device_id: deviceId, latest, data: history });
  } catch (error) { next(error); }
});
