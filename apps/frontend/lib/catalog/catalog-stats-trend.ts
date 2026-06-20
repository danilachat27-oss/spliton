import type { CatalogStats } from "@/types/catalog/page";

export type CatalogStatTrend = "up" | "down" | "flat";

export type CatalogStatsSnapshot = {
  publicReleases: number;
  livePrimaryRounds: number;
  activeSecondaryListings: number;
  totalVolume24hUsdt: number;
  totalVolume7dUsdt: number;
  savedAt: string;
};

export type CatalogStatsTrends = {
  publicReleases: CatalogStatTrend;
  livePrimaryRounds: CatalogStatTrend;
  activeSecondaryListings: CatalogStatTrend;
  volume24h: CatalogStatTrend;
  volume7d: CatalogStatTrend;
};

export type CatalogStatsDeltas = {
  publicReleases: number | null;
  livePrimaryRounds: number | null;
  activeSecondaryListings: number | null;
  volume24h: number | null;
  volume7d: number | null;
};

function parseMetric(value: number | string | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function snapshotFromCatalogStats(stats: CatalogStats): CatalogStatsSnapshot {
  return {
    publicReleases: stats.publicReleases,
    livePrimaryRounds: stats.livePrimaryRounds,
    activeSecondaryListings: stats.activeSecondaryListings,
    totalVolume24hUsdt: parseMetric(stats.totalVolume24hUsdt),
    totalVolume7dUsdt: parseMetric(stats.totalVolume7dUsdt),
    savedAt: stats.updatedAt,
  };
}

function trendFromDelta(delta: number): CatalogStatTrend {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function compareMetric(current: number, previous: number): { trend: CatalogStatTrend; delta: number } {
  const delta = current - previous;
  return { trend: trendFromDelta(delta), delta };
}

/** Compare two backend snapshots when explicit deltas are provided by the API. */
export function compareCatalogStatsSnapshots(
  previous: CatalogStatsSnapshot,
  current: CatalogStatsSnapshot,
): { trends: CatalogStatsTrends; deltas: CatalogStatsDeltas } {
  const releases = compareMetric(current.publicReleases, previous.publicReleases);
  const rounds = compareMetric(current.livePrimaryRounds, previous.livePrimaryRounds);
  const listings = compareMetric(current.activeSecondaryListings, previous.activeSecondaryListings);
  const vol24 = compareMetric(current.totalVolume24hUsdt, previous.totalVolume24hUsdt);
  const vol7 = compareMetric(current.totalVolume7dUsdt, previous.totalVolume7dUsdt);

  return {
    trends: {
      publicReleases: releases.trend,
      livePrimaryRounds: rounds.trend,
      activeSecondaryListings: listings.trend,
      volume24h: vol24.trend,
      volume7d: vol7.trend,
    },
    deltas: {
      publicReleases: releases.delta,
      livePrimaryRounds: rounds.delta,
      activeSecondaryListings: listings.delta,
      volume24h: vol24.delta,
      volume7d: vol7.delta,
    },
  };
}

export function formatCountDelta(delta: number | null): string | null {
  if (delta == null || delta === 0) return null;
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${Math.abs(delta).toLocaleString("ru-RU", { maximumFractionDigits: 0 })}`;
}

export function formatVolumeDelta(delta: number | null): string | null {
  if (delta == null || Math.abs(delta) < 0.005) return null;
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${Math.abs(delta).toLocaleString("ru-RU", { maximumFractionDigits: 0 })}`;
}

export function trendValueClass(trend: CatalogStatTrend, hasBaseline: boolean): string {
  if (!hasBaseline || trend === "flat") return "text-white";
  if (trend === "up") return "text-emerald-400";
  return "text-rose-400";
}

/** Live KPI cards do not derive trends from browser storage. */
export function resolveCatalogStatsTrends(_stats: CatalogStats): {
  trends: null;
  deltas: null;
  hasBaseline: false;
} {
  return { trends: null, deltas: null, hasBaseline: false };
}

const LEGACY_BASELINE_STORAGE_KEY = "spliton:catalog-stats-baseline:v1";

/** Guard against resurrecting localStorage-based KPI deltas in live mode. */
export function readLegacyCatalogStatsBaseline(): CatalogStatsSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_BASELINE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CatalogStatsSnapshot;
  } catch {
    return null;
  }
}
