export type EnergyRow = { ts: Date; energy: number };

export function consumptionFromCumulative(rows: EnergyRow[]) {
  const sorted = [...rows].sort((a, b) => a.ts.getTime() - b.ts.getTime());
  let total = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    const difference = sorted[index].energy - sorted[index - 1].energy;
    if (difference >= 0) total += difference;
  }
  return Number(total.toFixed(6));
}

export function jakartaParts(date = new Date()) {
  const values = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  return Object.fromEntries(values.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])) as Record<string, number>;
}

export function jakartaStartOfDay(date = new Date()) {
  const parts = jakartaParts(date);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day) - 7 * 60 * 60 * 1000);
}

export function jakartaStartOfMonth(date = new Date()) {
  const parts = jakartaParts(date);
  return new Date(Date.UTC(parts.year, parts.month - 1, 1) - 7 * 60 * 60 * 1000);
}

export function daysInJakartaMonth(date = new Date()) {
  const parts = jakartaParts(date);
  return new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
}
