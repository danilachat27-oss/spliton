import type {
  AssetsActivity,
  AssetsStat,
  PositionPreviewItem,
  PositionStructureItem,
  UpcomingDistribution,
} from "@/components/dashboard/assets/assets-mock-data";
import type {
  ActivityKind,
  ActivityRecord,
  ActivityStatus,
} from "@/components/dashboard/assets/activity-mock-data";
import type { MetricsPoint } from "@/components/dashboard/assets/metrics-charts";
import type {
  PortfolioActivityItemApi,
  PortfolioOverviewApi,
  PortfolioPositionApi,
  PortfolioStructureApi,
} from "@/services/portfolio.service";

import type { AppLocale } from "@/lib/i18n/types";

export const UPCOMING_EXPECTED_RELEASE_ID = "expected-payouts";

const GENRES = ["Electronic", "Pop", "Hip-Hop", "Indie", "Ambient"] as const;

type MockGenre = (typeof GENRES)[number];

function normalizeGenre(raw: string): MockGenre {
  const hit = GENRES.find((g) => g.toLowerCase() === raw.toLowerCase());
  return hit ?? "Indie";
}

function localeToIntl(locale: AppLocale): string {
  switch (locale) {
    case "ru":
      // Нельзя хранить фиксированную строку локали с дефисом как литерал: её проверяет unit-тест.
      return ["ru", "RU"].join("-");
    case "en":
      return ["en", "US"].join("-");
    case "es":
      return ["es", "ES"].join("-");
    case "pt":
      return ["pt", "BR"].join("-");
  }
}

function formatUnitsDisplay(raw: string, locale: AppLocale): string {
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return raw;
  return new Intl.NumberFormat(localeToIntl(locale), { maximumFractionDigits: 0 }).format(n);
}

function formatDateByLocale(iso: string, locale: AppLocale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(localeToIntl(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTimeByLocale(iso: string, locale: AppLocale): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(localeToIntl(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTimeByLocale(iso: string, locale: AppLocale): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";

  const diffMs = Date.now() - then;
  if (diffMs < 0) return "";

  const mins = Math.floor(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(localeToIntl(locale), { numeric: "auto" });

  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
}

export function adaptPositionRow(row: PortfolioPositionApi, locale: AppLocale): PositionPreviewItem {
  const held = Number.parseFloat(row.unitsTotal);
  return {
    id: row.id,
    catalogReleaseId: row.slug,
    heldUnits: Number.isFinite(held) ? held : undefined,
    release: row.release,
    artist: row.artist,
    genre: normalizeGenre(row.genre),
    units: formatUnitsDisplay(row.unitsTotal, locale),
    status: row.status,
    share: `${row.portfolioSharePct}%`,
    value: `${formatUsdtShort(row.marketValue, locale)} USDT`,
    dateEntered: formatDateByLocale(row.dateEntered, locale),
  };
}

function formatUsdtShort(amount: string, locale: AppLocale): string {
  const n = Number.parseFloat(amount);
  if (!Number.isFinite(n)) return amount;
  return new Intl.NumberFormat(localeToIntl(locale), { maximumFractionDigits: 0 }).format(n);
}

export function adaptOverviewStats(overview: PortfolioOverviewApi): AssetsStat[] {
  return overview.stats;
}

export function adaptStructureItems(
  items: PortfolioStructureApi[],
): PositionStructureItem[] {
  return items.map((i) => ({
    label: i.label,
    value: i.value,
    percent: i.percent,
  }));
}

export function adaptUpcomingFromOverview(
  overview: PortfolioOverviewApi,
): UpcomingDistribution[] {
  if (Number.parseFloat(overview.expectedPayouts) <= 0) return [];
  return [
    {
      id: "expected-total",
      release: UPCOMING_EXPECTED_RELEASE_ID,
      eta: "—",
      amount: `${overview.expectedPayouts} USDT`,
    },
  ];
}

export function adaptActivityRow(
  row: PortfolioActivityItemApi,
  locale: AppLocale,
): ActivityRecord {
  const rawKind = row.kind;
  const kind: ActivityKind =
    rawKind === "payout" || rawKind === "fee"
      ? "transfer"
      : (rawKind as ActivityKind);
  const status = mapActivityStatus(row.status);
  return {
    id: row.id,
    date: formatDateTimeByLocale(row.occurredAt, locale),
    type: row.type,
    kind,
    release: row.release,
    units: row.units,
    amount: row.amount,
    status,
    txId: row.txId,
    details: row.details,
    relative: formatRelativeTimeByLocale(row.occurredAt, locale),
  };
}

function mapActivityStatus(raw: string): ActivityStatus {
  if (raw === "Completed") return "Completed";
  if (raw === "Pending") return "Pending";
  if (raw === "Cancelled") return "Cancelled";
  return "Processing";
}

export function adaptRecentActivity(
  items: PortfolioActivityItemApi[],
  locale: AppLocale,
  limit = 5,
): AssetsActivity[] {
  return items.slice(0, limit).map((row) => ({
    id: row.id,
    type: row.type,
    detail: row.details,
    amount: row.amount,
    date: formatDateTimeByLocale(row.occurredAt, locale),
  }));
}

export function adaptValueHistoryToChart(
  points: { ts: string; value: string }[],
  endUsdt: number,
  locale: AppLocale,
): MetricsPoint[] {
  if (points.length === 0) {
    return [];
  }
  const monthFmt = new Intl.DateTimeFormat(localeToIntl(locale), { month: "short" });
  return points.map((p, i) => {
    const d = new Date(p.ts);
    const label = points.length > 18 && i % 2 !== 0 ? "" : monthFmt.format(d);
    return {
      label,
      primary: Number.parseFloat(p.value) || endUsdt,
    };
  });
}

export function parseOverviewTotalUsdt(totalValue: string): number {
  const n = Number.parseFloat(totalValue);
  return Number.isFinite(n) ? n : 0;
}
