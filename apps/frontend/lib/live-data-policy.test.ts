import { afterEach, describe, expect, it, vi } from "vitest";

import {
  enforceFinancialLivePolicyAtRuntime,
  isAdminMockFallbackAllowed,
  isFinancialMockFallbackAllowed,
} from "./live-data-policy";

describe("live-data-policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows mock fallback only when wallet source is mock", () => {
    vi.stubEnv("NEXT_PUBLIC_WALLET_DATA_SOURCE", "mock");
    expect(isFinancialMockFallbackAllowed()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_WALLET_DATA_SOURCE", "live");
    expect(isFinancialMockFallbackAllowed()).toBe(false);
  });

  it("allows admin mock only when admin source is mock", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_DATA_SOURCE", "mock");
    expect(isAdminMockFallbackAllowed()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_ADMIN_DATA_SOURCE", "live");
    expect(isAdminMockFallbackAllowed()).toBe(false);
  });

  it("logs when strict deploy runs with wallet mock", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_WALLET_DATA_SOURCE", "mock");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    enforceFinancialLivePolicyAtRuntime("test-scope");
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("test-scope"));
    spy.mockRestore();
  });
});
