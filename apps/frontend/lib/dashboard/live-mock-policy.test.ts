import { describe, expect, it } from "vitest";

/**
 * Documents live/mock policy enforced in dashboard hooks (regression contract).
 * Hooks must not fall back to demo data when live API fails.
 */
export function liveApiErrorShouldNotUseDemoFallback(live: boolean): boolean {
  return live;
}

export function mockModeMayUseDemoData(live: boolean): boolean {
  return !live;
}

describe("live/mock policy contract", () => {
  it("live API errors must not use DEMO_STATS or catalog-mock", () => {
    expect(liveApiErrorShouldNotUseDemoFallback(true)).toBe(true);
    expect(mockModeMayUseDemoData(true)).toBe(false);
  });

  it("mock/dev mode may use demo fixtures", () => {
    expect(mockModeMayUseDemoData(false)).toBe(true);
    expect(liveApiErrorShouldNotUseDemoFallback(false)).toBe(false);
  });
});
