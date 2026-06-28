"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { useAuth } from "@/components/providers/auth-provider";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { localizedApiError } from "@/lib/api/localized-error";
import { intlLocaleFor } from "@/lib/i18n/formatters";
import type { AppLocale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";
import {
  fetchMarketOverviewDetail,
  fetchMarketOverviewList,
} from "@/services/market-overview.service";
import { fetchMarketDepth } from "@/services/secondary-market.service";
import { getWalletDataSource } from "@/services/wallet.service";

type BookLevel = { price: number; units: number };
type PriceTrend = "up" | "down" | null;

const DEMO_SYMBOL = "AC2145";
const DEMO_MID = 1.026;
const DEMO_TICK_MS = 900;

const BID_OFFSETS = [0.002, 0.0035, 0.005, 0.0065] as const;
const ASK_OFFSETS = [0.002, 0.0035, 0.005, 0.0065] as const;
const BID_UNIT_BASES = [420, 1080, 740, 560] as const;
const ASK_UNIT_BASES = [310, 560, 890, 420] as const;

function roundPrice(value: number): number {
  return Math.round(value * 10000) / 10000;
}

const DEMO_BIDS: BookLevel[] = BID_OFFSETS.map((offset, i) => ({
  price: roundPrice(DEMO_MID - offset),
  units: BID_UNIT_BASES[i],
}));

const DEMO_ASKS: BookLevel[] = ASK_OFFSETS.map((offset, i) => ({
  price: roundPrice(DEMO_MID + offset),
  units: ASK_UNIT_BASES[i],
}));

const DEMO_SPREAD_FALLBACK = "0.40";

function formatPrice(value: number, locale: AppLocale): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(intlLocaleFor(locale), {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatUnits(value: number, locale: AppLocale): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString(intlLocaleFor(locale), { maximumFractionDigits: 0 });
}

function formatSpreadPct(bestBid: number, bestAsk: number, locale: AppLocale): string {
  if (!Number.isFinite(bestBid) || !Number.isFinite(bestAsk) || bestBid <= 0) {
    return DEMO_SPREAD_FALLBACK;
  }
  const pct = ((bestAsk - bestBid) / bestBid) * 100;
  const raw = pct.toFixed(2);
  return locale === "ru" ? raw.replace(".", ",") : raw;
}

function jitterUnits(base: number): number {
  const next = Math.round(base * (0.82 + Math.random() * 0.36));
  return Math.max(80, Math.round(next / 10) * 10);
}

function bookFromMid(mid: number): { bids: BookLevel[]; asks: BookLevel[] } {
  return {
    bids: BID_OFFSETS.map((offset, i) => ({
      price: roundPrice(mid - offset),
      units: jitterUnits(BID_UNIT_BASES[i]),
    })),
    asks: ASK_OFFSETS.map((offset, i) => ({
      price: roundPrice(mid + offset),
      units: jitterUnits(ASK_UNIT_BASES[i]),
    })),
  };
}

function levelsFromApi(
  levels: Array<{ price: string; units: string }>,
  limit = 4,
): BookLevel[] {
  return levels.slice(0, limit).map((level) => ({
    price: Number.parseFloat(level.price),
    units: Number.parseFloat(level.units),
  }));
}

function useAnimatedDemoBook(
  enabled: boolean,
  locale: AppLocale,
  formatSpreadDemo: (pct: string) => string,
) {
  const [mid, setMid] = useState(DEMO_MID);
  const [midTrend, setMidTrend] = useState<PriceTrend>(null);
  const [bids, setBids] = useState(DEMO_BIDS);
  const [asks, setAsks] = useState(DEMO_ASKS);
  const [spreadLabel, setSpreadLabel] = useState(() => formatSpreadDemo(DEMO_SPREAD_FALLBACK));
  const momentumRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      setMid((prev) => {
        momentumRef.current = momentumRef.current * 0.55 + (Math.random() - 0.5) * 0.0012;
        const reversion = (DEMO_MID - prev) * 0.12;
        const next = roundPrice(
          Math.max(1.018, Math.min(1.034, prev + momentumRef.current + reversion)),
        );
        setMidTrend(next > prev ? "up" : next < prev ? "down" : null);
        const book = bookFromMid(next);
        setBids(book.bids);
        setAsks(book.asks);
        const bestBid = book.bids[0]?.price ?? next;
        const bestAsk = book.asks[0]?.price ?? next;
        setSpreadLabel(formatSpreadDemo(formatSpreadPct(bestBid, bestAsk, locale)));
        return next;
      });
    };

    const id = window.setInterval(tick, DEMO_TICK_MS);
    return () => window.clearInterval(id);
  }, [enabled, formatSpreadDemo, locale]);

  useEffect(() => {
    if (!enabled || !midTrend) return;
    const id = window.setTimeout(() => setMidTrend(null), 700);
    return () => window.clearTimeout(id);
  }, [enabled, mid, midTrend]);

  return { symbol: DEMO_SYMBOL, mid, midTrend, bids, asks, spreadLabel };
}

