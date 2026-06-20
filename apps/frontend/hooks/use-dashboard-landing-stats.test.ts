import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";

import { I18nProvider } from "@/components/providers/i18n-provider";

const mocks = vi.hoisted(() => ({
  getWalletDataSource: vi.fn<() => "mock" | "live">(() => "live"),
  fetchMarketOverviewList: vi.fn(),
  fetchCatalogStats: vi.fn(),
}));

vi.mock("@/services/wallet.service", () => ({
  getWalletDataSource: mocks.getWalletDataSource,
}));

vi.mock("@/services/market-overview.service", () => ({
  fetchMarketOverviewList: mocks.fetchMarketOverviewList,
}));

vi.mock("@/services/catalog.service", () => ({
  fetchCatalogStats: mocks.fetchCatalogStats,
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    authorizedFetch: vi.fn(),
    isAuthenticated: false,
  }),
}));

import { useDashboardLandingStats } from "./use-dashboard-landing-stats";

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(I18nProvider, { initialLocale: "ru" }, children);
}

describe("useDashboardLandingStats live policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getWalletDataSource.mockReturnValue("live");
  });

  it("sets error instead of DEMO_STATS when live API fails", async () => {
    mocks.fetchMarketOverviewList.mockRejectedValue(new TypeError("Failed to fetch"));
    mocks.fetchCatalogStats.mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useDashboardLandingStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fetchError).toBeTruthy();
    expect(result.current.stats).toEqual([]);
    expect(result.current.stats.some((s) => s.hint.includes("макет"))).toBe(false);
  });

  it("uses demo stats only in mock mode", async () => {
    mocks.getWalletDataSource.mockReturnValue("mock");

    const { result } = renderHook(() => useDashboardLandingStats(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.live).toBe(false);
    expect(result.current.fetchError).toBeNull();
    expect(result.current.stats.length).toBeGreaterThan(0);
    expect(result.current.stats[0]?.hint).toMatch(/макет/i);
  });
});
