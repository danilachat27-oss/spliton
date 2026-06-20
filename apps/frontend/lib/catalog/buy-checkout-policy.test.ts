import { describe, expect, it } from "vitest";

import {
  canRunLivePurchase,
  canRunMockPurchase,
  resolveBuyCheckoutMode,
} from "./buy-checkout-policy";

describe("resolveBuyCheckoutMode", () => {
  it("live + loading → auth_loading", () => {
    expect(resolveBuyCheckoutMode("live", false, true)).toBe("auth_loading");
    expect(resolveBuyCheckoutMode("live", true, true)).toBe("auth_loading");
  });

  it("live + not authenticated → login_required", () => {
    expect(resolveBuyCheckoutMode("live", false, false)).toBe("login_required");
  });

  it("live + authenticated → live", () => {
    expect(resolveBuyCheckoutMode("live", true, false)).toBe("live");
  });

  it("mock → mock regardless of auth", () => {
    expect(resolveBuyCheckoutMode("mock", false, false)).toBe("mock");
    expect(resolveBuyCheckoutMode("mock", true, false)).toBe("mock");
  });
});

describe("purchase guards", () => {
  it("mock purchase only in mock mode", () => {
    expect(canRunMockPurchase("mock")).toBe(true);
    expect(canRunMockPurchase("live")).toBe(false);
    expect(canRunMockPurchase("login_required")).toBe(false);
  });

  it("live purchase only in live mode", () => {
    expect(canRunLivePurchase("live")).toBe(true);
    expect(canRunLivePurchase("mock")).toBe(false);
    expect(canRunLivePurchase("login_required")).toBe(false);
  });
});
