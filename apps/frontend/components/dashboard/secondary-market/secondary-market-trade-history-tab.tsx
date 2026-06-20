"use client";

import * as React from "react";

import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { statusLabel } from "@/lib/i18n/status-labels";
import type { AppLocale } from "@/lib/i18n/types";
import { ROUTES } from "@/constants/routes";
import { getWalletDataSource } from "@/services/wallet.service";
import { useSecondaryMarketTrades } from "@/hooks/use-secondary-market-live";
import {
  SecondaryMarketAuthGate,
  SecondaryMarketErrorState,
  SecondaryMarketLoadingState,
} from "@/components/dashboard/secondary-market/secondary-market-fetch-states";
import {
  countActiveTradeHistoryFilters,
  SecondaryMarketTradeHistoryFiltersSheet,
  tradeHistoryFiltersSummary,
  type TradeHistoryFiltersState,
} from "@/components/dashboard/secondary-market/secondary-market-trade-history-filters-sheet";
import { SecondaryMarketTradeDetailSheet } from "@/components/dashboard/secondary-market/secondary-market-trade-detail-sheet";
import { ArrowDown, ArrowUp, ChevronDown, Download, ExternalLink, LayoutPanelTop, MoreHorizontal, Search, SlidersHorizontal } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";

import {
  secondaryMarketBookHref,
  secondaryMarketBookIdForSymbol,
  secondaryMarketHref,
} from "@/constants/dashboard/secondary-market";
import {
  analyticsReleaseDetailPath,
  secondaryMarketReleaseAnalyticsPath,
} from "@/constants/routes";
import { getSecondaryMarketAnalyticsCatalogIdForReleaseSlug } from "@/mocks/dashboard/secondary-market-listings.mock";
import { cn } from "@/lib/utils";

import {
  smTableActionIconCircle,
  smTableActionIconCirclePressed,
  smTableActionMenuItemLink,
  smTableActionMenuItemMuted,
  smTableActionMenuItemSecondary,
  smTableActionMoreMenu,
  smTableActionReleasePill,
  smTableActionSecondaryPill,
} from "@/components/dashboard/secondary-market/secondary-market-table-action-styles";

type TradeSide = "buy" | "sell";
type SettlementStatus = "settled" | "processing" | "failed";

export type SecondaryMarketUserTradeMock = {
  id: string;
  /** ISO 8601, время исполнения на бирже. */
  timestamp: string;
  releaseId: string;
  releaseSlug: string;
  title: string;
  artist: string;
  ticker: string;
  genre: "electronic" | "pop" | "hiphop" | "rock";
  side: TradeSide;
  units: number;
  /** Цена исполнения за unit, USDT. */
  price: number;
  /** Gross без комиссии. */
  grossAmount: number;
  feeAmount: number;
  /** Покупка: списано всего (gross+fee). Продажа: зачислено нетто (gross−fee). */
  netAmount: number;
  settlementStatus: SettlementStatus;
  linkedOrderId: string;
  linkedListingId: string;
};

