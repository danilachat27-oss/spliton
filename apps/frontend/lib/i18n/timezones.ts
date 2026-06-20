import type { AppLocale } from "./types";
import { intlLocaleFor } from "./formatters";

export type TimezoneOption = {
  value: string;
  label: string;
  offsetMinutes: number;
  city: string;
};

const FALLBACK_TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Moscow",
  "Europe/Kaliningrad",
  "Asia/Yekaterinburg",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;

/** Parse GMT offset from Intl `timeZoneName` part (handles DST for `date`). */
export function getTimezoneOffsetMinutes(timeZone: string, date = new Date()): number {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    })
      .formatToParts(date)
      .find((p) => p.type === "timeZoneName")?.value;

    if (!part || part === "GMT") return 0;
    const match = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === "+" ? 1 : -1;
    const hours = Number(match[2]);
    const minutes = Number(match[3] ?? 0);
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}

export function formatTimezoneOffsetShort(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "UTC";
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return minutes > 0
    ? `UTC${sign}${hours}:${String(minutes).padStart(2, "0")}`
    : `UTC${sign}${hours}`;
}

export function formatTimezoneCity(timeZone: string): string {
  if (timeZone === "UTC") return "UTC";
  const tail = timeZone.includes("/") ? timeZone.split("/").pop()! : timeZone;
  return tail.replace(/_/g, " ");
}

export function formatTimezoneLabel(timeZone: string, locale: AppLocale, date = new Date()): string {
  const offsetMinutes = getTimezoneOffsetMinutes(timeZone, date);
  const offset = formatTimezoneOffsetShort(offsetMinutes);
  const city = formatTimezoneCity(timeZone);
  if (timeZone === "UTC") return "UTC";
  return `${city} (${offset})`;
}

function readSupportedTimezones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }
  return [...FALLBACK_TIMEZONES];
}

let cachedOptions: TimezoneOption[] | null = null;

/** Full IANA list sorted by current UTC offset, then city name. */
export function listTimezoneOptions(locale: AppLocale, date = new Date()): TimezoneOption[] {
  if (cachedOptions) return cachedOptions;

  const zones = readSupportedTimezones();

  cachedOptions = zones
    .map((value) => {
      const offsetMinutes = getTimezoneOffsetMinutes(value, date);
      const city = formatTimezoneCity(value);
      const offset = formatTimezoneOffsetShort(offsetMinutes);
      const label =
        value === "UTC"
          ? "UTC"
          : `${city} (${offset})`;
      return { value, label, offsetMinutes, city };
    })
    .sort((a, b) => {
      if (a.offsetMinutes !== b.offsetMinutes) return a.offsetMinutes - b.offsetMinutes;
      return a.city.localeCompare(b.city, intlLocaleFor(locale));
    });

  return cachedOptions;
}

export function resolveTimezoneLabel(
  timeZone: string | null | undefined,
  locale: AppLocale,
): string {
  if (!timeZone?.trim()) return "—";
  const options = listTimezoneOptions(locale);
  const hit = options.find((o) => o.value === timeZone);
  if (hit) return hit.label;
  return formatTimezoneLabel(timeZone, locale);
}

export function isValidIanaTimezone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}
