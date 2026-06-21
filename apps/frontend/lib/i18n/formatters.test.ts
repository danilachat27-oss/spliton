import { describe, expect, it } from "vitest";

import { emptyDateLabel } from "../analytics/display-value";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatUsdtAmount,
} from "./formatters";
import type { AppLocale } from "./types";

const LOCALES: AppLocale[] = ["ru", "en", "es", "pt"];

describe("formatters", () => {
  it("formats USDT with stable decimals across locales", () => {
    for (const locale of LOCALES) {
      const out = formatUsdtAmount(1234.5, locale);
      expect(out).toMatch(/USDT$/);
      expect(out).toMatch(/1[\s.,]?234[.,]50/);
    }
  });

  it("locale-specific number grouping differs for large values", () => {
    const ru = formatNumber(10000, "ru");
    const en = formatNumber(10000, "en");
    expect(ru).not.toEqual(en);
  });

  it("formatPercent is safe for invalid values", () => {
    expect(formatPercent(null, "en")).toBe("0%");
    expect(formatPercent(Number.NaN, "ru")).toBe("0%");
  });

  it("formatCurrency handles invalid values", () => {
    for (const locale of LOCALES) {
      expect(formatCurrency(undefined, locale)).toMatch(/0/);
    }
  });

  it("formatDate and formatDateTime return empty date label for invalid input", () => {
    for (const locale of LOCALES) {
      expect(formatDate(null, locale)).toBe(emptyDateLabel(locale));
      expect(formatDateTime("not-a-date", locale)).toBe(emptyDateLabel(locale));
    }
  });

  it("formatDate differs by locale for same ISO date", () => {
    const iso = "2026-03-15T12:00:00.000Z";
    const ru = formatDate(iso, "ru", { day: "2-digit", month: "short", year: "numeric" });
    const en = formatDate(iso, "en", { day: "2-digit", month: "short", year: "numeric" });
    expect(ru.length).toBeGreaterThan(3);
    expect(en.length).toBeGreaterThan(3);
  });

  it("formatRelativeTime uses Intl and differs by locale", () => {
    const iso = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const en = formatRelativeTime(iso, "en");
    const ru = formatRelativeTime(iso, "ru");
    expect(en.length).toBeGreaterThan(0);
    expect(ru.length).toBeGreaterThan(0);
    expect(en).not.toEqual(ru);
    expect(en).not.toMatch(/[\u0400-\u04FF]/);
  });

  it("formatRelativeTime is safe for invalid input", () => {
    expect(formatRelativeTime(null, "en")).toBe("");
    expect(formatRelativeTime("bad", "en")).toBe("");
  });
});
