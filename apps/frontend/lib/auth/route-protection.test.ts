import { describe, expect, it } from "vitest";

import {
  buildLoginRedirectPath,
  hasSessionHintCookie,
  isProtectedPath,
} from "./route-protection";

describe("isProtectedPath", () => {
  it("protects assets and financial dashboard routes", () => {
    expect(isProtectedPath("/assets/overview")).toBe(true);
    expect(isProtectedPath("/assets/payouts/withdraw")).toBe(true);
    expect(isProtectedPath("/dashboard/profile")).toBe(true);
    expect(isProtectedPath("/dashboard/support/abc")).toBe(true);
    expect(isProtectedPath("/dashboard/secondary-market")).toBe(true);
  });

  it("keeps marketing and catalog routes public", () => {
    expect(isProtectedPath("/app")).toBe(false);
    expect(isProtectedPath("/catalog")).toBe(false);
    expect(isProtectedPath("/analytics/releases")).toBe(false);
    expect(isProtectedPath("/guide/selection")).toBe(false);
    expect(isProtectedPath("/catalog/market-overview")).toBe(false);
    expect(isProtectedPath("/fees")).toBe(false);
    expect(isProtectedPath("/news")).toBe(false);
    expect(isProtectedPath("/support")).toBe(false);
    expect(isProtectedPath("/catalog/buy/uuid")).toBe(false);
  });
});

describe("session hint", () => {
  it("accepts only value 1", () => {
    expect(hasSessionHintCookie("1")).toBe(true);
    expect(hasSessionHintCookie(undefined)).toBe(false);
    expect(hasSessionHintCookie("0")).toBe(false);
  });
});

describe("buildLoginRedirectPath", () => {
  it("encodes next path with query", () => {
    expect(buildLoginRedirectPath("/assets/overview", "")).toBe(
      "/login?next=%2Fassets%2Foverview",
    );
    expect(buildLoginRedirectPath("/assets/payouts/withdraw", "?tab=x")).toBe(
      "/login?next=%2Fassets%2Fpayouts%2Fwithdraw%3Ftab%3Dx",
    );
  });
});
