import { describe, expect, it } from "vitest";

import { formatAuditActionLabel } from "@/lib/i18n/admin-messages";
import {
  formatSecurityEventIp,
  securityEventLabel,
  securityEventTone,
} from "@/lib/profile/security-event-display";

describe("security-event-display", () => {
  it("labels refresh events in Russian", () => {
    expect(securityEventLabel("REFRESH_SUCCESS", "ru")).toBe("Сессия продлена");
    expect(securityEventLabel("REFRESH_REUSE_DETECTED", "ru")).toBe(
      "Подозрительная активность с сессией",
    );
  });

  it("falls back to overview labels", () => {
    expect(securityEventLabel("LOGIN_SUCCESS", "en")).toBe("Successful sign-in");
  });

  it("marks reuse as danger", () => {
    expect(securityEventTone("REFRESH_REUSE_DETECTED")).toBe("danger");
    expect(securityEventTone("REFRESH_SUCCESS")).toBe("neutral");
  });

  it("hides localhost ip", () => {
    expect(formatSecurityEventIp("::1", "ru")).toBe("Это устройство");
    expect(formatSecurityEventIp("203.0.113.1", "en")).toBe("203.0.113.1");
  });
});

describe("formatAuditActionLabel", () => {
  it("localizes auth refresh events in Russian", () => {
    expect(formatAuditActionLabel("REFRESH_SUCCESS", "ru")).toBe("Сессия продлена");
    expect(formatAuditActionLabel("LOGIN_SUCCESS", "ru")).toBe("Успешный вход");
  });

  it("localizes admin dot-notation actions", () => {
    expect(formatAuditActionLabel("withdrawal.approve", "ru")).toBe("Одобрение вывода");
    expect(formatAuditActionLabel("market.order.submit", "ru")).toBe("Заявка на вторичном рынке");
  });

  it("localizes consent without treating it as auth security", () => {
    expect(formatAuditActionLabel("USER_CONSENT_ACCEPTED", "ru")).toBe("Принятие согласия");
  });
});
