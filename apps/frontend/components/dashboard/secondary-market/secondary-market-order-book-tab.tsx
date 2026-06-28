"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { analyticsReleaseDetailPath, secondaryMarketBookPath } from "@/constants/routes";
import { getSecondaryMarketAnalyticsCatalogIdForReleaseSlug } from "@/mocks/dashboard/secondary-market-listings.mock";
import { cn } from "@/lib/utils";
import { ExchangeNeonSparkline } from "@/components/shared/charts/exchange-neon-sparkline";

import { SecondaryMarketBreadcrumbNav } from "./secondary-market-breadcrumb-nav";
import { SecondaryMarketBookWorkspaceHeader } from "./secondary-market-book-workspace-header";
import { SecondaryMarketTerminalOrderCard } from "./secondary-market-terminal-order-card";
import { smExchange } from "./secondary-market-exchange-styles";
import { SecondaryMarketOrderEntryPanel, type LimitSeed } from "./secondary-market-order-entry-panel";
import { SecondaryMarketOrderFeedbackModal, type OrderFeedback } from "./secondary-market-order-feedback-modal";
import { walkBuyAgainstAsks, walkSellAgainstBids } from "./secondary-market-book-math";
import { LegalConsentModal } from "@/components/compliance/legal-consent-modal";
import { LegalConsentGateAlert } from "@/components/compliance/legal-consent-gate-alert";
import { EligibilityNotice } from "@/components/compliance/eligibility-notice";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { useLegalConsentGate } from "@/hooks/use-legal-consent-gate";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { statusLabel } from "@/lib/i18n/status-labels";
import type { AppLocale } from "@/lib/i18n/types";
import {
  buyListing,
  cancelListing,
  createListing,
  fetchMyOrders,
} from "@/services/secondary-market.service";
import {
  mapRichUserOrderToTerminalMyOrder,
} from "@/lib/secondary-market/secondary-market-book-live.util";

import { SECONDARY_FEE_FALLBACK_RATE } from "@/lib/market/platform-fee-fallbacks";
import type { BookLevel, BookMarket, BookTrade } from "@/lib/secondary-market/secondary-market-book.types";

const FEE_RATE = SECONDARY_FEE_FALLBACK_RATE;

type MyOrderStatus = "active" | "partial" | "filled" | "cancelled" | "expired" | "failed";
type MyOrder = {
  id: string;
  marketId: string;
  side: "buy" | "sell";
  mode: "limit" | "market";
  price: number;
  units: number;
  filled: number;
  status: MyOrderStatus;
  createdAt: string;
  statusLabel?: string;
  canCancel?: boolean;
  listingId?: string | null;
};
type MarketPosition = {
  unitsTotal: number;
  unitsAvailable: number;
  lockedUnits: number;
  usdtBalance: number;
  avgEntryPrice: number;
};

const TICK_OPTIONS = [0.01, 0.05, 0.1] as const;

const BOOK_MARKETS: BookMarket[] = [
  {
    id: "mnr",
    symbol: "MNR",
    track: "Midnight Run",
    artist: "Nova Lane",
    releaseId: "midnight-run",
    asks: [
      { price: 18.58, units: 90 },
      { price: 18.55, units: 160 },
      { price: 18.52, units: 200 },
      { price: 18.5, units: 120 },
    ],
    bids: [
      { price: 18.48, units: 240 },
      { price: 18.44, units: 180 },
      { price: 18.4, units: 320 },
      { price: 18.35, units: 140 },
    ],
    trades: [
      { time: "12:08", side: "buy", price: 18.5, units: 24 },
      { time: "12:04", side: "sell", price: 18.52, units: 40 },
      { time: "11:59", side: "buy", price: 18.48, units: 16 },
      { time: "11:51", side: "buy", price: 18.47, units: 8 },
      { time: "11:44", side: "sell", price: 18.53, units: 32 },
    ],
    volume24hUsdt: 42180,
    volume24hUnits: 2280,
    rightsListed: 120,
    priceSpark: [0.42, 0.44, 0.43, 0.46, 0.48, 0.47, 0.49, 0.5, 0.51, 0.5],
    liquidity: "high",
    change24hPct: 1.35,
    high24h: 19.05,
    low24h: 17.92,
    availableUsdt: 5240.58,
    availableUnits: 340,
    unitsTotal: 364,
    unitsLocked: 24,
    lockedUsdt: 120,
    avgEntryPrice: 17.2,
    lastPrice: 18.5,
    genre: "Electronic",
  },
  {
    id: "sgn",
    symbol: "SGN",
    track: "Signal / Noise",
    artist: "Kairo",
    releaseId: "signal-noise",
    asks: [
      { price: 22.35, units: 55 },
      { price: 22.22, units: 70 },
      { price: 22.1, units: 44 },
    ],
    bids: [
      { price: 21.98, units: 60 },
      { price: 21.85, units: 95 },
      { price: 21.7, units: 40 },
    ],
    trades: [
      { time: "12:01", side: "buy", price: 22.1, units: 12 },
      { time: "11:48", side: "sell", price: 22.15, units: 20 },
    ],
    volume24hUsdt: 18840,
    volume24hUnits: 860,
    rightsListed: 40,
    priceSpark: [0.35, 0.38, 0.4, 0.42, 0.45, 0.48, 0.5, 0.52, 0.51, 0.53],
    liquidity: "high",
    change24hPct: -0.62,
    high24h: 22.48,
    low24h: 21.55,
    availableUsdt: 3120.0,
    availableUnits: 95,
    unitsTotal: 95,
    unitsLocked: 0,
    lockedUsdt: 0,
    avgEntryPrice: 21.4,
    lastPrice: 22.1,
    genre: "Hip-Hop",
  },
  {
    id: "vlt",
    symbol: "VLT",
    track: "Velvet Room",
    artist: "June & Co",
    releaseId: "velvet-room",
    asks: [{ price: 6.95, units: 25 }],
    bids: [{ price: 6.72, units: 18 }],
    trades: [],
    volume24hUsdt: 420,
    volume24hUnits: 62,
    rightsListed: 60,
    priceSpark: [0.55, 0.54, 0.53, 0.52, 0.52, 0.51, 0.5, 0.5, 0.49, 0.48],
    liquidity: "low",
    change24hPct: -2.1,
    high24h: 7.08,
    low24h: 6.65,
    availableUsdt: 890.12,
    availableUnits: 22,
    unitsTotal: 22,
    unitsLocked: 0,
    lockedUsdt: 0,
    avgEntryPrice: 6.8,
    lastPrice: 6.95,
    genre: "Pop",
  },
];

const MY_ORDERS_MOCK: MyOrder[] = [
  {
    id: "o-mnr-1",
    marketId: "mnr",
    side: "buy",
    mode: "limit",
    price: 18.48,
    units: 80,
    filled: 32,
    status: "partial",
    createdAt: "2026-04-21T10:00:00.000Z",
  },
  {
    id: "o-mnr-2",
    marketId: "mnr",
    side: "sell",
    mode: "limit",
    price: 18.62,
    units: 24,
    filled: 0,
    status: "active",
    createdAt: "2026-04-22T08:15:00.000Z",
  },
  {
    id: "o-mnr-3",
    marketId: "mnr",
    side: "buy",
    mode: "limit",
    price: 18.2,
    units: 40,
    filled: 40,
    status: "filled",
    createdAt: "2026-04-20T12:00:00.000Z",
  },
  {
    id: "o-mnr-4",
    marketId: "mnr",
    side: "buy",
    mode: "limit",
    price: 18.05,
    units: 12,
    filled: 0,
    status: "cancelled",
    createdAt: "2026-04-19T09:00:00.000Z",
  },
  {
    id: "o-sgn-1",
    marketId: "sgn",
    side: "sell",
    mode: "limit",
    price: 22.2,
    units: 15,
    filled: 4,
    status: "partial",
    createdAt: "2026-04-21T14:20:00.000Z",
  },
  {
    id: "o-vlt-1",
    marketId: "vlt",
    side: "buy",
    mode: "limit",
    price: 6.7,
    units: 40,
    filled: 0,
    status: "active",
    createdAt: "2026-04-22T06:00:00.000Z",
  },
];

