import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { requireConfig } from "../config/env.js";
import { HttpError } from "../utils/errors.js";
import { query } from "../db/pool.js";

export async function requireDeviceApiKey(request: Request, _response: Response, next: NextFunction) {
  try {
    const rawReceived = request.header("x-api-key") ?? "";
    const deviceId = typeof request.body?.device_id === "string" ? request.body.device_id : typeof request.query.device_id === "string" ? request.query.device_id : "";
    const deviceKey = deviceId ? await query<{ token_hash: string }>("SELECT token_hash FROM device_api_keys WHERE device_id=$1", [deviceId]) : { rows: [] as { token_hash: string }[] };
    const expected = deviceKey.rows[0]?.token_hash ?? requireConfig("DEVICE_API_KEY");
    const received = Buffer.from(deviceKey.rows[0] ? createHash("sha256").update(rawReceived).digest("hex") : rawReceived);
    const expectedBytes = Buffer.from(expected);
    if (expectedBytes.length !== received.length || !timingSafeEqual(expectedBytes, received)) throw new HttpError(401, "API key perangkat tidak valid");
    next();
  } catch (error) { next(error); }
}
