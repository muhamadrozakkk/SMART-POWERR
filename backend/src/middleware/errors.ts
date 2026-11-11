import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError, errorMessage } from "../utils/errors.js";
import { query } from "../db/pool.js";

export const notFound: RequestHandler = (_request, response) => response.status(404).json({ error: "Endpoint tidak ditemukan" });
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) {
    console.error(error);
    void query("INSERT INTO system_logs(level,message,details) VALUES('error',$1,$2::jsonb)", [errorMessage(error), JSON.stringify({ stack: error instanceof Error ? error.stack : undefined })]).catch(() => undefined);
  }
  response.status(status).json({ error: error instanceof HttpError ? error.message : "Terjadi kesalahan pada server", details: error instanceof HttpError ? error.details : undefined });
};