function MiniBookRow({
  price,
  units,
  depthMax,
  variant,
  flash,
  locale,
}: {
  price: number;
  units: number;
  depthMax: number;
  variant: "bid" | "ask";
  flash?: PriceTrend;
  locale: AppLocale;
}) {
  const pct = depthMax > 0 ? Math.min(100, (units / depthMax) * 100) : 0;
  const isAsk = variant === "ask";

  return (
    <div className="relative font-mono text-[10px] tabular-nums sm:text-[9px]">
      <div
        className={cn(
          "absolute inset-y-0 opacity-[0.14] transition-[width] duration-500 ease-out",
          isAsk ? "right-0 bg-rose-400/90" : "right-0 bg-emerald-400/90",
        )}
        style={{ width: `${pct}%` }}
      />
      <div className="relative grid grid-cols-2 gap-2 px-2.5 py-[3px]">
        <span
          className={cn(
            "transition-colors duration-300",
            flash === "up" && "text-emerald-200",
            flash === "down" && "text-rose-200",
            !flash && (isAsk ? "text-rose-300/95" : "text-emerald-300/95"),
          )}
        >
          {formatPrice(price, locale)}
        </span>
        <span className="text-right text-zinc-500 transition-all duration-300">{formatUnits(units, locale)}</span>
      </div>
    </div>
  );
}