const MY_POSITIONS_MOCK: Record<string, MarketPosition> = {
  mnr: { unitsTotal: 1842, unitsAvailable: 1794, lockedUnits: 48, usdtBalance: 5240.58, avgEntryPrice: 18.12 },
  sgn: { unitsTotal: 920, unitsAvailable: 905, lockedUnits: 11, usdtBalance: 3120, avgEntryPrice: 21.86 },
  vlt: { unitsTotal: 420, unitsAvailable: 380, lockedUnits: 40, usdtBalance: 890.12, avgEntryPrice: 6.73 },
};

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatUsdtCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}M`;
  if (n >= 10_000) return `${(n / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}K`;
  return formatUsdt(n);
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

function liquidityLabel(liquidity: BookMarket["liquidity"], t: (key: string) => string) {
  switch (liquidity) {
    case "high":
      return t("secondaryMarket.kpi.liquidity.high");
    case "med":
      return t("secondaryMarket.kpi.liquidity.med");
    case "low":
      return t("secondaryMarket.kpi.liquidity.low");
    default:
      return liquidity;
  }
}

function liquidityShortLabel(liquidity: BookMarket["liquidity"], t: (key: string) => string) {
  switch (liquidity) {
    case "high":
      return t("secondaryMarket.kpi.liquidity.highShort");
    case "med":
      return t("secondaryMarket.kpi.liquidity.medShort");
    case "low":
      return t("secondaryMarket.kpi.liquidity.lowShort");
    default:
      return liquidity;
  }
}

function roundToTick(price: number, tick: number) {
  const k = Math.round(price / tick);
  const rounded = k * tick;
  const decimals = Math.max(0, `${tick}`.split(".")[1]?.length ?? 0);
  return Number(rounded.toFixed(decimals));
}

function aggregateLevels(levels: BookLevel[], tick: number, side: "ask" | "bid"): BookLevel[] {
  const map = new Map<number, number>();
  for (const l of levels) {
    const p = roundToTick(l.price, tick);
    map.set(p, (map.get(p) ?? 0) + l.units);
  }
  const arr = [...map.entries()].map(([price, units]) => ({ price, units }));
  if (side === "ask") return arr.sort((a, b) => a.price - b.price);
  return arr.sort((a, b) => b.price - a.price);
}

function OrderBookMiniSparkline({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null;
  return (
    <ExchangeNeonSparkline
      values={values}
      trend={positive ? "up" : "down"}
      width={100}
      height={28}
      detailSegments={4}
    />
  );
}

function CoverThumb({ symbol }: { symbol: string }) {
  const hue = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-10 shrink-0 rounded-full sm:size-11"
      style={{
        background: `linear-gradient(145deg, hsl(${hue}, 42%, 28%) 0%, hsl(${(hue + 48) % 360}, 28%, 12%) 100%)`,
      }}
      aria-hidden
    />
  );
}

function maxUnits(levels: BookLevel[]) {
  return Math.max(1, ...levels.map((l) => l.units));
}

function OrderBookRow({
  price,
  units,
  cumulativeUsdt,
  depthMax,
  variant,
  onPick,
  compact,
}: {
  price: number;
  units: number;
  cumulativeUsdt: number;
  depthMax: number;
  variant: "ask" | "bid";
  onPick: () => void;
  compact?: boolean;
}) {
  const pct = Math.min(100, (units / depthMax) * 100);
  const isAsk = variant === "ask";
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "relative w-full cursor-pointer text-left font-mono tabular-nums transition-colors hover:bg-white/4",
        compact ? "text-[10px]" : "text-[11px] sm:text-[12px]",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 opacity-[0.16]",
          isAsk ? "right-0 rounded-l-sm bg-fuchsia-400" : "right-0 rounded-l-sm bg-[#B7F500]",
        )}
        style={{ width: `${pct}%` }}
      />
      <div
        className={cn(
          "relative grid grid-cols-[1fr_56px_80px] items-center gap-1 px-2",
          compact ? "py-px" : "py-0.5 sm:py-1",
        )}
      >
        <span className={cn(isAsk ? "text-fuchsia-200" : "text-[#c8f06a]")}>{formatUsdt(price)}</span>
        <span className="text-center text-zinc-400">{units}</span>
        <span className="text-right text-zinc-600">{formatUsdt(cumulativeUsdt)}</span>
      </div>
    </button>
  );
}

type PositionAdj = Partial<MarketPosition>;

function orderStatusLabel(s: MyOrderStatus, locale: AppLocale): string {
  return statusLabel("order", s, locale);
}

function orderTypeLabel(mode: "limit" | "market", t: (key: string) => string): string {
  return mode === "limit" ? t("secondaryMarket.forms.limit") : t("secondaryMarket.forms.market");
}

function TradesPanel({ trades, workspace, t }: { trades: BookTrade[]; workspace?: boolean; t: (key: string) => string }) {
  if (trades.length === 0) {
    return <div className="flex flex-1 items-center justify-center py-16 font-mono text-xs text-zinc-600">{t("secondaryMarket.orderBook.noTrades")}</div>;
  }
  return (
    <ul
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        workspace ? "min-h-0" : "max-h-[min(52vh,440px)]",
      )}
    >
      {trades.map((tr, i) => (
        <li
          key={`${tr.time}-${i}`}
          className="grid grid-cols-[44px_72px_1fr_44px_88px] items-center gap-1 border-b border-white/4 px-2 py-1 font-mono text-[11px] tabular-nums sm:text-[12px]"
        >
          <span className="text-zinc-600">{tr.time}</span>
          <span className={tr.side === "buy" ? "text-[#B7F500]" : "text-fuchsia-300"}>
            {tr.side === "buy" ? t("secondaryMarket.side.buy") : t("secondaryMarket.side.sell")}
          </span>
          <span className="text-right text-zinc-200">{formatUsdt(tr.price)}</span>
          <span className="text-right text-zinc-500">{tr.units}u</span>
          <span className="text-right text-zinc-400">{formatUsdt(tr.price * tr.units)}</span>
        </li>
      ))}
    </ul>
  );
}

export type SecondaryMarketOrderBookTabProps = {
  /** Полноэкранная страница терминала: ордер справа, форма слева. */
  layout?: "inline" | "workspace";
  /** Для `layout="workspace"` — id инструмента из URL. */
  initialMarketId?: string;
  /** Live depth from API (replaces mock book for workspace). */
  liveBookMarket?: BookMarket | null;
  onLiveRefresh?: () => void;
};

export function SecondaryMarketOrderBookTab(props?: SecondaryMarketOrderBookTabProps) {
  const { layout = "inline", initialMarketId, liveBookMarket = null, onLiveRefresh } = props ?? {};
  const { authorizedFetch } = useAuth();
  const { locale, t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLiveBook = Boolean(liveBookMarket);
  const consentGate = useLegalConsentGate("SECONDARY_TRADE", isLiveBook);
  const apiError = useApiErrorMessage();
  const fromRoute =
    layout === "workspace" && initialMarketId
      ? initialMarketId
      : null;
  const marketFromUrl = fromRoute ?? searchParams.get("market");
  const mockMarketId = BOOK_MARKETS.some((x) => x.id === marketFromUrl)
    ? marketFromUrl!
    : BOOK_MARKETS[0]!.id;
  const marketId = isLiveBook ? liveBookMarket!.id : mockMarketId;
  const isWorkspace = layout === "workspace";

  const [tick, setTick] = React.useState<(typeof TICK_OPTIONS)[number]>(0.01);
  const [workspaceTab, setWorkspaceTab] = React.useState<"book" | "trades">("book");
  const [workspaceBottomTab, setWorkspaceBottomTab] = React.useState<"orders" | "position">("orders");
  const [ticketRev, setTicketRev] = React.useState(0);
  const [limitSeed, setLimitSeed] = React.useState<LimitSeed | null>(null);
  const [myOrders, setMyOrders] = React.useState<MyOrder[]>(() =>
    isLiveBook ? [] : [...MY_ORDERS_MOCK],
  );
  const [myOrdersLoading, setMyOrdersLoading] = React.useState(false);
  /** После клика по уровню стакана на узком экране прячем стакан, пока не сменится инструмент или не нажмут «Показать». */
  const [bookHiddenForMarketId, setBookHiddenForMarketId] = React.useState<string | null>(null);
  const bookDockHidden = !isWorkspace && bookHiddenForMarketId === marketId;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [orderFeedback, setOrderFeedback] = React.useState<OrderFeedback | null>(null);
  const [extraTradesByMarket, setExtraTradesByMarket] = React.useState<Record<string, BookTrade[]>>({});
  const [positionAdj, setPositionAdj] = React.useState<Record<string, PositionAdj>>({});
  const [orderFilter, setOrderFilter] = React.useState<"all" | "active" | "partial" | "filled" | "cancelled">("all");

  const navigateMarket = React.useCallback(
    (id: string) => {
      setLimitSeed(null);
      setBookHiddenForMarketId(null);
      setOrderFeedback(null);
      router.replace(secondaryMarketBookPath(id), { scroll: false });
    },
    [router],
  );

  React.useEffect(() => {
    setOrderFilter("all");
  }, [marketId]);

  const m = isLiveBook
    ? liveBookMarket!
    : BOOK_MARKETS.find((x) => x.id === marketId) ?? BOOK_MARKETS[0]!;
  const myPosition: MarketPosition = isLiveBook
    ? {
        unitsTotal: m.unitsTotal,
        unitsAvailable: m.availableUnits,
        lockedUnits: m.unitsLocked,
        usdtBalance: m.availableUsdt,
        avgEntryPrice: m.avgEntryPrice,
      }
    : {
        ...(MY_POSITIONS_MOCK[marketId] ?? MY_POSITIONS_MOCK.mnr),
        ...(positionAdj[marketId] ?? {}),
      };

  const reloadMyOrders = React.useCallback(async () => {
    if (!isLiveBook || !liveBookMarket?.releaseUuid) return;
    setMyOrdersLoading(true);
    try {
      const { items } = await fetchMyOrders(authorizedFetch, {
        releaseId: liveBookMarket.releaseUuid,
        pageSize: 50,
      });
      const mapped = items.map((o) => {
        const t = mapRichUserOrderToTerminalMyOrder(o, marketId);
        return {
          id: t.id,
          marketId: t.marketId,
          side: t.side,
          mode: t.mode,
          price: t.price,
          units: t.units,
          filled: t.filled,
          status: t.status,
          createdAt: t.createdAt,
          statusLabel: t.statusLabel,
          canCancel: t.canCancel,
          listingId: t.listingId,
        } satisfies MyOrder;
      });
      setMyOrders(mapped);
    } catch {
      setMyOrders([]);
    } finally {
      setMyOrdersLoading(false);
    }
  }, [authorizedFetch, isLiveBook, liveBookMarket?.releaseUuid, marketId]);

  React.useEffect(() => {
    if (!isLiveBook) return;
    void reloadMyOrders();
  }, [isLiveBook, reloadMyOrders]);

  const marketOrdersAll = React.useMemo(() => myOrders.filter((o) => o.marketId === marketId), [myOrders, marketId]);
  const activeOrderCount = React.useMemo(
    () => marketOrdersAll.filter((o) => o.status === "active" || o.status === "partial").length,
    [marketOrdersAll],
  );
  const filteredMarketOrders = React.useMemo(() => {
    if (orderFilter === "all") return marketOrdersAll;
    return marketOrdersAll.filter((o) => o.status === orderFilter);
  }, [marketOrdersAll, orderFilter]);

  const lockedFromSellOrders = React.useMemo(
    () =>
      myOrders
        .filter((o) => o.marketId === marketId && (o.status === "active" || o.status === "partial") && o.side === "sell")
        .reduce((a, o) => a + Math.max(0, o.units - o.filled), 0),
    [myOrders, marketId],
  );
  const lockedUnitsForPanel = Math.max(myPosition.lockedUnits, lockedFromSellOrders);

  const displayTrades = React.useMemo(
    () => [...(extraTradesByMarket[marketId] ?? []), ...m.trades],
    [extraTradesByMarket, marketId, m.trades],
  );

  const asksAgg = React.useMemo(() => aggregateLevels(m.asks, tick, "ask"), [m.asks, tick]);
  const bidsAgg = React.useMemo(() => aggregateLevels(m.bids, tick, "bid"), [m.bids, tick]);
  const bestAsk = asksAgg[0]?.price ?? 0;
  const bestBid = bidsAgg[0]?.price ?? 0;
  const mid = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk || bestBid;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const last =
    isLiveBook && m.lastPrice > 0
      ? m.lastPrice
      : displayTrades[0]?.price ?? mid;

  const cancelOrder = async (id: string) => {
    const order = myOrders.find((o) => o.id === id);
    if (!order) return;

    if (isLiveBook && onLiveRefresh) {
      const listingId =
        order.listingId ??
        (order.id.startsWith("lst-order-") ? order.id.slice("lst-order-".length) : null);
      if (!listingId) {
        setOrderFeedback({
          tone: "warn",
          title: t("secondaryMarket.orderBook.feedback.cancelUnavailableTitle"),
          body: t("secondaryMarket.orderBook.feedback.cancelUnavailableBody"),
        });
        return;
      }
      try {
        await cancelListing(authorizedFetch, listingId);
        await reloadMyOrders();
        onLiveRefresh();
        setOrderFeedback({
          tone: "info",
          title: t("secondaryMarket.actions.feedbackOrderCancelledTitle"),
          body: t("secondaryMarket.orderBook.feedback.cancelSuccessBody"),
        });
      } catch (e) {
        setOrderFeedback({
          tone: "warn",
          title: t("secondaryMarket.orderBook.feedback.cancelFailedTitle"),
          body: apiError.messageFor(e),
        });
      }
      return;
    }

    setMyOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelled" as const } : o)));
    setOrderFeedback({
      tone: "info",
      title: t("secondaryMarket.actions.feedbackOrderCancelledTitle"),
      body: t("secondaryMarket.orderBook.feedback.cancelSuccessBody"),
    });
  };

  const handleOrderSubmit = React.useCallback(
    async (payload: { orderMode: "limit" | "market"; side: "buy" | "sell"; price: number; units: number }) => {
      if (isLiveBook && onLiveRefresh) {
        consentGate.requestProceed(async () => {
          setIsSubmitting(true);
          setOrderFeedback(null);
          try {
          if (payload.side === "sell") {
            const releaseUuid = liveBookMarket!.releaseUuid;
            if (!releaseUuid) {
              setOrderFeedback({
                tone: "warn",
                title: t("secondaryMarket.orderBook.error.releaseUnavailableTitle"),
                body: t("secondaryMarket.orderBook.error.releaseUnavailableBody"),
              });
              setIsSubmitting(false);
              return;
            }
            await createListing(authorizedFetch, {
              releaseId: releaseUuid,
              units: payload.units,
              pricePerUnit: payload.price,
            });
            await reloadMyOrders();
            onLiveRefresh();
            setOrderFeedback({
              tone: "success",
              title: t("secondaryMarket.actions.feedbackListingPlacedTitle"),
              body: tm(t, "secondaryMarket.orderBook.feedback.listingPlacedBody", {
                units: payload.units,
                price: formatUsdt(payload.price),
              }),
            });
          } else {
            const ask = m.asks.find((level) => level.listingId);
            if (!ask?.listingId) {
              setOrderFeedback({
                tone: "warn",
                title: t("secondaryMarket.orderBook.feedback.noLotsTitle"),
                body: t("secondaryMarket.orderBook.feedback.noLotsBody"),
              });
              setIsSubmitting(false);
              return;
            }
            if (payload.units !== ask.units) {
              setOrderFeedback({
                tone: "warn",
                title: t("secondaryMarket.orderBook.feedback.wholeLotTitle"),
                body: tm(t, "secondaryMarket.orderBook.feedback.wholeLotBody", {
                  units: ask.units,
                  price: formatUsdt(ask.price),
                }),
              });
              setIsSubmitting(false);
              return;
            }
            if (payload.orderMode === "limit" && bestAsk > 0 && payload.price < bestAsk) {
              setOrderFeedback({
                tone: "info",
                title: t("secondaryMarket.orderBook.feedback.limitBuyTitle"),
                body: t("secondaryMarket.orderBook.feedback.limitBuyBody"),
              });
              setIsSubmitting(false);
              return;
            }
            await buyListing(authorizedFetch, ask.listingId);
            await reloadMyOrders();
            onLiveRefresh();
            setOrderFeedback({
              tone: "success",
              title: t("secondaryMarket.actions.feedbackTradeExecutedTitle"),
              body: tm(t, "secondaryMarket.orderBook.feedback.tradeExecutedBody", {
                units: ask.units,
                price: formatUsdt(ask.price),
              }),
            });
          }
        } catch (e) {
          setOrderFeedback({
            tone: "warn",
            title: t("secondaryMarket.errors.genericTitle"),
            body: apiError.messageFor(e),
          });
        } finally {
          setIsSubmitting(false);
        }
        });
        return;
      }

      setIsSubmitting(true);
      setOrderFeedback(null);

      await new Promise((r) => setTimeout(r, 420));

      const id = `o-${marketId}-${Date.now()}`;
      const now = new Date();
      const iso = now.toISOString();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const pushTrade = (t: BookTrade) => {
        setExtraTradesByMarket((prev) => ({
          ...prev,
          [marketId]: [t, ...(prev[marketId] ?? [])],
        }));
      };

      const mergePos = (fn: (cur: MarketPosition) => MarketPosition) => {
        setPositionAdj((prev) => {
          const cur: MarketPosition = {
            ...(MY_POSITIONS_MOCK[marketId] ?? MY_POSITIONS_MOCK.mnr),
            ...(prev[marketId] ?? {}),
          };
          return { ...prev, [marketId]: fn(cur) };
        });
      };

      if (payload.orderMode === "market") {
        const walk =
          payload.side === "buy" ? walkBuyAgainstAsks(m.asks, payload.units) : walkSellAgainstBids(m.bids, payload.units);
        const filled = walk.filledUnits;
        if (filled <= 0) {
          setOrderFeedback({
            tone: "warn",
            title: t("secondaryMarket.errors.insufficientLiquidityTitle"),
            body: t("secondaryMarket.orderBook.feedback.insufficientLiquidityBody"),
          });
          setIsSubmitting(false);
          return;
        }
        const fee = walk.totalUsdt * FEE_RATE;
        const partial = walk.unfilledUnits > 0;
        pushTrade({ time: timeStr, side: payload.side, price: walk.avgPrice, units: filled });
        if (payload.side === "buy") {
          mergePos((cur) => {
            const newTotal = cur.unitsTotal + filled;
            const newAvg = newTotal > 0 ? (cur.unitsTotal * cur.avgEntryPrice + walk.totalUsdt) / newTotal : cur.avgEntryPrice;
            return {
              ...cur,
              usdtBalance: cur.usdtBalance - walk.totalUsdt,
              unitsTotal: newTotal,
              unitsAvailable: cur.unitsAvailable + filled,
              avgEntryPrice: newAvg,
            };
          });
        } else {
          mergePos((cur) => ({
            ...cur,
            usdtBalance: cur.usdtBalance + (walk.totalUsdt - fee),
            unitsTotal: Math.max(0, cur.unitsTotal - filled),
            unitsAvailable: Math.max(0, cur.unitsAvailable - filled),
          }));
        }
        setMyOrders((prev) => [
          {
            id,
            marketId,
            side: payload.side,
            mode: "market",
            price: walk.avgPrice,
            units: payload.units,
            filled,
            status: partial ? "partial" : "filled",
            createdAt: iso,
          },
          ...prev,
        ]);
        setOrderFeedback(
          partial
            ? {
                tone: "warn",
                title: t("secondaryMarket.actions.feedbackPartialFillTitle"),
                body: tm(t, "secondaryMarket.orderBook.feedback.partialMarketBody", {
                  filled,
                  price: formatUsdt(walk.avgPrice),
                  unfilled: walk.unfilledUnits,
                }),
              }
            : {
                tone: "success",
                title: t("secondaryMarket.actions.feedbackOrderFilledTitle"),
                body:
                  payload.side === "buy"
                    ? tm(t, "secondaryMarket.orderBook.feedback.buyExecutedBody", {
                        filled,
                        price: formatUsdt(walk.avgPrice),
                        total: formatUsdt(walk.totalUsdt),
                      })
                    : tm(t, "secondaryMarket.orderBook.feedback.sellExecutedBody", {
                        filled,
                        price: formatUsdt(walk.avgPrice),
                        total: formatUsdt(walk.totalUsdt - fee),
                      }),
              },
        );
        setIsSubmitting(false);
        return;
      }

      /** Лимит: немедленное исполнение только если цена пересекает лучший уровень противоположной стороны. */
      let walkImmediate: ReturnType<typeof walkBuyAgainstAsks> | null = null;
      if (payload.side === "buy" && bestAsk > 0 && payload.price >= bestAsk) {
        walkImmediate = walkBuyAgainstAsks(m.asks, payload.units, payload.price);
      } else if (payload.side === "sell" && bestBid > 0 && payload.price <= bestBid) {
        walkImmediate = walkSellAgainstBids(m.bids, payload.units, payload.price);
      }

      if (walkImmediate && walkImmediate.filledUnits > 0) {
        const w = walkImmediate;
        const fee = w.totalUsdt * FEE_RATE;
        const partialRest = w.unfilledUnits > 0;
        pushTrade({ time: timeStr, side: payload.side, price: w.avgPrice, units: w.filledUnits });
        if (payload.side === "buy") {
          mergePos((cur) => {
            const newTotal = cur.unitsTotal + w.filledUnits;
            const newAvg = newTotal > 0 ? (cur.unitsTotal * cur.avgEntryPrice + w.totalUsdt) / newTotal : cur.avgEntryPrice;
            return {
              ...cur,
              usdtBalance: cur.usdtBalance - w.totalUsdt,
              unitsTotal: newTotal,
              unitsAvailable: cur.unitsAvailable + w.filledUnits,
              avgEntryPrice: newAvg,
            };
          });
        } else {
          mergePos((cur) => ({
            ...cur,
            usdtBalance: cur.usdtBalance + (w.totalUsdt - fee),
            unitsTotal: Math.max(0, cur.unitsTotal - w.filledUnits),
            unitsAvailable: Math.max(0, cur.unitsAvailable - w.filledUnits),
          }));
        }
        setMyOrders((prev) => [
          {
            id,
            marketId,
            side: payload.side,
            mode: "limit",
            price: payload.price,
            units: payload.units,
            filled: w.filledUnits,
            status: partialRest ? "partial" : "filled",
            createdAt: iso,
          },
          ...prev,
        ]);
        setOrderFeedback(
          partialRest
            ? {
                tone: "warn",
                title: t("secondaryMarket.actions.feedbackPartialFillTitle"),
                body: tm(t, "secondaryMarket.orderBook.feedback.partialLimitBody", {
                  filled: w.filledUnits,
                  unfilled: w.unfilledUnits,
                }),
              }
            : {
                tone: "success",
                title: t("secondaryMarket.actions.feedbackOrderFilledTitle"),
                body: tm(t, "secondaryMarket.orderBook.feedback.limitFilledBody", {
                  filled: w.filledUnits,
                  price: formatUsdt(w.avgPrice),
                }),
              },
        );
        setIsSubmitting(false);
        return;
      }

      setMyOrders((prev) => [
        {
          id,
          marketId,
          side: payload.side,
          mode: "limit",
          price: payload.price,
          units: payload.units,
          filled: 0,
          status: "active",
          createdAt: iso,
        },
        ...prev,
      ]);
      setOrderFeedback({
        tone: "info",
        title: t("secondaryMarket.orderBook.feedback.orderPlacedTitle"),
        body: t("secondaryMarket.orderBook.feedback.orderPlacedBody"),
      });
      setIsSubmitting(false);
    },
    [
      bestAsk,
      bestBid,
      marketId,
      m.asks,
      m.bids,
      tick,
      isLiveBook,
      onLiveRefresh,
      liveBookMarket,
      authorizedFetch,
      reloadMyOrders,
      consentGate,
      t,
      apiError,
    ],
  );

  const sparkPositive = (m.priceSpark[m.priceSpark.length - 1] ?? 0) >= (m.priceSpark[0] ?? 0);
  const chPos = m.change24hPct >= 0;

  const askMax = maxUnits(asksAgg);
  const bidMax = maxUnits(bidsAgg);
  const depthMax = Math.max(askMax, bidMax);

  const asksAsc = [...asksAgg].sort((a, b) => a.price - b.price);
  const askWithCumAsc = asksAsc.reduce<Array<BookLevel & { cum: number }>>((acc, lvl) => {
    const prev = acc[acc.length - 1]?.cum ?? 0;
    acc.push({ ...lvl, cum: prev + lvl.price * lvl.units });
    return acc;
  }, []);
  const askRows = [...askWithCumAsc].reverse();

  const bidsDesc = [...bidsAgg].sort((a, b) => b.price - a.price);
  const bidRows = bidsDesc.reduce<Array<BookLevel & { cum: number }>>((acc, lvl) => {
    const prev = acc[acc.length - 1]?.cum ?? 0;
    acc.push({ ...lvl, cum: prev + lvl.price * lvl.units });
    return acc;
  }, []);

  const pickLevel = (p: number, variant: "ask" | "bid") => {
    setLimitSeed({ price: p, side: variant === "ask" ? "buy" : "sell" });
    setTicketRev((r) => r + 1);
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
      setBookHiddenForMarketId(marketId);
    }
  };

  const unrealizedPnL = myPosition.unitsAvailable > 0 ? (last - myPosition.avgEntryPrice) * myPosition.unitsAvailable : 0;

  const bidVolume = bidsAgg.reduce((a, l) => a + l.units, 0);
  const askVolume = asksAgg.reduce((a, l) => a + l.units, 0);
  const bookTotal = bidVolume + askVolume;
  const buyPct = bookTotal > 0 ? (bidVolume / bookTotal) * 100 : 50;

  return (
    <div className={cn(isWorkspace ? "flex w-full min-h-0 flex-col gap-2 px-3 pb-4 md:px-5" : "space-y-3")}>
      {isWorkspace ? (
        <SecondaryMarketBookWorkspaceHeader
          symbol={m.symbol}
          track={m.track}
          artist={m.artist}
          last={last}
          change24hPct={m.change24hPct}
          high24h={m.high24h}
          low24h={m.low24h}
          volume24hUsdt={m.volume24hUsdt}
          bid={bestBid}
          ask={bestAsk}
        />
      ) : null}

      {isWorkspace ? null : (
        <SecondaryMarketBreadcrumbNav
          items={[
            { label: t("meta.secondaryMarket.breadcrumb.secondaryMarket"), href: secondaryMarketHref("market") },
            { label: t("meta.secondaryMarket.breadcrumb.listingsMarket"), href: secondaryMarketHref("market") },
            { label: tm(t, "meta.secondaryMarket.breadcrumb.terminal", { pair: `${m.symbol}/USDT` }) },
          ]}
        />
      )}

      {/* Переключение рынков — только в demo/mock, не на странице терминала */}
      {!isWorkspace && !isLiveBook ? (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{t("secondaryMarket.orderBook.instrument")}</p>
        <div
          className="flex w-full max-w-xl gap-0.5 rounded-full bg-black/55 p-0.5 font-mono text-[11px] ring-1 ring-white/8 sm:ml-auto sm:w-auto"
          role="tablist"
          aria-label={t("secondaryMarket.aria.instrumentSwitch")}
        >
          {BOOK_MARKETS.map((x) => {
            const active = marketId === x.id;
            return (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={active}
                title={`${x.track} · ${x.symbol}/USDT`}
                onClick={() => navigateMarket(x.id)}
                className={cn(
                  "min-w-0 flex-1 rounded-full px-3 py-1.5 font-semibold transition-colors sm:flex-none sm:px-4",
                  active ? "bg-white text-black" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                )}
              >
                {x.symbol}
              </button>
            );
          })}
        </div>
      </div>
      ) : null}
      {!isWorkspace ? (
      <>
      <p className="truncate font-mono text-[10px] text-zinc-600">
        {m.track} · {m.symbol}/USDT
        <span className="text-zinc-700"> · </span>
        <span className={cn("tabular-nums", chPos ? "text-[#B7F500]" : "text-fuchsia-300")}>
          {chPos ? "+" : ""}
          {tm(t, "secondaryMarket.orderBook.change24h", {
            pct: m.change24hPct.toLocaleString("ru-RU", { maximumFractionDigits: 2 }),
          })}
        </span>
      </p>

      {/* Сводка по инструменту */}
      <div className="border-b border-white/10 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <CoverThumb symbol={m.symbol} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-end gap-x-2 gap-y-0">
                <h2 className="truncate text-sm font-semibold text-white sm:text-base">{m.track}</h2>
                <span className="font-mono text-[11px] text-zinc-500">{m.symbol}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                    m.liquidity === "high" && "bg-[#B7F500]/12 text-[#d4f570]",
                    m.liquidity === "med" && "bg-zinc-600/25 text-zinc-400",
                    m.liquidity === "low" && "bg-amber-500/15 text-amber-200/90",
                  )}
                >
                  {liquidityShortLabel(m.liquidity, t)}
                </span>
              </div>
              <p className="truncate font-mono text-[10px] text-zinc-600">
                {m.artist}
                <span className="text-zinc-700"> · </span>
                <span className="text-zinc-500">{m.genre}</span>
              </p>
              <Link
                href={`${analyticsReleaseDetailPath(getSecondaryMarketAnalyticsCatalogIdForReleaseSlug(m.releaseId))}?from=secondary`}
                className="mt-1 inline-block font-mono text-[10px] text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
              >
                {t("secondaryMarket.actions.release")}
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 lg:justify-end">
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">Last</span>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xl font-semibold tracking-tight text-white tabular-nums sm:text-2xl">
                  {formatUsdt(last)}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-semibold tabular-nums",
                    chPos ? "text-[#B7F500]" : "text-fuchsia-300",
                  )}
                >
                  {chPos ? "+" : ""}
                  {m.change24hPct.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%
                </span>
              </div>
            </div>
            <OrderBookMiniSparkline values={m.priceSpark} positive={sparkPositive} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Link
            href={secondaryMarketHref("analytics", { release: m.releaseId })}
            className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
          >
            {t("secondaryMarket.orderBook.marketAnalytics")}
          </Link>
          <Link
            href={`${analyticsReleaseDetailPath(getSecondaryMarketAnalyticsCatalogIdForReleaseSlug(m.releaseId))}?from=secondary`}
            className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
          >
            {t("secondaryMarket.orderBook.openRelease")}
          </Link>
          <Link
            href={secondaryMarketHref("orders")}
            className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
          >
            {t("secondaryMarket.orderBook.myOrders")}
          </Link>
          <Link
            href={secondaryMarketHref("history")}
            className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
          >
            {t("secondaryMarket.orderBook.tradeHistory")}
          </Link>
        </div>

        <div className="mt-3 rounded-xl bg-[#0f0f0f] p-3 ring-1 ring-white/7">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[10px] text-zinc-500 sm:grid-cols-4 lg:grid-cols-9 lg:gap-x-4">
            <div className="min-w-0">
              <p className="truncate uppercase tracking-wider">{t("secondaryMarket.orderBook.max24h")}</p>
              <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-zinc-200">{formatUsdt(m.high24h)}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate uppercase tracking-wider">{t("secondaryMarket.orderBook.min24h")}</p>
              <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-zinc-200">{formatUsdt(m.low24h)}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate uppercase tracking-wider">Bid</p>
              <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-[#B7F500]">{bestBid ? formatUsdt(bestBid) : "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate uppercase tracking-wider">Ask</p>
              <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-fuchsia-300">{bestAsk ? formatUsdt(bestAsk) : "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate uppercase tracking-wider">{t("secondaryMarket.kpi.spread")}</p>
              <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-zinc-300">{spread > 0 ? formatUsdt(spread) : "—"}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate uppercase tracking-wider">{t("secondaryMarket.orderBook.volume24h")}</p>
              <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-white">{formatUsdtCompact(m.volume24hUsdt)} USDT</p>
              <p className="truncate text-zinc-600">{m.volume24hUnits} u</p>
            </div>
            <div className="min-w-0">
              <p className="truncate uppercase tracking-wider">{t("secondaryMarket.orderBook.tape")}</p>
              <p className="mt-0.5 text-xs font-semibold tabular-nums text-zinc-200">{displayTrades.length}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate uppercase tracking-wider">{t("secondaryMarket.kpi.liquidLots")}</p>
              <p className="mt-0.5 truncate text-xs font-semibold text-zinc-200">{liquidityLabel(m.liquidity, t)}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate uppercase tracking-wider">{t("secondaryMarket.orderBook.listings")}</p>
              <p className="mt-0.5 text-xs font-semibold tabular-nums text-zinc-200">{m.rightsListed}</p>
            </div>
          </div>
        </div>
      </div>
      </>
      ) : null}

      {!isWorkspace && m.liquidity === "low" ? (
        <p className="font-mono text-[10px] text-amber-200/85">{t("secondaryMarket.orderBook.lowLiquidityWarn")}</p>
      ) : null}

      {bookDockHidden ? (
        <button
          type="button"
          onClick={() => setBookHiddenForMarketId(null)}
          className="xl:hidden w-full rounded-xl border border-white/15 bg-[#111111] py-2.5 font-mono text-[11px] font-semibold text-zinc-200 ring-1 ring-white/6 transition hover:border-white/25 hover:text-white"
        >
          {t("secondaryMarket.orderBook.showBookTrades")}
        </button>
      ) : null}

      <div className="flex min-h-0 flex-col gap-2">
        <div
          className={cn(
            "grid min-h-0 gap-2",
            isWorkspace
              ? "grid-cols-2 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)] lg:items-stretch lg:gap-3"
              : "xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:items-stretch",
          )}
        >
        <div className={cn("min-w-0", isWorkspace ? "lg:order-1" : "xl:order-2")}>
          <SecondaryMarketOrderEntryPanel
            key={`${marketId}-${tick}-${ticketRev}`}
            m={{ symbol: m.symbol, asks: m.asks, bids: m.bids }}
            tick={tick}
            bestAsk={bestAsk}
            bestBid={bestBid}
            limitSeed={limitSeed}
            unitsAvailable={myPosition.unitsAvailable}
            usdtBalance={myPosition.usdtBalance}
            lockedUnits={lockedUnitsForPanel}
            isSubmitting={isSubmitting}
            consentBlocked={
              consentGate.isChecking || consentGate.checkError || consentGate.hasBlockingEligibility
            }
            liveTrading={
              isLiveBook && liveBookMarket?.releaseUuid
                ? {
                    releaseUuid: liveBookMarket.releaseUuid,
                    marketId: initialMarketId ?? marketId,
                    authorizedFetch,
                  }
                : undefined
            }
            onSubmit={handleOrderSubmit}
          />
        </div>

        {/* Стакан / сделки рынка по релизу */}
        <div
          className={cn(
            "flex min-w-0 flex-col overflow-hidden bg-black",
            isWorkspace
              ? "min-h-[280px] max-h-[min(52vh,400px)] lg:min-h-[min(48vh,420px)] lg:max-h-[min(72vh,720px)] lg:order-2 lg:rounded-lg lg:ring-1 lg:ring-white/8"
              : "min-h-[min(56vh,480px)] rounded-xl bg-[#0a0a0a] ring-1 ring-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] xl:order-1",
            bookDockHidden && "max-xl:hidden",
          )}
        >
          {isWorkspace ? null : (
            <div className="flex shrink-0 items-center justify-between border-b border-white/8 bg-black/40 px-3 py-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {t("secondaryMarket.orderBook.title")}
              </p>
              <span className="font-mono text-[10px] tabular-nums text-zinc-500">
                {m.symbol}
                <span className="text-zinc-600">/USDT</span>
              </span>
            </div>
          )}
          <div className="flex border-b border-white/8 font-mono text-[12px]">
            <button
              type="button"
              onClick={() => setWorkspaceTab("book")}
              className={cn(
                "relative flex-1 py-2.5 font-semibold transition-colors",
                workspaceTab === "book" ? "text-white" : "text-zinc-500",
              )}
            >
              {t("secondaryMarket.orderBook.tabBook")}
              {workspaceTab === "book" ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-white" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("trades")}
              className={cn(
                "relative flex-1 py-2.5 font-semibold transition-colors",
                workspaceTab === "trades" ? "text-white" : "text-zinc-500",
              )}
            >
              {t("secondaryMarket.orderBook.tabTrades")}
              {workspaceTab === "trades" ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-white" aria-hidden />
              ) : null}
            </button>
          </div>

          {workspaceTab === "book" ? (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{t("secondaryMarket.orderBook.priceStep")}</span>
                <div className="flex rounded-md bg-black/50 p-0.5 font-mono text-[10px]">
                  {TICK_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTick(t)}
                      className={cn(
                        "rounded px-2 py-1 font-medium",
                        tick === t ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_56px_80px] border-b border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600 sm:text-[10px]">
                <span>{t("secondaryMarket.orderBook.priceHeader")}</span>
                <span className="text-center">{t("secondaryMarket.orderBook.unitsHeader")}</span>
                <span className="text-right">{t("secondaryMarket.orderBook.depthHeader")}</span>
              </div>

              {isWorkspace ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
                  <div className="grid min-h-0 flex-[1.08] grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
                    <p className="shrink-0 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-fuchsia-400/90">
                      {t("secondaryMarket.orderBook.sellSide")}
                    </p>
                    <div className="flex min-h-0 flex-col justify-start overflow-y-auto">
                      {askRows.map((row) => (
                        <OrderBookRow
                          key={`ask-${row.price}-${tick}`}
                          price={row.price}
                          units={row.units}
                          cumulativeUsdt={row.cum}
                          depthMax={depthMax}
                          variant="ask"
                          compact
                          onPick={() => pickLevel(row.price, "ask")}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 border-y border-white/8 bg-black/55 px-2 py-2 text-center">
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-600">{t("secondaryMarket.orderBook.mid")}</p>
                    <p className="font-mono text-lg font-semibold tabular-nums tracking-tight text-white sm:text-xl">
                      {mid > 0 ? formatUsdt(mid) : "—"}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] tabular-nums text-zinc-600">
                      {tm(t, "secondaryMarket.orderBook.spreadLabel", { spread: spread > 0 ? formatUsdt(spread) : "—" })}
                    </p>
                  </div>

                  <div className="grid min-h-0 flex-[1.08] grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
                    <p className="shrink-0 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#B7F500]/90">
                      {t("secondaryMarket.orderBook.buySide")}
                    </p>
                    <div className="flex min-h-0 flex-col justify-start overflow-y-auto">
                      {bidRows.map((row) => (
                        <OrderBookRow
                          key={`bid-${row.price}-${tick}`}
                          price={row.price}
                          units={row.units}
                          cumulativeUsdt={row.cum}
                          depthMax={depthMax}
                          variant="bid"
                          compact
                          onPick={() => pickLevel(row.price, "bid")}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <p className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-fuchsia-400/90">{t("secondaryMarket.orderBook.sellSide")}</p>
                  {askRows.map((row) => (
                    <OrderBookRow
                      key={`ask-${row.price}-${tick}`}
                      price={row.price}
                      units={row.units}
                      cumulativeUsdt={row.cum}
                      depthMax={depthMax}
                      variant="ask"
                      onPick={() => pickLevel(row.price, "ask")}
                    />
                  ))}

                  <div className="border-y border-white/10 bg-black/50 px-2 py-3 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">Mid</p>
                    <p className="font-mono text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      {mid > 0 ? formatUsdt(mid) : "—"}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{tm(t, "secondaryMarket.orderBook.spreadLabel", { spread: spread > 0 ? formatUsdt(spread) : "—" })}</p>
                  </div>

                  <p className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#B7F500]/90">{t("secondaryMarket.orderBook.buySide")}</p>
                  {bidRows.map((row) => (
                    <OrderBookRow
                      key={`bid-${row.price}-${tick}`}
                      price={row.price}
                      units={row.units}
                      cumulativeUsdt={row.cum}
                      depthMax={depthMax}
                      variant="bid"
                      onPick={() => pickLevel(row.price, "bid")}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={cn(isWorkspace && "flex min-h-0 flex-1 flex-col")}>
              <div className="grid grid-cols-[44px_72px_1fr_44px_88px] border-b border-white/10 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600 sm:text-[10px]">
                <span>{t("secondaryMarket.orderBook.tradesTime")}</span>
                <span>{t("secondaryMarket.orderBook.tradesSide")}</span>
                <span className="text-right">{t("secondaryMarket.orderBook.tradesPrice")}</span>
                <span className="text-right">U</span>
                <span className="text-right">{t("secondaryMarket.orderBook.tradesAmount")}</span>
              </div>
              <TradesPanel trades={displayTrades} workspace={isWorkspace} t={t} />
            </div>
          )}

          {isWorkspace && workspaceTab === "book" ? (
            <div className="shrink-0 border-t border-white/6 px-2 py-2">
              <div className="flex h-1 overflow-hidden rounded-full bg-[#161616]">
                <div className="bg-[#B7F500]" style={{ width: `${buyPct}%` }} />
                <div className="bg-fuchsia-500" style={{ width: `${100 - buyPct}%` }} />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-zinc-500">
                <span className="text-[#B7F500]">B {buyPct.toFixed(1)}%</span>
                <span className="text-fuchsia-300">S {(100 - buyPct).toFixed(1)}%</span>
              </div>
            </div>
          ) : null}
        </div>
        </div>

        {isWorkspace ? (
          <div className="col-span-2 min-w-0 lg:col-span-2">
            <div className="flex items-center gap-4 border-b border-white/8">
              <button
                type="button"
                onClick={() => setWorkspaceBottomTab("orders")}
                className={cn(
                  "relative py-3 text-[14px] font-semibold transition-colors",
                  workspaceBottomTab === "orders" ? "text-white" : "text-zinc-500",
                )}
              >
                {tm(t, "secondaryMarket.orderBook.openOrders", { count: activeOrderCount })}
                {workspaceBottomTab === "orders" ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white" aria-hidden />
                ) : null}
              </button>
              <Link
                href={secondaryMarketHref("history")}
                className="py-3 text-[14px] font-medium text-zinc-500 transition hover:text-zinc-300"
              >
                {t("secondaryMarket.orderBook.orderHistory")}
              </Link>
              <button
                type="button"
                onClick={() => setWorkspaceBottomTab("position")}
                className={cn(
                  "relative py-3 text-[14px] font-semibold transition-colors",
                  workspaceBottomTab === "position" ? "text-white" : "text-zinc-500",
                )}
              >
                {t("secondaryMarket.orderBook.position")}
                {workspaceBottomTab === "position" ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white" aria-hidden />
                ) : null}
              </button>
            </div>

            {workspaceBottomTab === "orders" ? (
              <div className="pt-2">
                <div className="mb-2 flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {(
                    [
                      ["all", "secondaryMarket.filters.all"],
                      ["active", "secondaryMarket.filters.statusActive"],
                      ["partial", "secondaryMarket.filters.statusPartial"],
                      ["filled", "secondaryMarket.filters.statusFilled"],
                      ["cancelled", "secondaryMarket.filters.statusCancelled"],
                    ] as const
                  ).map(([id, key]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOrderFilter(id)}
                      className={cn(
                        smExchange.chipBase,
                        orderFilter === id ? smExchange.chipActive : smExchange.chipIdle,
                      )}
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
                {myOrdersLoading ? (
                  <p className="py-8 text-center font-mono text-[12px] text-zinc-500">{t("secondaryMarket.errors.loadingOrders")}</p>
                ) : marketOrdersAll.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-[16px] font-semibold text-zinc-300">{t("secondaryMarket.orderBook.noRecords")}</p>
                    <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-zinc-600">
                      {t("secondaryMarket.orderBook.placeOrderHint")}
                    </p>
                  </div>
                ) : filteredMarketOrders.length === 0 ? (
                  <p className="py-8 text-center font-mono text-[12px] text-zinc-500">{t("secondaryMarket.orderBook.noOrdersInFilterShort")}</p>
                ) : (
                  <>
                    <div className="md:hidden">
                      {filteredMarketOrders.map((o) => {
                        const canCancel =
                          isLiveBook && o.canCancel != null
                            ? o.canCancel
                            : o.status === "active" || o.status === "partial";
                        return (
                          <SecondaryMarketTerminalOrderCard
                            key={o.id}
                            side={o.side}
                            mode={o.mode}
                            price={o.price}
                            units={o.units}
                            filled={o.filled}
                            statusLabel={orderStatusLabel(o.status, locale)}
                            createdAt={o.createdAt}
                            canCancel={canCancel}
                            onCancel={() => void cancelOrder(o.id)}
                          />
                        );
                      })}
                    </div>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[684px] table-fixed border-separate border-spacing-0 font-mono text-[11px] tabular-nums">
                        <thead className="text-zinc-500">
                          <tr className="border-b border-white/8">
                            <th className="py-1.5 text-left font-normal">{t("secondaryMarket.orders.columnSide")}</th>
                            <th className="py-1.5 text-left font-normal">{t("secondaryMarket.orders.columnType")}</th>
                            <th className="py-1.5 text-right font-normal">{t("secondaryMarket.orderBook.columnPrice")}</th>
                            <th className="py-1.5 text-right font-normal">{t("secondaryMarket.orders.columnUnits")}</th>
                            <th className="py-1.5 text-right font-normal">{t("secondaryMarket.orders.columnStatus")}</th>
                            <th className="py-1.5 text-right font-normal">{t("secondaryMarket.orderBook.columnAction")}</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-300">
                          {filteredMarketOrders.map((o) => {
                            const canCancel =
                              isLiveBook && o.canCancel != null
                                ? o.canCancel
                                : o.status === "active" || o.status === "partial";
                            return (
                              <tr key={o.id} className="border-b border-white/5">
                                <td className={cn("py-2", o.side === "buy" ? "text-[#B7F500]" : "text-fuchsia-300")}>
                                  {o.side === "buy" ? t("secondaryMarket.side.buy") : t("secondaryMarket.side.sell")}
                                </td>
                                <td className="py-2 text-zinc-500">{orderTypeLabel(o.mode, t)}</td>
                                <td className="py-2 text-right">{formatUsdt(o.price)}</td>
                                <td className="py-2 text-right">{o.filled}/{o.units}</td>
                                <td className="py-2 text-zinc-400">{orderStatusLabel(o.status, locale)}</td>
                                <td className="py-2 text-right">
                                  {canCancel ? (
                                    <button
                                      type="button"
                                      onClick={() => void cancelOrder(o.id)}
                                      className="rounded-md border border-white/10 px-2 py-1 text-[10px] hover:border-fuchsia-400/40"
                                    >
                                      {t("secondaryMarket.actions.cancel")}
                                    </button>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="py-3 font-mono text-[12px]">
                {myPosition.unitsTotal <= 0 && myPosition.unitsAvailable <= 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-[15px] font-semibold text-zinc-300">{t("secondaryMarket.orderBook.noPosition")}</p>
                    <p className="mt-2 text-[13px] text-zinc-600">{t("secondaryMarket.orderBook.noPositionHint")}</p>
                  </div>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-zinc-600">{t("secondaryMarket.orderBook.totalUnt")}</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-white">{myPosition.unitsTotal}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-600">{t("secondaryMarket.orderBook.freeUnits")}</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-[#B7F500]">{myPosition.unitsAvailable}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-600">{t("secondaryMarket.orderBook.lockedUnits")}</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-amber-200">{lockedUnitsForPanel}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-600">{t("secondaryMarket.orderBook.avgEntry")}</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-zinc-200">{formatUsdt(myPosition.avgEntryPrice)}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-600">{t("secondaryMarket.orderBook.mark")}</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-white">{formatUsdt(last)}</dd>
                    </div>
                    <div>
                      <dt className="text-zinc-600">{t("secondaryMarket.forms.availableUsdt")}</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-zinc-200">{formatUsdt(myPosition.usdtBalance)}</dd>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <dt className="text-zinc-600">{t("secondaryMarket.orderBook.unrealizedPnl")}</dt>
                      <dd
                        className={cn(
                          "mt-0.5 font-semibold tabular-nums",
                          unrealizedPnL > 0 ? "text-[#B7F500]" : unrealizedPnL < 0 ? "text-fuchsia-300" : "text-zinc-400",
                        )}
                      >
                        {unrealizedPnL === 0 ? "—" : `${unrealizedPnL > 0 ? "+" : ""}${formatUsdt(unrealizedPnL)} USDT`}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>
            )}
          </div>
        ) : (
        <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div className="rounded-xl bg-[#0f0f0f] p-3 ring-1 ring-white/7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.orderBook.myOrdersTitle")}</p>
                <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{t("secondaryMarket.orderBook.myOrdersSubtitle")}</p>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">
                {tm(t, "secondaryMarket.orderBook.activeCount", { count: activeOrderCount })}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(
                [
                  ["all", "secondaryMarket.filters.all"],
                  ["active", "secondaryMarket.filters.statusActive"],
                  ["partial", "secondaryMarket.filters.statusPartial"],
                  ["filled", "secondaryMarket.filters.statusFilled"],
                  ["cancelled", "secondaryMarket.filters.statusCancelled"],
                ] as const
              ).map(([id, key]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOrderFilter(id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 font-mono text-[10px] transition",
                    orderFilter === id ? "bg-white text-black" : "bg-black/40 text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            {marketOrdersAll.length === 0 ? (
              <p className="mt-3 font-mono text-[11px] text-zinc-600">{t("secondaryMarket.orderBook.noOrdersYet")}</p>
            ) : filteredMarketOrders.length === 0 ? (
              <p className="mt-3 font-mono text-[11px] text-zinc-600">{t("secondaryMarket.orderBook.noOrdersInFilter")}</p>
            ) : (
              <div className="mt-2 overflow-x-auto [-webkit-overflow-scrolling:touch]">
                <table className="w-full min-w-[684px] table-fixed border-separate border-spacing-0 font-mono text-[11px] tabular-nums">
                  <colgroup>
                    <col style={{ width: 108 }} />
                    <col style={{ width: 52 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 56 }} />
                    <col style={{ width: 56 }} />
                    <col style={{ width: 56 }} />
                    <col style={{ width: 96 }} />
                    <col style={{ width: 104 }} />
                    <col style={{ width: 76 }} />
                  </colgroup>
                  <thead className="text-zinc-500">
                    <tr className="border-b border-white/8">
                      <th className="py-1.5 pl-0 pr-2 text-left align-bottom font-normal">{t("secondaryMarket.orders.columnSide")}</th>
                      <th className="px-1 py-1.5 text-left align-bottom font-normal">{t("secondaryMarket.orders.columnType")}</th>
                      <th className="px-1 py-1.5 text-right align-bottom font-normal">{t("secondaryMarket.orderBook.columnPrice")}</th>
                      <th className="px-1 py-1.5 text-right align-bottom font-normal">{t("secondaryMarket.orders.columnUnits")}</th>
                      <th className="px-1 py-1.5 text-right align-bottom font-normal">{t("secondaryMarket.orders.columnFilled")}</th>
                      <th className="px-1 py-1.5 text-right align-bottom font-normal">{t("secondaryMarket.orders.columnRemainder")}</th>
                      <th className="px-1 py-1.5 text-left align-bottom font-normal">{t("secondaryMarket.orders.columnStatus")}</th>
                      <th className="px-1 py-1.5 text-right align-bottom font-normal">{t("secondaryMarket.orders.columnCreated")}</th>
                      <th className="py-1.5 pl-2 pr-0 text-right align-bottom font-normal">{t("secondaryMarket.orderBook.columnAction")}</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    {filteredMarketOrders.map((o) => {
                      const remain = Math.max(0, o.units - o.filled);
                      const canCancel =
                        isLiveBook && o.canCancel != null
                          ? o.canCancel
                          : o.status === "active" || o.status === "partial";
                      const createdShort = new Date(o.createdAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <tr key={o.id} className="border-b border-white/5">
                          <td
                            className={cn(
                              "whitespace-nowrap py-1.5 pl-0 pr-2 align-middle",
                              o.side === "buy" ? "text-[#B7F500]" : "text-fuchsia-300",
                            )}
                          >
                            {o.side === "buy" ? t("secondaryMarket.side.buy") : t("secondaryMarket.side.sell")}
                          </td>
                          <td className="whitespace-nowrap px-1 py-1.5 align-middle text-zinc-500">{orderTypeLabel(o.mode, t)}</td>
                          <td className="whitespace-nowrap px-1 py-1.5 text-right align-middle text-zinc-200">
                            {o.mode === "market" ? (
                              <span title={t("secondaryMarket.orderBook.avgFillTooltip")}>{formatUsdt(o.price)}</span>
                            ) : (
                              formatUsdt(o.price)
                            )}
                          </td>
                          <td className="whitespace-nowrap px-1 py-1.5 text-right align-middle">{o.units}</td>
                          <td className="whitespace-nowrap px-1 py-1.5 text-right align-middle">{o.filled}</td>
                          <td className="whitespace-nowrap px-1 py-1.5 text-right align-middle">{remain}</td>
                          <td className="whitespace-nowrap px-1 py-1.5 align-middle text-zinc-400">
                            {orderStatusLabel(o.status, locale)}
                          </td>
                          <td className="whitespace-nowrap px-1 py-1.5 text-right align-middle text-zinc-500">{createdShort}</td>
                          <td className="py-1.5 pl-2 pr-0 text-right align-middle">
                            {canCancel ? (
                              <button
                                type="button"
                                onClick={() => cancelOrder(o.id)}
                                className="inline-flex h-7 items-center justify-center rounded-md border border-white/12 px-2 font-mono text-[10px] text-zinc-200 transition hover:border-fuchsia-400/35 hover:text-fuchsia-100"
                              >
                                {t("secondaryMarket.actions.cancel")}
                              </button>
                            ) : (
                              <span className="inline-block w-full text-right text-zinc-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-[#111111] p-3 ring-1 ring-white/6">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.orderBook.myPositionTitle")}</p>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{t("secondaryMarket.orderBook.positionSubtitle")}</p>
            {myPosition.unitsTotal <= 0 && myPosition.unitsAvailable <= 0 ? (
              <p className="mt-3 font-mono text-[11px] text-zinc-600">{t("secondaryMarket.orderBook.noOpenPosition")}</p>
            ) : (
              <dl className="mt-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between gap-2 border-b border-white/5 pb-1.5">
                  <dt className="text-zinc-500">{t("secondaryMarket.orderBook.totalUnits")}</dt>
                  <dd className="tabular-nums text-zinc-200">{myPosition.unitsTotal}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-white/5 pb-1.5">
                  <dt className="text-zinc-500">{t("secondaryMarket.orderBook.freeUnits")}</dt>
                  <dd className="tabular-nums text-[#c8f06a]">{myPosition.unitsAvailable}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-white/5 pb-1.5">
                  <dt className="text-zinc-500">{t("secondaryMarket.orderBook.lockedUnits")}</dt>
                  <dd className="tabular-nums text-amber-200/90">{lockedUnitsForPanel}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-white/5 pb-1.5">
                  <dt className="text-zinc-500">{t("secondaryMarket.orderBook.avgEntry")}</dt>
                  <dd className="tabular-nums text-zinc-200">{formatUsdt(myPosition.avgEntryPrice)}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-white/5 pb-1.5">
                  <dt className="text-zinc-500">{t("secondaryMarket.orderBook.markLast")}</dt>
                  <dd className="tabular-nums text-white">{formatUsdt(last)}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-white/5 pb-1.5">
                  <dt className="text-zinc-500">{t("secondaryMarket.orderBook.positionValue")}</dt>
                  <dd className="tabular-nums text-zinc-200">{formatUsdt(myPosition.unitsAvailable * last)} USDT</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-white/5 pb-1.5">
                  <dt className="text-zinc-500">{t("secondaryMarket.forms.availableUsdt")}</dt>
                  <dd className="tabular-nums text-zinc-200">{formatUsdt(myPosition.usdtBalance)}</dd>
                </div>
                <div className="flex justify-between gap-2 pt-0.5">
                  <dt className="text-zinc-500">{t("secondaryMarket.orderBook.unrealizedPnlEstimate")}</dt>
                  <dd
                    className={cn(
                      "tabular-nums font-semibold",
                      unrealizedPnL > 0 ? "text-[#B7F500]" : unrealizedPnL < 0 ? "text-fuchsia-300" : "text-zinc-400",
                    )}
                  >
                    {unrealizedPnL === 0 ? "—" : `${unrealizedPnL > 0 ? "+" : ""}${formatUsdt(unrealizedPnL)} USDT`}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
        )}
      </div>

      <SecondaryMarketOrderFeedbackModal
        open={orderFeedback !== null}
        feedback={orderFeedback}
        onOpenChange={(next) => {
          if (!next) setOrderFeedback(null);
        }}
      />

      {isLiveBook ? (
        <>
          <LegalConsentGateAlert gate={consentGate} variant="dark" className="mx-4 mb-3 max-w-xl" />
          <EligibilityNotice result={consentGate.eligibility} />
          <LegalConsentModal
            open={consentGate.consentOpen}
            title={t("secondaryMarket.orderBook.consentTitle")}
            description={t("secondaryMarket.orderBook.consentDescription")}
            items={consentGate.missingItems}
            source="SECONDARY_TRADE"
            authorizedFetch={authorizedFetch}
            onAccepted={consentGate.onConsentAccepted}
            onClose={() => consentGate.dismissConsent()}
          />
        </>
      ) : null}
    </div>
  );
}
