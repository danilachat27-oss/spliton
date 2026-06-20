import { describe, expect, it } from "vitest";

import { formatApiError } from "./format-api-error";
import { messageForApiError } from "./dictionaries";
import { normalizeLocale } from "./normalize-locale";
import { statusLabel } from "./status-labels";
import { API_ERROR_CODES } from "./error-messages";
import { SUPPORTED_LOCALES } from "./types";

describe("formatApiError", () => {
  it("maps legacy wallet codes via alias", () => {
    expect(
      formatApiError({ code: "INSUFFICIENT_BALANCE", message: "raw" }, "ru"),
    ).toMatch(/Недостаточно/);
  });

  it("does not show raw backend message when error code is present", () => {
    expect(
      formatApiError(
        { code: "WALLET_INSUFFICIENT_BALANCE", message: "Raw backend detail in English" },
        "en",
      ),
    ).not.toMatch(/Raw backend/);
  });

  it("maps SYSTEM_MAINTENANCE in EN", () => {
    expect(formatApiError({ code: "SYSTEM_MAINTENANCE" }, "en")).toMatch(/maintenance/i);
  });

  it("maps to ES", () => {
    expect(formatApiError({ code: "WITHDRAWAL_DISABLED" }, "es")).toMatch(/retiros/i);
  });

  it("maps 403 without code to FORBIDDEN", () => {
    expect(formatApiError({ status: 403 }, "en")).toMatch(/permission/i);
  });

  it("maps 401 without code to AUTH_REQUIRED", () => {
    expect(formatApiError({ status: 401 }, "en")).toMatch(/sign in/i);
  });

  it("maps 409 without code to CONFLICT", () => {
    expect(formatApiError({ status: 409 }, "en")).toMatch(/conflict/i);
  });

  it("maps 422 without code to VALIDATION_ERROR", () => {
    expect(formatApiError({ status: 422 }, "en")).toMatch(/check the entered data/i);
  });

  it("maps 500 without code to SERVER_UNAVAILABLE", () => {
    expect(formatApiError({ status: 500 }, "en")).toMatch(/unavailable/i);
  });

  it("maps validation array to localized validation message", () => {
    expect(formatApiError({ message: ["email is invalid", "password too short"] }, "en")).toMatch(
      /check the entered data/i,
    );
  });

  it("handles EMAIL_NOT_VERIFIED object shape", () => {
    expect(
      formatApiError({ code: "EMAIL_NOT_VERIFIED", message: { message: "verify email" } }, "en"),
    ).toMatch(/verify your email/i);
  });
});

describe("statusLabel", () => {
  it("translates withdrawal status", () => {
    expect(statusLabel("withdrawal", "on_hold", "ru")).toBe("На удержании");
    expect(statusLabel("withdrawal", "on_hold", "en")).toBe("On hold");
    expect(statusLabel("withdrawal", "on_hold", "es")).toBe("En retención");
  });
});

describe("i18n error mapping", () => {
  it("maps wallet error to RU", () => {
    expect(messageForApiError("WALLET_INSUFFICIENT_BALANCE", "ru")).toMatch(/Недостаточно/);
  });

  it("maps wallet error to EN", () => {
    expect(messageForApiError("WALLET_INSUFFICIENT_BALANCE", "en")).toMatch(/Insufficient/);
  });

  it("maps wallet error to PT", () => {
    expect(messageForApiError("WALLET_INSUFFICIENT_BALANCE", "pt")).toMatch(/insuficiente/i);
  });

  it("falls back for unknown codes", () => {
    expect(messageForApiError("NOT_A_REAL_CODE", "ru")).toMatch(/Не удалось/);
  });

  it("sanitizes technical fallback", () => {
    expect(
      messageForApiError(undefined, "en", "Internal server error: prisma P2002"),
    ).toMatch(/Operation failed|Something went wrong|Try again/i);
  });

  it("maps invalid credentials message to INVALID_CREDENTIALS", () => {
    expect(formatApiError({ message: "Invalid credentials" }, "ru")).toMatch(
      /Неверный|email|пароль/i,
    );
  });

  it("sanitizes prisma in formatApiError path", () => {
    expect(
      formatApiError({ code: "INTERNAL_ERROR", message: "PrismaClientKnownRequestError P2002" }, "en"),
    ).toMatch(/Something went wrong|went wrong/i);
  });

  it("every known backend code has all 4 languages", () => {
    for (const code of API_ERROR_CODES) {
      for (const locale of SUPPORTED_LOCALES) {
        const msg = messageForApiError(code, locale);
        expect(msg.length).toBeGreaterThan(3);
        expect(msg).not.toBe(code);
      }
    }
  });
});

describe("normalizeLocale", () => {
  it("falls back ka to ru", () => {
    expect(normalizeLocale("ka")).toBe("ru");
  });

  it("falls back invalid cookie to ru", () => {
    expect(normalizeLocale("xx")).toBe("ru");
  });

  it("accepts es and pt", () => {
    expect(normalizeLocale("es")).toBe("es");
    expect(normalizeLocale("pt-BR")).toBe("pt");
  });
});
