import { Router } from "express";
import { requireAuth, userId } from "../middleware/auth.js";
import { resolveDeviceForUser } from "../services/deviceService.js";
import { latestReading, readings } from "../services/readingService.js";
import { HttpError } from "../utils/errors.js";

export const telemetryRoutes = Router();
telemetryRoutes.get("/:deviceId", requireAuth, async (request, response, next) => {
  try {
    const deviceId = await resolveDeviceForUser(userId(request), String(request.params.deviceId));
    const interval = request.query.interval;
    if (interval !== undefined && !["hour", "day", "week", "month"].includes(String(interval))) throw new HttpError(400, "interval harus hour, day, week, atau month");
    const [latest, history] = await Promise.all([
      latestReading(deviceId).catch((error) => { if (error instanceof HttpError && error.status === 404) return null; throw error; }),
      readings(deviceId, typeof request.query.from === "string" ? request.query.from : undefined, typeof request.query.to === "string" ? request.query.to : undefined, interval as "hour" | "day" | "week" | "month" | undefined),
    ]);
    response.json({ device_id: deviceId, latest, data: history });
  } catch (error) { next(error); }
});
