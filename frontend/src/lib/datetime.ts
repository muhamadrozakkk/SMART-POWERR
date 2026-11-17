const WIB_TIME_ZONE = "Asia/Jakarta";

export function formatWibDateTime(value: string | Date, locale = "id-ID") {
  return `${new Date(value).toLocaleString(locale, {
    timeZone: WIB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })} WIB`;
}

export function formatWibDate(value: string | Date, locale = "id-ID") {
  return new Date(value).toLocaleDateString(locale, { timeZone: WIB_TIME_ZONE, day: "2-digit", month: "short", year: "numeric" });
}

export function formatWibTime(value: string | Date, locale = "id-ID") {
  return new Date(value).toLocaleTimeString(locale, { timeZone: WIB_TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function wibDateInputValue(value: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: WIB_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function wibDayBoundary(value: string, endOfDay = false) {
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}+07:00`).toISOString();
}
