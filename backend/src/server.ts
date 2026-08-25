import cors from "cors";
import express, { type Request, type Response } from "express";
import { alarms, deviceStatus, distribution, prediction, powerHistory, settings } from "./mockData.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());

app.get("/api/health", (_request: Request, response: Response) => {
  response.json({ status: "ok", service: "smart-power-api", mode: "mock", timestamp: new Date().toISOString() });
});

app.get("/api/dashboard", (_request: Request, response: Response) => {
  const latest = powerHistory[powerHistory.length - 1];
  response.json({
    metrics: {
      activePower: { value: latest.power, unit: "W", status: "Penggunaan Normal" },
      current: { value: latest.current, unit: "A", status: "Penggunaan Normal" },
      voltage: { value: latest.voltage, unit: "V", status: "Stabil" },
      powerFactor: { value: 0.94, unit: "", status: "Baik" },
      todayEnergy: { value: 8.42, unit: "kWh", cost: 5640 },
    },
    powerHistory,
    distribution,
    device: deviceStatus,
    alarms,
    prediction,
    simulation: true,
  });
});

app.get("/api/readings", (request: Request, response: Response) => {
  const requestedLimit = Number(request.query.limit ?? powerHistory.length);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), powerHistory.length) : powerHistory.length;
  response.json({ data: powerHistory.slice(-limit), total: powerHistory.length, simulation: true });
});

app.get("/api/device", (_request: Request, response: Response) => response.json({ data: deviceStatus, simulation: true }));
app.get("/api/alarms", (_request: Request, response: Response) => response.json({ data: alarms, total: alarms.length, simulation: true }));
app.get("/api/prediction", (_request: Request, response: Response) => response.json({ data: prediction, unit: "kWh / hari", simulation: true }));
app.get("/api/energy/distribution", (_request: Request, response: Response) => response.json({ data: distribution, simulation: true }));

app.get("/api/settings", (_request: Request, response: Response) => response.json({ data: settings, persistent: false }));
app.patch("/api/settings", (request: Request, response: Response) => {
  const body = request.body as Partial<typeof settings>;
  if (body.powerLimit !== undefined && (!Number.isFinite(body.powerLimit) || body.powerLimit <= 0)) return response.status(400).json({ error: "powerLimit harus berupa angka positif" });
  if (body.monthlyCostTarget !== undefined && (!Number.isFinite(body.monthlyCostTarget) || body.monthlyCostTarget <= 0)) return response.status(400).json({ error: "monthlyCostTarget harus berupa angka positif" });
  if (body.monitoringIntervalSeconds !== undefined && (![5, 10, 30].includes(body.monitoringIntervalSeconds))) return response.status(400).json({ error: "monitoringIntervalSeconds harus 5, 10, atau 30" });
  Object.assign(settings, body);
  return response.json({ data: settings, persistent: false });
});

app.use((_request: Request, response: Response) => response.status(404).json({ error: "Endpoint tidak ditemukan" }));
app.use((error: unknown, _request: Request, response: Response, _next: unknown) => {
  console.error(error);
  response.status(500).json({ error: "Terjadi kesalahan pada server" });
});

app.listen(port, () => console.log(`SMART POWER API berjalan di http://localhost:${port} (${frontendUrl})`));
