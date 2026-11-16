import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { HttpError } from "../utils/errors.js";
import { query } from "../db/pool.js";

export async function requireDeviceApiKey(request: Request, _response: Response, next: NextFunction) {
  try {
    const rawReceived = request.header("x-api-key") ?? "";
    const deviceId = typeof request.body?.device_id === "string" ? request.body.device_id : typeof request.query.device_id === "string" ? request.query.device_id : "";
    const deviceKey = deviceId ? await query<{ token_hash: string }>("SELECT token_hash FROM device_api_keys WHERE device_id=$1", [deviceId]) : { rows: [] as { token_hash: string }[] };
    const deviceHash = deviceKey.rows[0]?.token_hash;
    const safeEqual = (expected: string, received: string) => {
      const expectedBytes = Buffer.from(expected);
      const receivedBytes = Buffer.from(received);
      return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
    };
    if (deviceHash) {
      const receivedHash = createHash("sha256").update(rawReceived).digest("hex");
      if (!safeEqual(deviceHash, receivedHash)) throw new HttpError(401, "API key perangkat tidak valid");
    } else {
      if (!env.deviceApiKey) throw new HttpError(503, "DEVICE_API_KEY belum dikonfigurasi dan perangkat ini belum memiliki API key tersendiri");
      if (!safeEqual(env.deviceApiKey, rawReceived)) throw new HttpError(401, "API key perangkat tidak valid");
    }
    next();
  } catch (error) { next(error); }
}
