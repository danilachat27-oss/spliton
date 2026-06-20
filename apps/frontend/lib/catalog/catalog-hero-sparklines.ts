import type { ExchangeNeonTrend } from "@/components/shared/charts/exchange-neon-sparkline";
import type { CatalogStats } from "@/types/catalog/page";

export type CatalogHeroSparkline = {
  values: number[];
  trend: ExchangeNeonTrend;
  /** Muted flat line when there is no meaningful history to show. */
  muted?: boolean;
};

function parseMetric(value: number | string | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

function flatSeries(value: number, points = 12): number[] {
  const v = Math.max(value, 0);
  return Array.from({ length: points }, () => v);
}

function rampSeries(start: number, end: number, points = 12): number[] {
  const a = Math.max(start, 0);
  const b = Math.max(end, 0);
  if (points <= 1) return [b];
  if (Math.abs(b - a) < 0.001) return flatSeries(b, points);
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    return a + (b - a) * t;
  });
}

function trendFromValues(values: number[]): ExchangeNeonTrend {
  if (values.length < 2) return "flat";
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const delta = last - first;
  const threshold = Math.max(Math.abs(last) * 0.04, 0.01);
  if (delta > threshold) return "up";
  if (delta < -threshold) return "down";
  return "flat";
}

/** Volume sparkline: only interpolate when both 24h and 7d totals exist. */
function buildVolumeSeries(vol24: number, vol7: number): number[] {
  if (vol24 <= 0 && vol7 <= 0) {
    return flatSeries(0);
  }
  if (vol7 <= 0 || vol24 <= 0) {
    return flatSeries(Math.max(vol24, 0));
  }

  const dayAvg = vol7 / 7;
  const start = Math.min(dayAvg, vol24);
  return rampSeries(start, vol24);
}

export function buildCatalogHeroSparklines(stats: CatalogStats): {
  releases: CatalogHeroSparkline;
  volume: CatalogHeroSparkline;
  listings: CatalogHeroSparkline;
} {
  const releases = stats.publicReleases;
  const listings = stats.activeSecondaryListings;
  const vol24 = parseMetric(stats.totalVolume24hUsdt);
  const vol7 = parseMetric(stats.totalVolume7dUsdt);

  const releaseValues = flatSeries(releases);
  const listingValues = flatSeries(listings);
  const volumeValues = buildVolumeSeries(vol24, vol7);

  return {
    releases: {
      values: releaseValues,
      trend: "flat",
      muted: false,
    },
    volume: {
      values: volumeValues,
      trend: vol24 > 0 && vol7 > 0 ? trendFromValues(volumeValues) : "flat",
      muted: vol24 <= 0 && vol7 <= 0,
    },
    listings: {
      values: listingValues,
      trend: "flat",
      muted: listings <= 0,
    },
  };
}
