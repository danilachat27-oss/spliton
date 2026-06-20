import { describe, expect, it } from "vitest";

import {
  formatTimezoneLabel,
  getTimezoneOffsetMinutes,
  isValidIanaTimezone,
  listTimezoneOptions,
  resolveTimezoneLabel,
} from "@/lib/i18n/timezones";

describe("timezones", () => {
  it("lists IANA zones with offset labels", () => {
    const options = listTimezoneOptions("en");
    expect(options.length).toBeGreaterThan(100);
    expect(options.some((o) => o.value === "Europe/Moscow")).toBe(true);
    expect(options.some((o) => o.value === "America/New_York")).toBe(true);
  });

  it("sorts by offset then city", () => {
    const options = listTimezoneOptions("en");
    for (let i = 1; i < options.length; i += 1) {
      const prev = options[i - 1]!;
      const curr = options[i]!;
      if (prev.offsetMinutes === curr.offsetMinutes) {
        expect(prev.city.localeCompare(curr.city)).toBeLessThanOrEqual(0);
      } else {
        expect(prev.offsetMinutes).toBeLessThanOrEqual(curr.offsetMinutes);
      }
    }
  });

  it("resolves known timezone label", () => {
    expect(resolveTimezoneLabel("UTC", "ru")).toBe("UTC");
    expect(resolveTimezoneLabel("Europe/Moscow", "en")).toMatch(/Moscow \(UTC\+3\)/);
  });

  it("formats offset for Moscow", () => {
    const jan = new Date("2026-01-15T12:00:00Z");
    expect(getTimezoneOffsetMinutes("Europe/Moscow", jan)).toBe(180);
    expect(formatTimezoneLabel("Europe/Moscow", "en", jan)).toContain("UTC+3");
  });

  it("validates IANA ids", () => {
    expect(isValidIanaTimezone("Europe/Moscow")).toBe(true);
    expect(isValidIanaTimezone("Not/A_Zone")).toBe(false);
  });
});
