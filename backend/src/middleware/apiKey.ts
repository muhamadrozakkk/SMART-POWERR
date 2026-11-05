import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { requireConfig } from "../config/env.js";
import { HttpError } from "../utils/errors.js";

export function requireDeviceApiKey(request: Request, _response: Response, next: NextFunction) {
  try {
    const expected = Buffer.from(requireConfig("DEVICE_API_KEY"));
    const received = Buffer.from(request.header("x-api-key") ?? "");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new HttpError(401, "API key perangkat tidak valid");
    next();
  } catch (error) { next(error); }
}