function MiniBookDemo({
  symbol,
  mid,
  midTrend,
  spreadLabel,
  bids,
  asks,
  className,
  animated = false,
}: {
  symbol: string;
  mid: number;
  midTrend?: PriceTrend;
  spreadLabel: string;
  bids: BookLevel[];
  asks: BookLevel[];
  className?: string;
  animated?: boolean;
}) {
  const { t, locale } = useI18n();
  const depthMax = useMemo(
    () => Math.max(...bids.map((b) => b.units), ...asks.map((a) => a.units), 1),
    [asks, bids],
  );

  const sortedAsks = useMemo(() => [...asks].sort((a, b) => b.price - a.price), [asks]);
  const sortedBids = useMemo(() => [...bids].sort((a, b) => b.price - a.price), [bids]);
  const topAskFlash = animated ? midTrend : null;
  const topBidFlash = animated ? midTrend : null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0c]/90 font-mono text-[11px] text-zinc-400 backdrop-blur-sm sm:text-[10px]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:text-[9px]">
          {t("dashboard.heroJourney.book.orderBook")}
        </span>
        <span className="flex items-center gap-1.5 tabular-nums text-zinc-400">
          {animated ? (
            <span className="relative flex size-1.5" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
          ) : null}
          {symbol} / USDT
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-white/6 bg-white/6 px-0 py-1.5 text-[8px] uppercase tracking-wide text-zinc-600">
        <span className="px-2.5">{t("dashboard.heroJourney.book.price")}</span>
        <span className="px-2.5 text-right">{t("dashboard.heroJourney.book.volume")}</span>
      </div>

      <div className="divide-y divide-white/4">
        {sortedAsks.map((level, index) => (
          <MiniBookRow
            key={`ask-${index}`}
            price={level.price}
            units={level.units}
            depthMax={depthMax}
            variant="ask"
            flash={index === sortedAsks.length - 1 ? topAskFlash : null}
            locale={locale}
          />
        ))}
      </div>

      <div className="border-y border-white/10 bg-white/[0.03] px-3 py-2 text-center">
        <p className="text-[9px] uppercase tracking-[0.12em] text-zinc-600">{t("dashboard.heroJourney.book.mid")}</p>
        <p
          className={cn(
            "mt-0.5 text-[13px] font-semibold tabular-nums transition-colors duration-300 sm:text-[12px]",
            midTrend === "up" && "text-emerald-300",
            midTrend === "down" && "text-rose-300",
            !midTrend && "text-white",
          )}
        >
          {formatPrice(mid, locale)}
          <span className="ml-1 text-[10px] font-normal text-zinc-500">USDT</span>
        </p>
      </div>

      <div className="divide-y divide-white/4">
        {sortedBids.map((level, index) => (
          <MiniBookRow
            key={`bid-${index}`}
            price={level.price}
            units={level.units}
            depthMax={depthMax}
            variant="bid"
            flash={index === 0 ? topBidFlash : null}
            locale={locale}
          />
        ))}
      </div>

      <div className="border-t border-white/8 px-3 py-2 text-center text-[9px] text-zinc-500">
        {spreadLabel}
      </div>
    </div>
  );
}

function spreadLabelFor(t: (key: string, fallback?: string) => string, key: string, pct: string): string {
  return t(key).replace("{pct}", pct);
}

function StaticMiniBookDemo({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <MiniBookDemo
      symbol={DEMO_SYMBOL}
      mid={DEMO_MID}
      spreadLabel={spreadLabelFor(t, "dashboard.miniBook.spreadDemo", DEMO_SPREAD_FALLBACK)}
      bids={DEMO_BIDS}
      asks={DEMO_ASKS}
      className={className}
    />
  );
}

