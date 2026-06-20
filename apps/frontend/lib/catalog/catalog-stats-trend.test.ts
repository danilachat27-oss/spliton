import { describe, expect, it, vi } from "vitest";

import {
  compareCatalogStatsSnapshots,
  formatCountDelta,
  readLegacyCatalogStatsBaseline,
  resolveCatalogStatsTrends,
  snapshotFromCatalogStats,
  trendValueClass,
} from "@/lib/catalog/catalog-stats-trend";

describe("catalog stats trend", () => {
  it("detects up and down trends from backend snapshots", () => {
    const previous = snapshotFromCatalogStats({
      publicReleases: 200,
      livePrimaryRounds: 60,
      activeSecondaryListings: 1,
      totalVolume24hUsdt: "700",
      totalVolume7dUsdt: "100",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    const current = snapshotFromCatalogStats({
      publicReleases: 221,
      livePrimaryRounds: 70,
      activeSecondaryListings: 0,
      totalVolume24hUsdt: "800",
      totalVolume7dUsdt: "0",
      updatedAt: "2026-01-02T00:00:00Z",
    });

    const { trends, deltas } = compareCatalogStatsSnapshots(previous, current);
    expect(trends.publicReleases).toBe("up");
    expect(trends.livePrimaryRounds).toBe("up");
    expect(trends.activeSecondaryListings).toBe("down");
    expect(trends.volume24h).toBe("up");
    expect(trends.volume7d).toBe("down");
    expect(deltas.publicReleases).toBe(21);
    expect(formatCountDelta(deltas.publicReleases)).toBe("+21");
  });

  it("does not expose live KPI trends without backend deltas", () => {
    const result = resolveCatalogStatsTrends({
      publicReleases: 10,
      livePrimaryRounds: 2,
      activeSecondaryListings: 1,
      totalVolume24hUsdt: "100",
      totalVolume7dUsdt: "200",
      updatedAt: "2026-01-01T00:00:00Z",
    });
    expect(result.hasBaseline).toBe(false);
    expect(result.trends).toBeNull();
    expect(result.deltas).toBeNull();
  });

  it("ignores legacy localStorage baseline for live KPI rendering", () => {
    const storage = {
      getItem: (key: string) =>
        key === "spliton:catalog-stats-baseline:v1"
          ? JSON.stringify({
              publicReleases: 1,
              livePrimaryRounds: 1,
              activeSecondaryListings: 1,
              totalVolume24hUsdt: 1,
              totalVolume7dUsdt: 1,
              savedAt: "2026-01-01T00:00:00Z",
            })
          : null,
    };
    vi.stubGlobal("window", { localStorage: storage } as Window & typeof globalThis);

    expect(readLegacyCatalogStatsBaseline()?.publicReleases).toBe(1);
    expect(
      resolveCatalogStatsTrends({
        publicReleases: 999,
        livePrimaryRounds: 999,
        activeSecondaryListings: 999,
        totalVolume24hUsdt: "999",
        totalVolume7dUsdt: "999",
        updatedAt: "2026-01-02T00:00:00Z",
      }).hasBaseline,
    ).toBe(false);

    vi.unstubAllGlobals();
  });

  it("maps trend to value color classes only when baseline exists", () => {
    expect(trendValueClass("up", true)).toContain("emerald");
    expect(trendValueClass("down", true)).toContain("rose");
    expect(trendValueClass("up", false)).toBe("text-white");
  });
});