/** Демо-история: только исполненные сделки пользователя (ledger). */
const MOCK_TRADES_SEED: SecondaryMarketUserTradeMock[] = [
  {
    id: "trd-a901",
    timestamp: "2026-04-21T14:32:00",
    releaseId: "midnight-run",
    releaseSlug: "midnight-run",
    title: "Midnight Run",
    artist: "Nova Lane",
    ticker: "MNR",
    genre: "electronic",
    side: "buy",
    units: 24,
    price: 18.5,
    grossAmount: 444,
    feeAmount: 0.67,
    netAmount: 444.67,
    settlementStatus: "settled",
    linkedOrderId: "ord-8f2a",
    linkedListingId: "lst-mnr",
  },
  {
    id: "trd-a8ff",
    timestamp: "2026-04-21T09:10:00",
    releaseId: "midnight-run",
    releaseSlug: "midnight-run",
    title: "Midnight Run",
    artist: "Nova Lane",
    ticker: "MNR",
    genre: "electronic",
    side: "sell",
    units: 40,
    price: 18.52,
    grossAmount: 740.8,
    feeAmount: 1.11,
    netAmount: 739.69,
    settlementStatus: "settled",
    linkedOrderId: "ord-7c11",
    linkedListingId: "lst-mnr",
  },
  {
    id: "trd-a712",
    timestamp: "2026-04-18T16:22:00",
    releaseId: "midnight-run",
    releaseSlug: "midnight-run",
    title: "Midnight Run",
    artist: "Nova Lane",
    ticker: "MNR",
    genre: "electronic",
    side: "buy",
    units: 12,
    price: 18.48,
    grossAmount: 221.76,
    feeAmount: 0.33,
    netAmount: 222.09,
    settlementStatus: "settled",
    linkedOrderId: "ord-6d90",
    linkedListingId: "lst-mnr",
  },
  {
    id: "trd-9c40",
    timestamp: "2026-04-17T09:15:00",
    releaseId: "signal-noise",
    releaseSlug: "signal-noise",
    title: "Signal / Noise",
    artist: "Kairo",
    ticker: "SGN",
    genre: "hiphop",
    side: "sell",
    units: 20,
    price: 22.15,
    grossAmount: 443,
    feeAmount: 0.66,
    netAmount: 442.34,
    settlementStatus: "processing",
    linkedOrderId: "ord-9c40",
    linkedListingId: "lst-sgn",
  },
  {
    id: "trd-8b21",
    timestamp: "2026-04-14T14:30:00",
    releaseId: "glassline",
    releaseSlug: "glassline",
    title: "Glassline",
    artist: "The Static",
    ticker: "GLS",
    genre: "rock",
    side: "buy",
    units: 25,
    price: 9.05,
    grossAmount: 226.25,
    feeAmount: 0.34,
    netAmount: 226.59,
    settlementStatus: "settled",
    linkedOrderId: "ord-8b21",
    linkedListingId: "lst-gls",
  },
  {
    id: "trd-7a03",
    timestamp: "2026-04-10T08:00:00",
    releaseId: "aurora-drift",
    releaseSlug: "aurora-drift",
    title: "Aurora Drift",
    artist: "Mira Sol",
    ticker: "AUR",
    genre: "pop",
    side: "buy",
    units: 10,
    price: 11.2,
    grossAmount: 112,
    feeAmount: 0.17,
    netAmount: 112.17,
    settlementStatus: "processing",
    linkedOrderId: "ord-7a03",
    linkedListingId: "lst-aur",
  },
  {
    id: "trd-6f88",
    timestamp: "2026-03-28T19:12:00",
    releaseId: "velvet-room",
    releaseSlug: "velvet-room",
    title: "Velvet Room",
    artist: "June & Co",
    ticker: "VLT",
    genre: "pop",
    side: "sell",
    units: 8,
    price: 6.9,
    grossAmount: 55.2,
    feeAmount: 0.08,
    netAmount: 55.12,
    settlementStatus: "settled",
    linkedOrderId: "ord-6f88",
    linkedListingId: "lst-vlt",
  },
  {
    id: "trd-5d12",
    timestamp: "2026-03-15T10:00:00",
    releaseId: "signal-noise",
    releaseSlug: "signal-noise",
    title: "Signal / Noise",
    artist: "Kairo",
    ticker: "SGN",
    genre: "hiphop",
    side: "buy",
    units: 6,
    price: 21.9,
    grossAmount: 131.4,
    feeAmount: 0.2,
    netAmount: 131.6,
    settlementStatus: "settled",
    linkedOrderId: "ord-5d12",
    linkedListingId: "lst-sgn",
  },
  {
    id: "trd-4e33",
    timestamp: "2026-03-02T11:20:00",
    releaseId: "glassline",
    releaseSlug: "glassline",
    title: "Glassline",
    artist: "The Static",
    ticker: "GLS",
    genre: "rock",
    side: "sell",
    units: 15,
    price: 9.12,
    grossAmount: 136.8,
    feeAmount: 0.21,
    netAmount: 136.59,
    settlementStatus: "settled",
    linkedOrderId: "ord-4e33",
    linkedListingId: "lst-gls",
  },
  {
    id: "trd-3c91",
    timestamp: "2026-02-18T16:45:00",
    releaseId: "midnight-run",
    releaseSlug: "midnight-run",
    title: "Midnight Run",
    artist: "Nova Lane",
    ticker: "MNR",
    genre: "electronic",
    side: "buy",
    units: 8,
    price: 18.2,
    grossAmount: 145.6,
    feeAmount: 0.22,
    netAmount: 145.82,
    settlementStatus: "failed",
    linkedOrderId: "ord-3c91",
    linkedListingId: "lst-mnr",
  },
  {
    id: "trd-2b07",
    timestamp: "2026-02-01T09:30:00",
    releaseId: "velvet-room",
    releaseSlug: "velvet-room",
    title: "Velvet Room",
    artist: "June & Co",
    ticker: "VLT",
    genre: "pop",
    side: "buy",
    units: 30,
    price: 6.85,
    grossAmount: 205.5,
    feeAmount: 0.31,
    netAmount: 205.81,
    settlementStatus: "settled",
    linkedOrderId: "ord-2b07",
    linkedListingId: "lst-vlt",
  },
  {
    id: "trd-1a55",
    timestamp: "2026-01-12T13:05:00",
    releaseId: "aurora-drift",
    releaseSlug: "aurora-drift",
    title: "Aurora Drift",
    artist: "Mira Sol",
    ticker: "AUR",
    genre: "pop",
    side: "sell",
    units: 12,
    price: 11.05,
    grossAmount: 132.6,
    feeAmount: 0.2,
    netAmount: 132.4,
    settlementStatus: "settled",
    linkedOrderId: "ord-1a55",
    linkedListingId: "lst-aur",
  },
];

