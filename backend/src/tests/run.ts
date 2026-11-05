import assert from "node:assert/strict";
import { consumptionFromCumulative, jakartaStartOfDay } from "../utils/energy.js";
import { cooldownElapsed } from "../utils/cooldown.js";
import { readingInput } from "../utils/validation.js";

const now = new Date("2026-11-05T05:00:00.000Z");
assert.equal(consumptionFromCumulative([{ ts: new Date("2026-01-01T00:00:00Z"), energy: 1 }, { ts: new Date("2026-01-01T00:05:00Z"), energy: 3 }, { ts: new Date("2026-01-01T00:10:00Z"), energy: 0 }, { ts: new Date("2026-01-01T00:15:00Z"), energy: 2 }]), 4, "reset energy tidak boleh menjadi selisih negatif");
assert.equal(jakartaStartOfDay(now).toISOString(), "2026-11-04T17:00:00.000Z", "batas hari harus mengikuti Asia/Jakarta");
assert.equal(cooldownElapsed(null, now, 600), true);
assert.equal(cooldownElapsed(new Date(now.getTime() - 5 * 60 * 1000), now, 600), false);
assert.equal(cooldownElapsed(new Date(now.getTime() - 10 * 60 * 1000), now, 600), true);
assert.equal(readingInput({ device_id: "ESP32-001", voltage: 220, current: 1.2, power: 264, energy: 5, frequency: 50, power_factor: 0.95 }).device_id, "ESP32-001");
assert.throws(() => readingInput({ device_id: "ESP32-001", voltage: 500, current: 1, power: 10, energy: 1, frequency: 50, power_factor: 0.9 }), /rentang/);
console.log("Semua unit test backend lulus");
