import "dotenv/config";

const apiUrl = process.env.SIMULATOR_URL ?? "http://localhost:4000/api/readings";
const apiKey = process.env.DEVICE_API_KEY ?? "";
const deviceId = process.env.SIMULATOR_DEVICE_ID ?? "ESP32-001";
const once = process.argv.includes("--once");
const spike = process.argv.includes("--spike");
const reset = process.argv.includes("--reset-energy");
let energy = reset ? 0 : Number(process.env.SIMULATOR_START_ENERGY ?? 10);

async function sendReading() {
  const voltage = Number((219 + Math.random() * 3).toFixed(2));
  const current = spike ? Number((6 + Math.random() * 2).toFixed(2)) : Number((1.2 + Math.random() * 1.2).toFixed(2));
  const power = Number((voltage * current * (0.9 + Math.random() * 0.08)).toFixed(2));
  energy = Number((energy + power / 1000 / 720).toFixed(6));
  const body = { device_id: deviceId, timestamp: new Date().toISOString(), voltage, current, power, energy, frequency: Number((49.8 + Math.random() * 0.4).toFixed(2)), power_factor: Number((0.9 + Math.random() * 0.08).toFixed(3)) };
  const response = await fetch(apiUrl, { method: "POST", headers: { "content-type": "application/json", "x-api-key": apiKey }, body: JSON.stringify(body) });
  console.log(response.status, await response.text());
}

if (!apiKey) console.warn("DEVICE_API_KEY belum diisi; simulator kemungkinan ditolak backend.");
await sendReading();
if (!once) setInterval(() => { sendReading().catch((error) => console.error("Simulator gagal", error)); }, 5000);
