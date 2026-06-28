import type { MarketTopCardMetrics } from "@/constants/market-overview/page";
import { MARKET_SUMMARY_PANELS } from "@/constants/market-overview/page";
import { resolveChartSeries } from "@/lib/market-overview/chart-series";
import { formatUsdtCompact } from "@/lib/market-overview/format";
import { DICTIONARIES, lookupDictionaryMessage } from "@/lib/i18n/dictionaries";
import type { AppLocale } from "@/lib/i18n/types";
import type {
  MarketOverviewChartsApi,
  MarketOverviewStatsApi,
} from "@/services/market-overview.service";
import type { MarketOverviewPeriod } from "@/types/market-overview";

type ChartPoint = { ts: string; value: string | number };

function mo(locale: AppLocale, key: string, vars?: Record<string, string | number>): string {
  const raw = lookupDictionaryMessage(DICTIONARIES[locale], key, locale, {
    enMessages: DICTIONARIES.en,
  });
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
    raw,
  );
}

function isHighLiquidityLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  return normalized === "высокая" || normalized === "high" || normalized === "deep";
}

function chartSeriesValues(points: ChartPoint[] | undefined): number[] {
  if (!points?.length) return [];
  return points.map((p) => Number(p.value) || 0);
}

function seriesDelta(points: number[]): string {
  if (points.length < 2) return "±0%";
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (first === 0) return last > 0 ? "+100%" : "±0%";
  const pct = ((last - first) / first) * 100;
  if (Math.abs(pct) < 0.05) return "±0%";
  return `${pct > 0 ? "+" : ""}${pct.toFixed(1).replace(".", ",")}%`;
}

function formatVolumeMetric(raw: string | number | undefined): string {
  const n = Number.parseFloat(String(raw ?? 0));
  if (!Number.isFinite(n) || n <= 0) return "0 USDT";
  return `${formatUsdtCompact(n)} USDT`;
}

function deepCatalogShare(stats: MarketOverviewStatsApi): string {
  const liq = stats.distributions?.liquidity ?? [];
  const high = liq.find((l) => isHighLiquidityLabel(l.label))?.count ?? 0;
  const total = liq.reduce((s, l) => s + l.count, 0);
  if (total === 0) return "0%";
  return `${Math.round((high / total) * 100)}%`;
}

function deepCatalogSharePercent(stats: MarketOverviewStatsApi): number {
  const liq = stats.distributions?.liquidity ?? [];
  const high = liq.find((l) => isHighLiquidityLabel(l.label))?.count ?? 0;
  const total = liq.reduce((s, l) => s + l.count, 0);
  if (total === 0) return 0;
  return Math.round((high / total) * 100);
}

export function buildLiveTopCardMetrics(
  stats: MarketOverviewStatsApi,
  charts: MarketOverviewChartsApi | null,
  period: MarketOverviewPeriod,
): MarketTopCardMetrics[MarketOverviewPeriod] {
  const volumeSeries = chartSeriesValues(charts?.series?.volume);
  const raisedSeries = chartSeriesValues(charts?.series?.raised);
  const secondarySeries = chartSeriesValues(charts?.series?.secondaryVolume);
  const liquiditySeries = chartSeriesValues(charts?.series?.liquidity);
  const listingsSeries = chartSeriesValues(charts?.series?.activeListings);

  const periodVolume =
    period === "24h"
      ? stats.secondaryMarket?.volume24hUsdt
      : period === "7d"
        ? stats.secondaryMarket?.volume7dUsdt
        : period === "30d"
          ? stats.secondaryMarket?.volume30dUsdt
          : stats.secondaryMarket?.volumeUsdt;

  const activeCount = stats.totals?.publicReleases ?? 0;
  const newCount = stats.primaryMarket?.activeRounds ?? stats.totals?.activePrimaryRounds ?? 0;
  const deepSharePct = deepCatalogSharePercent(stats);
  const secondaryBase = Number.parseFloat(String(periodVolume ?? stats.secondaryMarket?.volumeUsdt ?? 0)) || 0;

  const activeBars = resolveChartSeries(
    volumeSeries.length >= 2 ? volumeSeries : listingsSeries,
    activeCount,
    "wave",
  );
  const newBars = resolveChartSeries(raisedSeries, newCount, "up");
  const deepCatalogBars = resolveChartSeries(liquiditySeries, deepSharePct, "flat");
  const secondaryBars = resolveChartSeries(secondarySeries, Math.max(secondaryBase / 10_000, 1), "pulse");

  return {
    activeCount: String(activeCount),
    activeDelta: seriesDelta(activeBars),
    activeBars,
    newCount: String(newCount),
    newDelta: seriesDelta(newBars),
    newBars,
    deepCatalogShare: deepCatalogShare(stats),
    deepCatalogDelta: seriesDelta(deepCatalogBars),
    deepCatalogBars,
    secondaryVol: formatVolumeMetric(periodVolume),
    secondaryDelta: seriesDelta(secondaryBars),
    secondaryBars,
  };
}