const DEFAULT_FILTERS: TradeHistoryFiltersState = {
  period: "30d",
  sideFilter: "all",
  settlementFilter: "all",
  genreFilter: "all",
  query: "",
  sortKey: "time",
  sortDir: "desc",
};

type SortKey = TradeHistoryFiltersState["sortKey"];
type SortDir = TradeHistoryFiltersState["sortDir"];

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function periodCutoffMs(period: TradeHistoryFiltersState["period"]): number | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return Date.now() - days * 86400000;
}

function inPeriod(row: SecondaryMarketUserTradeMock, period: TradeHistoryFiltersState["period"]): boolean {
  const ms = periodCutoffMs(period);
  if (ms == null) return true;
  return new Date(row.timestamp).getTime() >= ms;
}

function CoverThumb({ ticker }: { ticker: string }) {
  const hue = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-9 shrink-0 rounded-xl ring-1 ring-white/10"
      style={{
        background: `linear-gradient(145deg, hsl(${hue}, 42%, 26%) 0%, hsl(${(hue + 48) % 360}, 28%, 10%) 100%)`,
      }}
      aria-hidden
    />
  );
}

function settlementLabel(s: SettlementStatus, locale: AppLocale): string {
  return statusLabel("trade", s, locale);
}

function formatMessage(template: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );
}

function tm(t: (key: string) => string, key: string, params?: Record<string, string | number>): string {
  const raw = t(key);
  return params ? formatMessage(raw, params) : raw;
}

function settlementTooltip(s: SettlementStatus, t: (key: string) => string): string {
  switch (s) {
    case "settled":
      return t("secondaryMarket.trade.settlementTooltip.settled");
    case "processing":
      return t("secondaryMarket.trade.settlementTooltip.processing");
    case "failed":
      return t("secondaryMarket.trade.settlementTooltip.failed");
    default:
      return "";
  }
}

function settlementPillClass(s: SettlementStatus) {
  switch (s) {
    case "settled":
      return "bg-[#B7F500]/12 text-[#d4f570] ring-1 ring-[#B7F500]/22";
    case "processing":
      return "bg-amber-500/12 text-amber-200/95 ring-1 ring-amber-400/20";
    case "failed":
      return "bg-fuchsia-500/12 text-fuchsia-200/90 ring-1 ring-fuchsia-400/22";
    default:
      return "bg-zinc-600/20 text-zinc-400";
  }
}

function releaseAssetHref(releaseId: string) {
  const catalogId = getSecondaryMarketAnalyticsCatalogIdForReleaseSlug(releaseId);
  return `${analyticsReleaseDetailPath(catalogId)}?from=secondary`;
}

function tradeAnalyticsHref(releaseId: string) {
  return secondaryMarketReleaseAnalyticsPath(releaseId);
}

