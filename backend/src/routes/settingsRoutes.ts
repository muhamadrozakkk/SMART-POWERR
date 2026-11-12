import { Router } from "express";
import { requireAuth, userId } from "../middleware/auth.js";
import { getSettings, updateSettings } from "../services/settingsService.js";
import { PLN_TARIFFS, TARIFF_REGULATION_URL, TARIFF_SOURCE, TARIFF_SOURCE_URL } from "../config/tariffs.js";

export const settingsRoutes = Router();
settingsRoutes.get("/tariffs", (_request, response) => response.json({ data: [{ value: "CUSTOM", label: "Tarif khusus", tariff_per_kwh: null }, ...Object.entries(PLN_TARIFFS).map(([value, tariff]) => ({ value, ...tariff }))], source: TARIFF_SOURCE, source_url: TARIFF_SOURCE_URL, regulation_url: TARIFF_REGULATION_URL }));
settingsRoutes.use(requireAuth);
settingsRoutes.get("/", async (request, response, next) => { try { response.json(await getSettings(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined)); } catch (error) { next(error); } });
settingsRoutes.put("/", async (request, response, next) => { try { response.json(await updateSettings(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined, request.body)); } catch (error) { next(error); } });
settingsRoutes.patch("/", async (request, response, next) => { try { response.json(await updateSettings(userId(request), typeof request.query.device_id === "string" ? request.query.device_id : undefined, request.body)); } catch (error) { next(error); } });
