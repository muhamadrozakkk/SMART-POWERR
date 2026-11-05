import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError, errorMessage } from "../utils/errors.js";

export const notFound: RequestHandler = (_request, response) => response.status(404).json({ error: "Endpoint tidak ditemukan" });
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error(error);
  response.status(status).json({ error: error instanceof HttpError ? error.message : "Terjadi kesalahan pada server", details: error instanceof HttpError ? error.details : undefined });
};