function stackHrefForTicker(ticker: string): string | null {
  const id = secondaryMarketBookIdForSymbol(ticker);
  return id ? secondaryMarketBookHref(id) : null;
}

const PERIOD_QUICK = [
  { id: "7d" as const, key: "secondaryMarket.filters.period7d" },
  { id: "30d" as const, key: "secondaryMarket.filters.period30d" },
  { id: "90d" as const, key: "secondaryMarket.filters.period90d" },
  { id: "all" as const, key: "secondaryMarket.filters.periodAll" },
] as const;

function buildCsv(rows: SecondaryMarketUserTradeMock[]): string {
  const header = [
    "timestamp",
    "id",
    "ticker",
    "title",
    "side",
    "units",
    "price",
    "gross_usdt",
    "fee_usdt",
    "net_usdt",
    "settlement",
    "order_id",
    "listing_id",
  ].join(",");
  const lines = rows.map((r) =>
    [
      r.timestamp,
      r.id,
      r.ticker,
      `"${r.title.replace(/"/g, '""')}"`,
      r.side,
      r.units,
      r.price,
      r.grossAmount,
      r.feeAmount,
      r.netAmount,
      r.settlementStatus,
      r.linkedOrderId,
      r.linkedListingId,
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

function SortTh({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th className={cn("px-3 py-2.5 font-normal", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
          align === "right" && "ml-auto flex-row-reverse",
          active ? "text-[#d4f570]" : "text-zinc-600 hover:text-zinc-400",
        )}
      >
        {label}
        {active ? (
          dir === "desc" ? (
            <ArrowDown className="size-3 shrink-0 opacity-80" aria-hidden />
          ) : (
            <ArrowUp className="size-3 shrink-0 opacity-80" aria-hidden />
          )
        ) : (
          <ChevronDown className="size-3 shrink-0 opacity-40" aria-hidden />
        )}
      </button>
    </th>
  );
}

function TableSkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl bg-[#111111] ring-1 ring-white/6">
      <div className="border-b border-white/8 px-3 py-2.5">
        <div className="h-3 w-40 animate-pulse rounded bg-zinc-800" />
      </div>
      <div className="divide-y divide-white/5 p-3 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-zinc-800" />
            <div className="h-9 flex-1 animate-pulse rounded-lg bg-zinc-800/80" />
            <div className="h-9 w-20 shrink-0 animate-pulse rounded-lg bg-zinc-800/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SecondaryMarketTradeHistoryTab() {
  const isLive = getWalletDataSource() === "live";
  const { isAuthenticated, authorizedFetch } = useAuth();
  const { locale, t } = useI18n();
  const liveTrades = useSecondaryMarketTrades();
  const [mockTrades, setMockTrades] = React.useState<SecondaryMarketUserTradeMock[]>([]);
  const [mockLoading, setMockLoading] = React.useState(!isLive);
  const trades = isLive ? liveTrades.trades : mockTrades;
  const loading = isLive ? liveTrades.loading : mockLoading;
  const [filters, setFilters] = React.useState<TradeHistoryFiltersState>(DEFAULT_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [selectedTrade, setSelectedTrade] = React.useState<SecondaryMarketUserTradeMock | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isLive) return;
    const t = window.setTimeout(() => {
      setMockTrades(MOCK_TRADES_SEED);
      setMockLoading(false);
    }, 520);
    return () => window.clearTimeout(t);
  }, [isLive]);

  React.useEffect(() => {
    if (!openMenuId) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openMenuId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTrade(null);
        setOpenMenuId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const summaryRows = React.useMemo(
    () => trades.filter((t) => inPeriod(t, filters.period)),
    [trades, filters.period],
  );

  const summary = React.useMemo(() => {
    let turnover = 0;
    let fees = 0;
    let buys = 0;
    let sells = 0;
    for (const t of summaryRows) {
      turnover += t.grossAmount;
      fees += t.feeAmount;
      if (t.side === "buy") buys += 1;
      else sells += 1;
    }
    return { count: summaryRows.length, turnover, fees, buys, sells };
  }, [summaryRows]);

  const filteredSorted = React.useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const rows = trades.filter((row) => {
      if (!inPeriod(row, filters.period)) return false;
      if (filters.sideFilter !== "all" && row.side !== filters.sideFilter) return false;
      if (filters.settlementFilter !== "all" && row.settlementStatus !== filters.settlementFilter) return false;
      if (filters.genreFilter !== "all" && row.genre !== filters.genreFilter) return false;
      if (!q) return true;
      return (
        row.id.toLowerCase().includes(q) ||
        row.ticker.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        row.artist.toLowerCase().includes(q) ||
        row.linkedOrderId.toLowerCase().includes(q)
      );
    });
    const dir = filters.sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (filters.sortKey === "time") {
        return dir * (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
      if (filters.sortKey === "gross") return dir * (a.grossAmount - b.grossAmount);
      return dir * (a.price - b.price);
    });
  }, [trades, filters]);

  const activeFilterCount = countActiveTradeHistoryFilters(filters);

  const patchFilters = React.useCallback((patch: Partial<TradeHistoryFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleSort = (key: SortKey) => {
    setFilters((prev) => {
      if (prev.sortKey === key) {
        return { ...prev, sortDir: prev.sortDir === "desc" ? "asc" : "desc" };
      }
      return { ...prev, sortKey: key, sortDir: "desc" };
    });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const exportCsv = () => {
    const blob = new Blob([buildCsv(filteredSorted)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Spliton-secondary-trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("secondaryMarket.trade.toastCsvExported"));
  };

  const drawerTrade = React.useMemo(() => {
    if (!selectedTrade) return null;
    return trades.find((t) => t.id === selectedTrade.id) ?? selectedTrade;
  }, [trades, selectedTrade]);

  const marketHref = secondaryMarketHref("market");
  const catalogOverviewHref = ROUTES.catalogMarketOverview;

  if (isLive && !isAuthenticated) {
    return <SecondaryMarketAuthGate />;
  }
  if (isLive && liveTrades.loading && liveTrades.trades.length === 0) {
    return <SecondaryMarketLoadingState label={t("secondaryMarket.trade.loadingHistory")} />;
  }
  if (isLive && liveTrades.error) {
    return (
      <SecondaryMarketErrorState message={liveTrades.error} onRetry={() => void liveTrades.reload()} />
    );
  }

  return (
    <div className="relative space-y-6">
      <p className="max-w-[62ch] font-mono text-[11px] leading-relaxed text-zinc-600">
        {t("secondaryMarket.trade.intro")}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-[#111111] p-4 ring-1 ring-white/6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.trade.kpiTrades")}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">{summary.count}</p>
          <p className="mt-1 font-mono text-[10px] text-zinc-600">{t("secondaryMarket.trade.kpiForPeriod")}</p>
        </div>
        <div className="rounded-2xl bg-[#111111] p-4 ring-1 ring-white/6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.trade.kpiTurnover")}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">{formatUsdt(summary.turnover)}</p>
          <p className="mt-1 font-mono text-[10px] text-zinc-600">{t("secondaryMarket.trade.kpiGrossUsdt")}</p>
        </div>
        <div className="rounded-2xl bg-[#111111] p-4 ring-1 ring-white/6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.trade.fee")}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-300">{formatUsdt(summary.fees)}</p>
          <p className="mt-1 font-mono text-[10px] text-zinc-600">{t("secondaryMarket.trade.kpiFeesTotal")}</p>
        </div>
        <div className="rounded-2xl bg-[#111111] p-4 ring-1 ring-white/6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.trade.kpiBuySell")}</p>
          <div className="mt-1 flex items-baseline gap-4 font-mono text-2xl font-semibold tabular-nums">
            <span className="text-[#B7F500]">{summary.buys}</span>
            <span className="text-fuchsia-300/95">{summary.sells}</span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-zinc-600">{t("secondaryMarket.trade.kpiTradeCount")}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("secondaryMarket.aria.periodSummary")}>
          {PERIOD_QUICK.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => patchFilters({ period: opt.id })}
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                filters.period === opt.id
                  ? "bg-[#B7F500] text-black"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
              )}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600"
            aria-hidden
          />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => patchFilters({ query: e.target.value })}
            placeholder={t("secondaryMarket.filters.searchTrades")}
            className="h-10 w-full rounded-xl bg-[#111111] py-2 pl-10 pr-3 font-mono text-sm text-white placeholder:text-zinc-600 outline-none ring-1 ring-white/10 focus:ring-[#B7F500]/35"
            aria-label={t("secondaryMarket.aria.searchTrades")}
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFiltersOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111111] px-4 font-mono text-[12px] font-medium text-zinc-200 ring-1 ring-white/10 transition hover:ring-[#B7F500]/35"
          >
            <SlidersHorizontal className="size-4 text-zinc-500" aria-hidden />
            {t("secondaryMarket.trade.filters")}
            {activeFilterCount > 0 ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-[#B7F500] text-[10px] font-bold text-black">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={loading || filteredSorted.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 font-mono text-[12px] font-medium text-zinc-200 transition hover:border-[#B7F500]/35 hover:text-white disabled:pointer-events-none disabled:opacity-40"
          >
            <Download className="size-4 shrink-0 text-zinc-500" aria-hidden />
            CSV
          </button>
        </div>
      </div>

      <p className="font-mono text-[11px] text-zinc-600">
        {tradeHistoryFiltersSummary(filters, t, locale)} · {filteredSorted.length}{" "}
        {filteredSorted.length === 1 ? t("secondaryMarket.trade.tradeCountOne") : t("secondaryMarket.trade.tradeCountMany")}
      </p>

      <SecondaryMarketTradeHistoryFiltersSheet
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        filters={filters}
        onChange={patchFilters}
        onReset={resetFilters}
        resultCount={filteredSorted.length}
        totalCount={trades.length}
      />

      {loading ? (
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
          <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
          {t("secondaryMarket.trade.loadingJournal")}
        </div>
      ) : null}

      {loading ? (
        <TableSkeleton />
      ) : trades.length === 0 ? (
        <div className="rounded-2xl bg-[#111111] px-6 py-16 text-center ring-1 ring-white/6">
          <h2 className="text-lg font-semibold tracking-tight text-white">{t("secondaryMarket.empty.noTrades")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            {t("secondaryMarket.empty.noTradesDesc")}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={marketHref}
              scroll={false}
              className="inline-flex h-10 min-w-[200px] items-center justify-center rounded-full bg-[#B7F500] px-5 font-mono text-[12px] font-semibold text-black hover:opacity-90"
            >
              {t("secondaryMarket.trade.openMarket")}
            </Link>
            <Link
              href={catalogOverviewHref}
              scroll={false}
              className="inline-flex h-10 min-w-[200px] items-center justify-center rounded-full border border-white/15 bg-transparent px-5 font-mono text-[12px] font-medium text-zinc-200 hover:border-white/25 hover:text-white"
            >
              {t("secondaryMarket.trade.toMarketAnalytics")}
            </Link>
          </div>
        </div>
      ) : filteredSorted.length === 0 ? (
        <div className="rounded-2xl bg-[#111111] px-6 py-16 text-center ring-1 ring-white/6">
          <h2 className="text-lg font-semibold tracking-tight text-white">{t("secondaryMarket.empty.noResults")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            {t("secondaryMarket.trade.emptyFilterDesc")}
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 font-mono text-[12px] text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            {t("secondaryMarket.filters.resetFilters")}
          </button>
          <button
            type="button"
            onClick={() => setIsFiltersOpen(true)}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#111111] px-4 font-mono text-[12px] font-medium text-zinc-300 ring-1 ring-white/10"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            {t("secondaryMarket.filters.changeFilters")}
          </button>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <div className="max-h-[min(70vh,720px)] overflow-auto rounded-2xl bg-[#111111] ring-1 ring-white/6">
              <table className="w-full min-w-[1040px] border-collapse text-left">
                <thead className="sticky top-0 z-20 bg-[#111111] shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.06)]">
                  <tr className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                    <SortTh label={t("secondaryMarket.sort.time")} active={filters.sortKey === "time"} dir={filters.sortDir} onClick={() => toggleSort("time")} />
                    <th className="px-3 py-2.5 font-normal">{t("secondaryMarket.trade.tradeId")}</th>
                    <th className="min-w-[200px] px-3 py-2.5 font-normal">{t("secondaryMarket.trade.columnListingRelease")}</th>
                    <th className="px-3 py-2.5 font-normal">{t("secondaryMarket.orders.columnSide")}</th>
                    <th className="px-3 py-2.5 text-right font-normal">{t("secondaryMarket.orders.columnUnits")}</th>
                    <SortTh
                      label={t("secondaryMarket.sort.price")}
                      align="right"
                      active={filters.sortKey === "price"}
                      dir={filters.sortDir}
                      onClick={() => toggleSort("price")}
                    />
                    <SortTh
                      label={t("secondaryMarket.orders.columnAmount")}
                      align="right"
                      active={filters.sortKey === "gross"}
                      dir={filters.sortDir}
                      onClick={() => toggleSort("gross")}
                    />
                    <th className="hidden px-3 py-2.5 text-right font-normal lg:table-cell">{t("secondaryMarket.trade.fee")}</th>
                    <th className="px-3 py-2.5 text-right font-normal">
                      <span className="block">{t("secondaryMarket.trade.total")}</span>
                      <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-zinc-600">
                        {t("secondaryMarket.trade.totalSubheader")}
                      </span>
                    </th>
                    <th className="hidden px-3 py-2.5 font-normal xl:table-cell">{t("secondaryMarket.trade.columnSettlement")}</th>
                    <th className="px-3 py-2.5 text-right font-normal">{t("secondaryMarket.actions.actions")}</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[12px] text-zinc-300">
                  {filteredSorted.map((row) => {
                    const stack = stackHrefForTicker(row.ticker);
                    return (
                      <tr
                        key={row.id}
                        tabIndex={0}
                        onClick={() => setSelectedTrade(row)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedTrade(row);
                          }
                        }}
                        className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/4 focus-visible:bg-white/6 focus-visible:outline-none"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 align-middle text-[11px] text-zinc-500">
                          {formatDateTime(row.timestamp)}
                        </td>
                        <td className="px-3 py-2.5 align-middle text-[11px] text-zinc-600">{row.id}</td>
                        <td className="px-3 py-2.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <CoverThumb ticker={row.ticker} />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-white">{row.title}</p>
                              <p className="truncate text-[11px] text-zinc-600">
                                {row.artist} · {row.ticker}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              row.side === "buy" ? "text-[#B7F500]" : "text-fuchsia-300/95",
                            )}
                          >
                            {row.side === "buy" ? t("secondaryMarket.side.buy") : t("secondaryMarket.side.sell")}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right align-middle tabular-nums">{row.units}</td>
                        <td className="px-3 py-2.5 text-right align-middle tabular-nums text-white">
                          {formatUsdt(row.price)}
                        </td>
                        <td className="px-3 py-2.5 text-right align-middle tabular-nums">{formatUsdt(row.grossAmount)}</td>
                        <td className="hidden px-3 py-2.5 text-right align-middle tabular-nums text-zinc-500 lg:table-cell">
                          {formatUsdt(row.feeAmount)}
                        </td>
                        <td className="px-3 py-2.5 text-right align-middle tabular-nums text-zinc-100">
                          {formatUsdt(row.netAmount)}
                        </td>
                        <td className="hidden px-3 py-2.5 align-middle xl:table-cell">
                          <span
                            title={settlementTooltip(row.settlementStatus, t)}
                            className={cn(
                              "inline-flex cursor-help rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
                              settlementPillClass(row.settlementStatus),
                            )}
                          >
                            {settlementLabel(row.settlementStatus, locale)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right align-middle" onClick={(e) => e.stopPropagation()}>
                          <div
                            className="relative flex flex-nowrap items-center justify-end gap-2.5"
                            ref={openMenuId === row.id ? menuRef : undefined}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedTrade(row)}
                              className={smTableActionIconCircle}
                              aria-label={t("secondaryMarket.actions.tradeDetails")}
                            >
                              <LayoutPanelTop className="size-[17px]" strokeWidth={1.75} aria-hidden />
                            </button>
                            <Link
                              href={releaseAssetHref(row.releaseId)}
                              scroll={false}
                              className={smTableActionReleasePill}
                            >
                              {t("secondaryMarket.actions.release")}
                              <ExternalLink className="size-3.5 opacity-55" aria-hidden />
                            </Link>
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                aria-expanded={openMenuId === row.id}
                                aria-haspopup="menu"
                                aria-label={t("secondaryMarket.aria.moreActions")}
                                onClick={() => setOpenMenuId((id) => (id === row.id ? null : row.id))}
                                className={cn(
                                  smTableActionIconCircle,
                                  openMenuId === row.id && smTableActionIconCirclePressed,
                                )}
                              >
                                <MoreHorizontal className="size-[17px]" strokeWidth={1.75} aria-hidden />
                              </button>
                              {openMenuId === row.id ? (
                                <div role="menu" className={smTableActionMoreMenu}>
                                  <Link
                                    role="menuitem"
                                    href={releaseAssetHref(row.releaseId)}
                                    scroll={false}
                                    className={smTableActionMenuItemLink}
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    {t("secondaryMarket.actions.openRelease")}
                                  </Link>
                                  <Link
                                    role="menuitem"
                                    href={tradeAnalyticsHref(row.releaseId)}
                                    scroll={false}
                                    className={smTableActionMenuItemSecondary}
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    {t("secondaryMarket.actions.tradingAnalytics")}
                                  </Link>
                                  {stack ? (
                                    <Link
                                      role="menuitem"
                                      href={stack}
                                      scroll={false}
                                      className={smTableActionMenuItemLink}
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      {t("secondaryMarket.actions.orderBook")}
                                    </Link>
                                  ) : (
                                    <span className={smTableActionMenuItemMuted}>{t("secondaryMarket.actions.orderBookUnavailable")}</span>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {filteredSorted.map((row) => {
              const stack = stackHrefForTicker(row.ticker);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedTrade(row)}
                  className="w-full rounded-2xl border border-white/8 bg-[#111111] p-4 text-left ring-1 ring-white/5 transition hover:border-white/12 hover:bg-white/3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <CoverThumb ticker={row.ticker} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{row.title}</p>
                        <p className="truncate font-mono text-[11px] text-zinc-600">
                          {row.artist} · {row.ticker}
                        </p>
                        <p className="mt-2 font-mono text-[10px] text-zinc-600">{formatDateTime(row.timestamp)}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase",
                        row.side === "buy" ? "bg-[#B7F500]/14 text-[#d4f570]" : "bg-fuchsia-500/14 text-fuchsia-200/90",
                      )}
                    >
                      {row.side === "buy" ? t("secondaryMarket.side.buy") : t("secondaryMarket.side.sell")}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-[11px]">
                    <div>
                      <p className="text-zinc-600">Gross</p>
                      <p className="mt-0.5 tabular-nums text-zinc-200">{formatUsdt(row.grossAmount)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-600">{t("secondaryMarket.trade.total")}</p>
                      <p className="mt-0.5 tabular-nums text-white">{formatUsdt(row.netAmount)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-600">{t("secondaryMarket.sort.price")}</p>
                      <p className="mt-0.5 tabular-nums text-zinc-300">{formatUsdt(row.price)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-600">Units</p>
                      <p className="mt-0.5 tabular-nums text-zinc-300">{row.units}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span
                      title={settlementTooltip(row.settlementStatus, t)}
                      className={cn(
                        "inline-flex cursor-help rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase",
                        settlementPillClass(row.settlementStatus),
                      )}
                    >
                      {settlementLabel(row.settlementStatus, locale)}
                    </span>
                    <div className="flex flex-wrap items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Link href={releaseAssetHref(row.releaseId)} scroll={false} className={smTableActionReleasePill}>
                        {t("secondaryMarket.actions.release")}
                        <ExternalLink className="size-3.5 opacity-55" aria-hidden />
                      </Link>
                      {stack ? (
                        <Link href={stack} scroll={false} className={smTableActionSecondaryPill}>
                          {t("secondaryMarket.actions.orderBook")}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <SecondaryMarketTradeDetailSheet
        trade={drawerTrade}
        onOpenChange={(open) => {
          if (!open) setSelectedTrade(null);
        }}
        onToast={showToast}
      />

      {toastMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-130 max-w-[min(100vw-2rem,28rem)] -translate-x-1/2 px-4"
        >
          <div className="rounded-xl bg-zinc-950/95 px-4 py-3 font-mono text-[12px] text-zinc-100 shadow-lg ring-1 ring-white/10">
            {toastMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
}