function AnimatedMiniBookDemoInner({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const formatSpreadDemo = useCallback(
    (pct: string) => spreadLabelFor(t, "dashboard.miniBook.spreadDemo", pct),
    [t],
  );
  const book = useAnimatedDemoBook(true, locale, formatSpreadDemo);
  return (
    <MiniBookDemo
      symbol={book.symbol}
      mid={book.mid}
      midTrend={book.midTrend}
      spreadLabel={book.spreadLabel}
      bids={book.bids}
      asks={book.asks}
      className={className}
      animated
    />
  );
}

function AnimatedMiniBookDemo({ className }: { className?: string }) {
  const mounted = useClientMounted();
  if (!mounted) return <StaticMiniBookDemo className={className} />;
  return <AnimatedMiniBookDemoInner className={className} />;
}

export function DashboardMiniOrderBook({
  className,
  demo = false,
}: {
  className?: string;
  /** Всегда показывать красивый демо-стакан (лендинг). */
  demo?: boolean;
}) {
  const live = getWalletDataSource() === "live";
  const { authorizedFetch, isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const [symbol, setSymbol] = useState(DEMO_SYMBOL);
  const [bids, setBids] = useState<BookLevel[]>(DEMO_BIDS);
  const [asks, setAsks] = useState<BookLevel[]>(DEMO_ASKS);
  const [mid, setMid] = useState(DEMO_MID);
  const [footer, setFooter] = useState(() => spreadLabelFor(t, "dashboard.miniBook.spreadMock", DEMO_SPREAD_FALLBACK));
  // В live-режиме нельзя показывать demo/mock стакан как fallback.
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState<string | null>(null);
  const [useDemoFallback, setUseDemoFallback] = useState(!live);

  const load = useCallback(async () => {
    if (demo) {
      setUseDemoFallback(true);
      setLoading(false);
      setError(null);
      return;
    }

    if (!live) {
      setUseDemoFallback(true);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const list = await fetchMarketOverviewList({ sort: "activity", sortDir: "desc" });
      const top = list.items[0];
      if (!top) {
        setUseDemoFallback(false);
        setError(t("dashboard.miniBook.noMarkets"));
        return;
      }

      setSymbol(top.symbol);

      if (isAuthenticated) {
        const depth = await fetchMarketDepth(authorizedFetch, { symbol: top.symbol });
        const nextBids = levelsFromApi(depth.bids);
        const nextAsks = levelsFromApi(depth.asks);
        if (nextBids.length === 0 && nextAsks.length === 0) {
          setUseDemoFallback(false);
          setError(t("dashboard.miniBook.noDepth"));
          return;
        }
        setBids(nextBids);
        setAsks(nextAsks);
        setUseDemoFallback(false);
        setFooter(spreadLabelFor(t, "dashboard.miniBook.spreadLive", depth.spreadPct));
        const bestBid = nextBids[0]?.price;
        const bestAsk = nextAsks[nextAsks.length - 1]?.price;
        if (bestBid != null && bestAsk != null) setMid((bestBid + bestAsk) / 2);
        return;
      }

      const detail = await fetchMarketOverviewDetail(top.id);
      const nextAsks = levelsFromApi(detail.depthSummary.topAsks);
      const nextBids =
        detail.depthSummary.bestBid != null
          ? [
              {
                price: Number.parseFloat(detail.depthSummary.bestBid),
                units: Number.parseFloat(detail.depthSummary.bidDepthUnits),
              },
            ]
          : [];

      if (nextAsks.length === 0 && nextBids.length === 0) {
        setUseDemoFallback(false);
        setError(t("dashboard.miniBook.noDepth"));
        return;
      }

      setAsks(nextAsks);
      setBids(nextBids);
      setUseDemoFallback(false);
      setFooter(spreadLabelFor(t, "dashboard.miniBook.spreadLive", detail.depthSummary.spread));
      if (detail.depthSummary.bestBid != null && detail.depthSummary.topAsks[0]) {
        const bestBid = Number.parseFloat(detail.depthSummary.bestBid);
        const bestAsk = Number.parseFloat(detail.depthSummary.topAsks[0].price);
        if (Number.isFinite(bestBid) && Number.isFinite(bestAsk)) {
          setMid((bestBid + bestAsk) / 2);
        }
      }
    } catch (e) {
      setError(localizedApiError(e, locale));
      setUseDemoFallback(false);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, demo, isAuthenticated, live, locale, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (demo) {
    return <AnimatedMiniBookDemo className={className} />;
  }

  if (loading) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0c]/90 px-3 py-10 text-center font-mono text-[10px] text-zinc-500",
          className,
        )}
      >
        {t("dashboard.miniBook.loading")}
      </div>
    );
  }

  if (error && !useDemoFallback) {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0c]/90 px-3 py-4",
          className,
        )}
      >
        <ReadOnlySectionError
          sectionId="dashboard-mini-order-book"
          error={error}
          onRetry={load}
          compact
          variant="dark"
        />
      </div>
    );
  }

  if (useDemoFallback) {
    return <AnimatedMiniBookDemo className={className} />;
  }

  return (
    <MiniBookDemo
      symbol={symbol}
      mid={mid}
      spreadLabel={footer || spreadLabelFor(t, "dashboard.miniBook.spreadLive", DEMO_SPREAD_FALLBACK)}
      bids={bids}
      asks={asks}
      className={className}
    />
  );
}