export type MarketSummaryPanelLive = {
  id: (typeof MARKET_SUMMARY_PANELS)[number]["id"];
  title: string;
  caption: string;
  displayValue: string;
  series: number[];
  foot: string;
  bars?: { label: string; value: number; widthPct: number }[];
};

export function buildLiveSummaryPanels(
  stats: MarketOverviewStatsApi,
  charts: MarketOverviewChartsApi | null,
): MarketSummaryPanelLive[] {
  const genres = stats.distributions?.genres ?? [];
  const maxGenreVol = Math.max(...genres.map((g) => Number(g.volumeUsdt) || 0), 1);
  const genreBars = genres.slice(0, 4).map((g) => {
    const value = Number(g.volumeUsdt) || g.count;
    return {
      label: g.name,
      value: Math.round(value),
      widthPct: Math.round(((Number(g.volumeUsdt) || g.count) / maxGenreVol) * 100),
    };
  });

  const raised = chartSeriesValues(charts?.series?.raised);
  const trades = chartSeriesValues(charts?.series?.tradesCount);
  const secondary = chartSeriesValues(charts?.series?.secondaryVolume);
  const listings = chartSeriesValues(charts?.series?.activeListings);

  const activeRounds = stats.primaryMarket?.activeRounds ?? 0;
  const tradesCount = stats.totals?.tradesCount ?? stats.secondaryMarket?.tradesCount ?? 0;
  const genreIndex = genreBars.reduce((sum, bar) => sum + bar.value, 0) || (stats.totals?.publicReleases ?? 0);
  const secondaryVolRaw = Number.parseFloat(String(stats.secondaryMarket?.volumeUsdt ?? 0)) || 0;
  const secondaryVolDisplay = formatVolumeMetric(stats.secondaryMarket?.volumeUsdt).replace(" USDT", "");

  return [
    {
      id: "segments-primary",
      title: "Новые первичные раунды",
      caption: `Активных раундов ${activeRounds}`,
      displayValue: String(activeRounds),
      series: resolveChartSeries(raised, activeRounds, "up"),
      foot: "Данные Spliton по первичным раундам за выбранный период.",
      bars: genreBars.length ? genreBars : undefined,
    },
    {
      id: "genre-activity",
      title: "Активность по жанрам",
      caption: "Объём 7D по жанрам, USDT",
      displayValue: String(genreIndex),
      series: resolveChartSeries(
        genreBars.map((b) => b.value),
        genreIndex,
        "wave",
      ),
      foot: "Разбивка по жанрам из агрегата каталога.",
      bars: genreBars,
    },
    {
      id: "order-flow",
      title: "Поток заявок в стакан",
      caption: `Сделок за период ${tradesCount}`,
      displayValue: String(tradesCount),
      series: resolveChartSeries(trades.length ? trades : listings, tradesCount, "flat"),
      foot: "Индекс сделок и листингов за окно.",
    },
    {
      id: "secondary-demand",
      title: "Спрос secondary",
      caption: formatVolumeMetric(stats.secondaryMarket?.volumeUsdt),
      displayValue: secondaryVolDisplay,
      series: resolveChartSeries(secondary, Math.max(secondaryVolRaw / 10_000, 1), "pulse"),
      foot: "Оборот перепродаж UNT за период.",
    },
  ];
}

export type MarketSegmentLiveRow = {
  id: string;
  label: string;
  deepPlusShare: string;
  stability: string;
  activity: string;
  demand: string;
  liquidity: string;
};

function genreToSlug(name: string): string {
  const s = name.toLowerCase();
  if (s.includes("hip")) return "hiphop";
  if (s.includes("lo-fi") || s === "lofi") return "lofi";
  if (s.includes("pop")) return "pop";
  if (s.includes("electronic") || s.includes("edm")) return "electronic";
  if (s.includes("indie")) return "indie";
  return s.replace(/\s+/g, "-").slice(0, 24) || "other";
}

export function mapGenresToSegmentRows(
  genres: MarketOverviewStatsApi["distributions"]["genres"],
): MarketSegmentLiveRow[] {
  if (!genres?.length) return [];
  const maxCount = Math.max(...genres.map((g) => g.count), 1);
  return genres.slice(0, 8).map((g) => ({
    id: genreToSlug(g.name),
    label: g.name,
    deepPlusShare: `${Math.round((g.count / maxCount) * 100)}%`,
    stability: "—",
    activity: String(g.count),
    demand: formatVolumeMetric(g.volumeUsdt).replace(" USDT", ""),
    liquidity: "—",
  }));
}

export type MarketSecondaryLiveSnapshot = {
  resaleVolume: string;
  activeLots: string;
  medianExitHours: string;
  topDemand: string;
};

export function mapSecondaryLiveSnapshot(
  stats: MarketOverviewStatsApi,
  locale: AppLocale = "en",
): MarketSecondaryLiveSnapshot {
  const top = stats.topReleases?.byVolume?.[0];
  const topDemand = top ? `${top.symbol} · ${top.title}` : "—";
  const tradesCount = stats.secondaryMarket?.tradesCount ?? 0;
  return {
    resaleVolume: formatVolumeMetric(stats.secondaryMarket?.volumeUsdt),
    activeLots: String(stats.secondaryMarket?.activeListings ?? 0),
    medianExitHours:
      tradesCount > 0 ? mo(locale, "marketOverview.secondary.tradesCount", { count: tradesCount }) : "—",
    topDemand,
  };
}

export type MarketInsightLiveItem = {
  id: string;
  tag: string;
  body: string;
  metric: string;
  metricCaption: string;
  detail: string;
};

export function mapTopReleasesToInsights(
  stats: MarketOverviewStatsApi,
  period: string,
  locale: AppLocale = "en",
): MarketInsightLiveItem[] {
  const periodLabel = period.toUpperCase();
  const blocks: {
    key: keyof MarketOverviewStatsApi["topReleases"];
    tagKey: string;
    captionKey: string;
  }[] = [
    { key: "byVolume", tagKey: "marketOverview.insights.live.tag.byVolume", captionKey: "marketOverview.insights.live.caption.turnover7d" },
    { key: "byYield", tagKey: "marketOverview.insights.live.tag.byYield", captionKey: "marketOverview.insights.live.caption.expectedYield" },
    { key: "byLiquidity", tagKey: "marketOverview.insights.live.tag.byLiquidity", captionKey: "marketOverview.insights.live.caption.liquidityIndex" },
    { key: "byProgress", tagKey: "marketOverview.insights.live.tag.byProgress", captionKey: "marketOverview.insights.live.caption.roundProgress" },
  ];

  return blocks.map((block) => {
    const tag = mo(locale, block.tagKey, { period: periodLabel });
    const row = stats.topReleases?.[block.key]?.[0];
    if (!row) {
      return {
        id: `empty-${block.key}`,
        tag,
        metric: "—",
        metricCaption: mo(locale, "marketOverview.insights.live.empty.metricCaption"),
        body: mo(locale, "marketOverview.insights.live.empty.body"),
        detail: mo(locale, "marketOverview.insights.live.empty.detail"),
      };
    }
    const metric =
      block.key === "byYield" || block.key === "byProgress"
        ? `${row.value}%`
        : formatVolumeMetric(row.value).replace(" USDT", "");
    return {
      id: `live-${block.key}`,
      tag,
      metric,
      metricCaption: `${row.symbol} · ${mo(locale, block.captionKey)}`,
      body: `${row.title} — ${row.artist}`,
      detail: mo(locale, "marketOverview.insights.live.top.detail", { tag }),
    };
  });
}
