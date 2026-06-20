"use client";

import * as React from "react";

import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { statusLabel } from "@/lib/i18n/status-labels";
import type { AppLocale } from "@/lib/i18n/types";
import { ROUTES } from "@/constants/routes";
import { marketErrorMessage } from "@/services/secondary-market.service";
import { getWalletDataSource } from "@/services/wallet.service";
import { useSecondaryMarketMyOrders } from "@/hooks/use-secondary-market-live";
import {
  SecondaryMarketAuthGate,
  SecondaryMarketErrorState,
  SecondaryMarketLoadingState,
} from "@/components/dashboard/secondary-market/secondary-market-fetch-states";
import { Dialog } from "@base-ui/react/dialog";
import { ExternalLink, LayoutPanelTop, MoreHorizontal, Plus, Search, X } from "@/lib/lucide";

import {
  secondaryMarketBookHref,
  secondaryMarketBookIdForSymbol,
  secondaryMarketHref,
} from "@/constants/dashboard/secondary-market";
import {
  analyticsReleaseDetailPath,
  secondaryMarketListingInfoPath,
  secondaryMarketReleaseAnalyticsPath,
} from "@/constants/routes";
import { getSecondaryMarketAnalyticsCatalogIdForReleaseSlug } from "@/mocks/dashboard/secondary-market-listings.mock";
import { SECONDARY_MARKET_LISTINGS_MOCK } from "@/mocks/dashboard/secondary-market-listings.mock";
import type { UserHoldingItem } from "@/services/secondary-market.service";
import { cn } from "@/lib/utils";

import { OrderCancelConfirmModal } from "@/components/dashboard/secondary-market/secondary-market-order-cancel-confirm-modal";
import { SecondaryMarketCreateListingSheet } from "@/components/dashboard/secondary-market/secondary-market-create-listing-sheet";
import {
  smTableActionIconCircle,
  smTableActionIconCirclePressed,
  smTableActionMenuItem,
  smTableActionMenuItemAccent,
  smTableActionMenuItemDestructive,
  smTableActionMenuItemLink,
  smTableActionMenuItemMuted,
  smTableActionMenuItemSecondary,
  smTableActionMoreMenu,
  smTableActionReleasePill,
} from "@/components/dashboard/secondary-market/secondary-market-table-action-styles";

type OrderStatus = "active" | "partial" | "filled" | "cancelled" | "expired" | "rejected";
type OrderSide = "buy" | "sell";
type OrderMode = "limit" | "market";

type UserOrder = {
  id: string;
  listingId: string;
  symbol: string;
  track: string;
  artist: string;
  releaseId: string;
  side: OrderSide;
  mode: OrderMode;
  pricePerUnit: number | null;
  unitsTotal: number;
  unitsFilled: number;
  /** Номинал заявки в USDT (лимит: цена×объём; рынок — по факту исполнения в макете). */
  orderValueUsdt: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  /** Для статуса «Сбой»: краткое пояснение для оператора. */
  failureReason?: string;
  canCancel?: boolean;
};

const MOCK_ORDERS: UserOrder[] = [
  {
    id: "ord-8f2a",
    listingId: "lst-mnr",
    symbol: "MNR",
    track: "Midnight Run",
    artist: "Nova Lane",
    releaseId: "midnight-run",
    side: "buy",
    mode: "limit",
    pricePerUnit: 18.48,
    unitsTotal: 80,
    unitsFilled: 32,
    orderValueUsdt: 18.48 * 80,
    status: "partial",
    createdAt: "19.04.2026 11:42",
    updatedAt: "19.04.2026 12:08",
  },
  {
    id: "ord-7c11",
    listingId: "lst-sgn",
    symbol: "SGN",
    track: "Signal / Noise",
    artist: "Kairo",
    releaseId: "signal-noise",
    side: "sell",
    mode: "limit",
    pricePerUnit: 22.1,
    unitsTotal: 20,
    unitsFilled: 0,
    orderValueUsdt: 22.1 * 20,
    status: "active",
    createdAt: "19.04.2026 10:15",
    updatedAt: "19.04.2026 10:15",
  },
  {
    id: "ord-6d90",
    listingId: "lst-mnr",
    symbol: "MNR",
    track: "Midnight Run",
    artist: "Nova Lane",
    releaseId: "midnight-run",
    side: "buy",
    mode: "market",
    pricePerUnit: null,
    unitsTotal: 12,
    unitsFilled: 12,
    orderValueUsdt: 221.76,
    status: "filled",
    createdAt: "18.04.2026 16:22",
    updatedAt: "18.04.2026 16:22",
  },
  {
    id: "ord-5a33",
    listingId: "lst-gls",
    symbol: "GLS",
    track: "Glassline",
    artist: "The Static",
    releaseId: "glassline",
    side: "buy",
    mode: "limit",
    pricePerUnit: 9.0,
    unitsTotal: 100,
    unitsFilled: 0,
    orderValueUsdt: 9.0 * 100,
    status: "cancelled",
    createdAt: "18.04.2026 09:03",
    updatedAt: "18.04.2026 14:18",
  },
  {
    id: "ord-4b02",
    listingId: "lst-aur",
    symbol: "AUR",
    track: "Aurora Drift",
    artist: "Mira Sol",
    releaseId: "aurora-drift",
    side: "sell",
    mode: "limit",
    pricePerUnit: 11.3,
    unitsTotal: 45,
    unitsFilled: 0,
    orderValueUsdt: 11.3 * 45,
    status: "expired",
    createdAt: "17.04.2026 08:00",
    updatedAt: "19.04.2026 08:00",
  },
  {
    id: "ord-3e77",
    listingId: "lst-vlt",
    symbol: "VLT",
    track: "Velvet Room",
    artist: "June & Co",
    releaseId: "velvet-room",
    side: "buy",
    mode: "limit",
    pricePerUnit: 6.85,
    unitsTotal: 30,
    unitsFilled: 0,
    orderValueUsdt: 6.85 * 30,
    status: "rejected",
    createdAt: "16.04.2026 21:10",
    updatedAt: "16.04.2026 21:11",
    failureReason: "secondaryMarket.orders.mockSettlementFailure",
  },
];

const STATUS_FILTER = [
  { id: "all" as const, key: "secondaryMarket.filters.all" },
  { id: "active" as const, key: "secondaryMarket.filters.statusActive" },
  { id: "partial" as const, key: "secondaryMarket.filters.statusPartial" },
  { id: "filled" as const, key: "secondaryMarket.filters.statusFilled" },
  { id: "cancelled" as const, key: "secondaryMarket.filters.statusCancelled" },
  { id: "expired" as const, key: "secondaryMarket.filters.statusExpired" },
  { id: "failed" as const, key: "secondaryMarket.filters.statusFailed" },
] as const;

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function CoverThumb({ symbol }: { symbol: string }) {
  const hue = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-8 shrink-0 rounded-full"
      style={{
        background: `linear-gradient(145deg, hsl(${hue}, 42%, 28%) 0%, hsl(${(hue + 48) % 360}, 28%, 12%) 100%)`,
      }}
      aria-hidden
    />
  );
}

function orderStatusUiLabel(s: OrderStatus, locale: AppLocale): string {
  return statusLabel("order", s, locale);
}

function statusPillClass(s: OrderStatus) {
  switch (s) {
    case "active":
      return "bg-[#B7F500]/14 text-[#d4f570]";
    case "partial":
      return "bg-amber-500/15 text-amber-200/95";
    case "filled":
      return "bg-zinc-500/20 text-zinc-300";
    case "cancelled":
      return "bg-zinc-600/25 text-zinc-500";
    case "expired":
      return "bg-zinc-600/25 text-zinc-500";
    case "rejected":
      return "bg-fuchsia-500/15 text-fuchsia-200/90";
    default:
      return "bg-zinc-600/20 text-zinc-400";
  }
}

function countBy(orders: UserOrder[], pred: (o: UserOrder) => boolean): number {
  return orders.filter(pred).length;
}

function mockUserHoldings(): UserHoldingItem[] {
  return SECONDARY_MARKET_LISTINGS_MOCK.filter((l) => l.unitsAvailable > 0).map((l) => ({
    releaseId: l.releaseId,
    trackTitle: l.track,
    symbol: l.symbol,
    unitsTotal: String(l.unitsAvailable + 24),
    unitsAvailable: String(Math.min(l.unitsAvailable, 120)),
    unitsLocked: "0",
    avgEntryPrice: String(l.pricePerUnit * 0.97),
  }));
}

function formatOrderUpdatedAt() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
}

/** Остаток в стакане: для завершённых без активного остатка — 0. */
function orderRemainingUnits(o: UserOrder): number {
  if (o.status === "filled" || o.status === "cancelled" || o.status === "expired" || o.status === "rejected") {
    return 0;
  }
  return Math.max(0, o.unitsTotal - o.unitsFilled);
}

function formatMessage(template: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );
}

type TranslateFn = (key: string) => string;

function tm(t: TranslateFn, key: string, params?: Record<string, string | number>): string {
  const raw = t(key);
  return params ? formatMessage(raw, params) : raw;
}

function lockedHint(o: UserOrder, t: TranslateFn): string {
  if (o.status === "filled" || o.status === "cancelled" || o.status === "expired" || o.status === "rejected") {
    return "—";
  }
  if (o.side === "buy") {
    const rem = orderRemainingUnits(o);
    const px = o.pricePerUnit;
    if (o.mode === "market" && px == null) {
      return tm(t, "secondaryMarket.orders.lockedMarketMock", { amount: formatUsdt(o.orderValueUsdt) });
    }
    if (px != null) {
      return tm(t, "secondaryMarket.orders.lockedBuyRemainder", {
        amount: formatUsdt(rem * px),
        units: rem,
        price: formatUsdt(px),
      });
    }
    return t("secondaryMarket.orders.lockedBuyGeneric");
  }
  return tm(t, "secondaryMarket.orders.lockedSellUnits", { units: orderRemainingUnits(o) });
}

function returnOnCancelHint(o: UserOrder, t: TranslateFn): string {
  if (o.side === "buy") {
    return t("secondaryMarket.orders.returnOnCancelBuy");
  }
  return t("secondaryMarket.orders.returnOnCancelSell");
}

function executionSourceLabel(o: UserOrder, t: TranslateFn): string {
  if (o.status === "filled" && o.mode === "market") return t("secondaryMarket.orders.executionMarketFill");
  if (o.status === "filled" && o.mode === "limit") return t("secondaryMarket.orders.executionLimitFull");
  if (o.status === "partial") return t("secondaryMarket.orders.executionPartialBook");
  if (o.status === "active") return t("secondaryMarket.orders.executionWaitingBook");
  if (o.status === "cancelled")
    return o.unitsFilled > 0
      ? t("secondaryMarket.orders.executionCancelledPartial")
      : t("secondaryMarket.orders.executionCancelledNone");
  if (o.status === "expired") return t("secondaryMarket.orders.executionExpired");
  if (o.status === "rejected") return t("secondaryMarket.orders.executionRejected");
  return "—";
}

function sideLabel(side: OrderSide, t: TranslateFn): string {
  return side === "buy" ? t("secondaryMarket.side.buy") : t("secondaryMarket.side.sell");
}

function modeLabel(mode: OrderMode, t: TranslateFn): string {
  return mode === "limit" ? t("secondaryMarket.forms.limit") : t("secondaryMarket.forms.market");
}

function bookHrefForOrder(o: UserOrder): string | null {
  const id = secondaryMarketBookIdForSymbol(o.symbol);
  return id ? secondaryMarketBookHref(id) : null;
}

/** Карточка актива (выплаты, позиция) — «Релиз» как вторичная навигация. */
function releaseAssetHref(releaseId: string) {
  const catalogId = getSecondaryMarketAnalyticsCatalogIdForReleaseSlug(releaseId);
  return `${analyticsReleaseDetailPath(catalogId)}?from=secondary`;
}

/** Модалки вкладки: без ring-бордера, шире, только тень и графитовый фон. */
const ordersModalPopupClass =
  "rounded-2xl bg-[#101010] text-white shadow-[0_32px_120px_rgba(0,0,0,0.78)] transition-[opacity,transform] duration-200 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0";

export function SecondaryMarketMyOrdersTab() {
  const isLive = getWalletDataSource() === "live";
  const { isAuthenticated } = useAuth();
  const { locale, t } = useI18n();
  const liveOrders = useSecondaryMarketMyOrders();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [orders, setOrders] = React.useState<UserOrder[]>(() => [...MOCK_ORDERS]);
  const ordersSource: UserOrder[] = isLive ? (liveOrders.orders as UserOrder[]) : orders;
  const holdingsSource: UserHoldingItem[] = isLive ? liveOrders.holdings : mockUserHoldings();
  const [cancelTarget, setCancelTarget] = React.useState<UserOrder | null>(null);
  const [isBulkCancelOpen, setIsBulkCancelOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<UserOrder | null>(null);
  const [orderActionMenuId, setOrderActionMenuId] = React.useState<string | null>(null);
  const orderMenuRef = React.useRef<HTMLDivElement | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const toastClearRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Заявка для повторного открытия деталей, если подтверждение отмены закрыли без подтверждения (переход из модалки деталей). */
  const pendingDetailRestoreOrderRef = React.useRef<UserOrder | null>(null);

  const clearToastSoon = React.useCallback((message: string) => {
    if (toastClearRef.current) clearTimeout(toastClearRef.current);
    setToastMessage(message);
    toastClearRef.current = setTimeout(() => {
      setToastMessage(null);
      toastClearRef.current = null;
    }, 4500);
  }, []);

  React.useEffect(
    () => () => {
      if (toastClearRef.current) clearTimeout(toastClearRef.current);
    },
    [],
  );

  React.useEffect(() => {
    if (!orderActionMenuId) return;
    const onDoc = (e: MouseEvent) => {
      if (orderMenuRef.current && !orderMenuRef.current.contains(e.target as Node)) {
        setOrderActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [orderActionMenuId]);

  const [statusFilter, setStatusFilter] = React.useState<(typeof STATUS_FILTER)[number]["id"]>("all");
  const [sideFilter, setSideFilter] = React.useState<"all" | OrderSide>("all");
  const [modeFilter, setModeFilter] = React.useState<"all" | OrderMode>("all");
  const [query, setQuery] = React.useState("");

  const summary = React.useMemo(() => {
    const o = ordersSource;
    return {
      active: countBy(o, (x) => x.status === "active"),
      partial: countBy(o, (x) => x.status === "partial"),
      filled: countBy(o, (x) => x.status === "filled"),
      cancelled: countBy(o, (x) => x.status === "cancelled"),
      expired: countBy(o, (x) => x.status === "expired"),
      failed: countBy(o, (x) => x.status === "rejected"),
    };
  }, [ordersSource]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return ordersSource.filter((row) => {
      if (statusFilter === "active" && row.status !== "active") return false;
      if (statusFilter === "partial" && row.status !== "partial") return false;
      if (statusFilter === "filled" && row.status !== "filled") return false;
      if (statusFilter === "cancelled" && row.status !== "cancelled") return false;
      if (statusFilter === "expired" && row.status !== "expired") return false;
      if (statusFilter === "failed" && row.status !== "rejected") return false;
      if (sideFilter !== "all" && row.side !== sideFilter) return false;
      if (modeFilter !== "all" && row.mode !== modeFilter) return false;
      if (!q) return true;
      return (
        row.id.toLowerCase().includes(q) ||
        row.symbol.toLowerCase().includes(q) ||
        row.track.toLowerCase().includes(q) ||
        row.artist.toLowerCase().includes(q)
      );
    });
  }, [query, statusFilter, sideFilter, modeFilter, ordersSource]);

  const cancellableCount = ordersSource.filter(
    (o) => (o.status === "active" || o.status === "partial") && (!isLive || o.canCancel),
  ).length;

  const canCancelOrder = (o: UserOrder) =>
    isLive ? Boolean(o.canCancel) : o.status === "active" || o.status === "partial";

  const handleCancelConfirm = React.useCallback(async () => {
    pendingDetailRestoreOrderRef.current = null;
    const wasPartial = cancelTarget?.status === "partial";
    const orderId = cancelTarget?.id;
    if (!orderId) return;
    if (isLive) {
      await liveOrders.cancelOrder(orderId);
      clearToastSoon(wasPartial ? t("secondaryMarket.toast.partialCancelled") : t("secondaryMarket.toast.listingCancelled"));
      setCancelTarget(null);
      return;
    }
    await new Promise((r) => setTimeout(r, 480));
    const updatedAt = formatOrderUpdatedAt();
    const id = cancelTarget?.id;
    if (!id) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelled" as const, updatedAt } : o)));
    clearToastSoon(wasPartial ? t("secondaryMarket.toast.partialCancelled") : t("secondaryMarket.toast.orderCancelled"));
  }, [cancelTarget, clearToastSoon, isLive, liveOrders, t]);

  const handleBulkCancel = React.useCallback(async () => {
    const targets = ordersSource.filter((o) => canCancelOrder(o));
    if (isLive) {
      if (targets.length === 0) {
        setIsBulkCancelOpen(false);
        return;
      }
      try {
        for (const order of targets) {
          await liveOrders.cancelOrder(order.id);
        }
        clearToastSoon(t("secondaryMarket.toast.bulkCancelled"));
      } catch (e) {
        clearToastSoon(marketErrorMessage(e));
      }
      setIsBulkCancelOpen(false);
      return;
    }
    await new Promise((r) => setTimeout(r, 420));
    const updatedAt = formatOrderUpdatedAt();
    setOrders((prev) =>
      prev.map((o) =>
        o.status === "active" || o.status === "partial" ? { ...o, status: "cancelled" as const, updatedAt } : o,
      ),
    );
    clearToastSoon(t("secondaryMarket.toast.bulkCancelled"));
    setIsBulkCancelOpen(false);
  }, [clearToastSoon, t]);

  const cancelModalVariant = cancelTarget?.status === "partial" ? "partial" : "active";
  const cancelModalSide = cancelTarget?.side ?? "buy";

  const marketHref = secondaryMarketHref("market");

  const detailOrder = React.useMemo(() => {
    if (!selectedOrder) return null;
    return ordersSource.find((o) => o.id === selectedOrder.id) ?? selectedOrder;
  }, [ordersSource, selectedOrder]);

  const handleCreateListing = React.useCallback(
    async (body: { releaseId: string; units: number; pricePerUnit: number }) => {
      if (isLive) {
        try {
          await liveOrders.create(body);
        } catch (e) {
          throw new Error(marketErrorMessage(e));
        }
        clearToastSoon(t("secondaryMarket.toast.listingPlaced"));
        return;
      }
      await new Promise((r) => setTimeout(r, 520));
      const listing = SECONDARY_MARKET_LISTINGS_MOCK.find((l) => l.releaseId === body.releaseId);
      const holding = holdingsSource.find((h) => h.releaseId === body.releaseId);
      const updatedAt = formatOrderUpdatedAt();
      const newOrder: UserOrder = {
        id: `ord-${Date.now().toString(36)}`,
        listingId: listing?.id ?? `lst-${body.releaseId}`,
        symbol: holding?.symbol ?? listing?.symbol ?? "—",
        track: holding?.trackTitle ?? listing?.track ?? "—",
        artist: listing?.artist ?? "—",
        releaseId: body.releaseId,
        side: "sell",
        mode: "limit",
        pricePerUnit: body.pricePerUnit,
        unitsTotal: body.units,
        unitsFilled: 0,
        orderValueUsdt: body.pricePerUnit * body.units,
        status: "active",
        createdAt: updatedAt,
        updatedAt,
      };
      setOrders((prev) => [newOrder, ...prev]);
      clearToastSoon(t("secondaryMarket.toast.listingPlacedDemo"));
    },
    [clearToastSoon, holdingsSource, isLive, liveOrders, t],
  );

  if (isLive && !isAuthenticated) {
    return <SecondaryMarketAuthGate />;
  }
  if (isLive && liveOrders.loading && liveOrders.orders.length === 0) {
    return <SecondaryMarketLoadingState label={t("secondaryMarket.errors.loadingOrders")} />;
  }
  if (isLive && liveOrders.error) {
    return <SecondaryMarketErrorState message={liveOrders.error} onRetry={() => void liveOrders.reload()} />;
  }

  return (
    <div className="relative space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-[62ch] font-mono text-[11px] leading-relaxed text-zinc-600">
          {t("secondaryMarket.orders.intro")}
        </p>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-[#B7F500] px-4 font-mono text-[12px] font-semibold text-black transition hover:bg-[#c8ff3d] active:scale-[0.98]"
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          {t("secondaryMarket.forms.createListingTitle")}
        </button>
      </div>

      <SecondaryMarketCreateListingSheet
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        holdings={holdingsSource}
        onSubmit={handleCreateListing}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-[#111111] p-4 ring-1 ring-white/6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.orders.kpiActive")}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">{summary.active}</p>
        </div>
        <div className="rounded-2xl bg-[#111111] p-4 ring-1 ring-white/6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.orders.kpiPartial")}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-amber-200/90">{summary.partial}</p>
        </div>
        <div className="rounded-2xl bg-[#111111] p-4 ring-1 ring-white/6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.orders.kpiFilled")}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-200">{summary.filled}</p>
        </div>
        <div className="rounded-2xl bg-[#111111] p-4 ring-1 ring-white/6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t("secondaryMarket.orders.kpiTerminal")}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] tabular-nums text-zinc-400">
            <span>
              <span className="text-zinc-600">{t("secondaryMarket.orders.kpiCancelledAbbr")}</span> {summary.cancelled}
            </span>
            <span>
              <span className="text-zinc-600">{t("secondaryMarket.orders.kpiExpiredAbbr")}</span> {summary.expired}
            </span>
            <span>
              <span className="text-zinc-600">{t("secondaryMarket.orders.kpiFailedAbbr")}</span> {summary.failed}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {STATUS_FILTER.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatusFilter(chip.id)}
              className={cn(
                "rounded-full px-2.5 py-1 font-mono text-[11px] font-medium transition-colors",
                statusFilter === chip.id ? "bg-white text-black" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
              )}
            >
              {t(chip.key)}
            </button>
          ))}
        </div>
        {cancellableCount > 0 ? (
          <button
            type="button"
            onClick={() => setIsBulkCancelOpen(true)}
            className="shrink-0 self-start rounded-full border border-white/12 bg-white/4 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wide text-zinc-300 transition hover:border-fuchsia-400/35 hover:text-fuchsia-200 lg:self-center"
          >
            {tm(t, "secondaryMarket.actions.cancelAllActive", { count: cancellableCount })}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("secondaryMarket.filters.searchOrders")}
            className="h-10 w-full rounded-xl bg-[#111111] py-2 pl-10 pr-3 font-mono text-sm text-white placeholder:text-zinc-600 outline-none ring-1 ring-white/10 focus:ring-[#B7F500]/35"
            aria-label={t("secondaryMarket.aria.searchOrders")}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{t("secondaryMarket.filters.side")}</span>
            {(
              [
                { id: "all" as const, key: "secondaryMarket.filters.all" },
                { id: "buy" as const, key: "secondaryMarket.side.buy" },
                { id: "sell" as const, key: "secondaryMarket.side.sell" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSideFilter(chip.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[11px] font-medium",
                  sideFilter === chip.id ? "bg-white text-black" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                )}
              >
                {t(chip.key)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{t("secondaryMarket.filters.type")}</span>
            {(
              [
                { id: "all" as const, key: "secondaryMarket.filters.all" },
                { id: "limit" as const, key: "secondaryMarket.forms.limit" },
                { id: "market" as const, key: "secondaryMarket.forms.market" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setModeFilter(chip.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[11px] font-medium",
                  modeFilter === chip.id ? "bg-white text-black" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                )}
              >
                {t(chip.key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {ordersSource.length === 0 ? (
        <div className="rounded-2xl bg-[#111111] px-6 py-16 text-center ring-1 ring-white/6">
          <h2 className="text-lg font-semibold tracking-tight text-white">{t("secondaryMarket.empty.noOrders")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            {t("secondaryMarket.empty.noOrdersDesc")}
          </p>
          <Link
            href={marketHref}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-white px-5 font-mono text-[12px] font-semibold text-black transition hover:opacity-90"
          >
            {t("secondaryMarket.actions.goToMarket")}
          </Link>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#B7F500] px-5 font-mono text-[12px] font-semibold text-black transition hover:bg-[#c8ff3d]"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            {t("secondaryMarket.forms.createListingTitle")}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#111111] px-6 py-16 text-center ring-1 ring-white/6">
          <h2 className="text-lg font-semibold tracking-tight text-white">{t("secondaryMarket.empty.noResults")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            {t("secondaryMarket.empty.noOrdersFilterDesc")}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setSideFilter("all");
              setModeFilter("all");
            }}
            className="mt-6 font-mono text-[12px] text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            {t("secondaryMarket.filters.resetFilters")}
          </button>
        </div>
      ) : (
        <>
          <div className="divide-y divide-white/6 md:hidden">
            {filtered.map((order) => {
              const bookId = secondaryMarketBookIdForSymbol(order.symbol) ?? order.releaseId;
              return (
                <div key={order.id} className="flex items-start gap-3 py-3.5">
                  <CoverThumb symbol={order.symbol} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-white">{order.track}</p>
                        <p className="truncate text-[12px] text-zinc-500">
                          {order.symbol} · {sideLabel(order.side, t)} · {modeLabel(order.mode, t)}
                        </p>
                      </div>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", statusPillClass(order.status))}>
                        {orderStatusUiLabel(order.status, locale)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[12px]">
                      <span className="text-zinc-400">
                        {order.pricePerUnit != null ? `${order.pricePerUnit.toLocaleString("ru-RU")} USDT` : t("secondaryMarket.forms.market")}
                        <span className="text-zinc-600"> · </span>
                        {order.unitsFilled}/{order.unitsTotal} u
                      </span>
                      <Link
                        href={secondaryMarketBookHref(bookId)}
                        className="text-[#B7F500] hover:underline"
                      >
                        {t("secondaryMarket.actions.orderBook")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden min-w-0 overflow-x-auto md:block">
          <table className="w-full min-w-[1020px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                <th className="px-3 py-2.5 font-normal">{t("secondaryMarket.orders.columnId")}</th>
                <th className="min-w-[200px] px-3 py-2.5 font-normal">{t("secondaryMarket.orders.columnListing")}</th>
                <th className="px-3 py-2.5 font-normal">{t("secondaryMarket.orders.columnSide")}</th>
                <th className="px-3 py-2.5 font-normal">{t("secondaryMarket.orders.columnType")}</th>
                <th className="px-3 py-2.5 text-right font-normal">{t("secondaryMarket.orders.columnPrice")}</th>
                <th className="px-3 py-2.5 text-right font-normal">{t("secondaryMarket.orders.columnUnits")}</th>
                <th className="hidden px-3 py-2.5 text-right font-normal lg:table-cell">{t("secondaryMarket.orders.columnFilled")}</th>
                <th className="hidden px-3 py-2.5 text-right font-normal lg:table-cell">{t("secondaryMarket.orders.columnRemainder")}</th>
                <th className="px-3 py-2.5 text-right font-normal">{t("secondaryMarket.orders.columnAmount")}</th>
                <th className="px-3 py-2.5 font-normal">{t("secondaryMarket.orders.columnStatus")}</th>
                <th className="hidden px-3 py-2.5 font-normal xl:table-cell">{t("secondaryMarket.orders.columnCreated")}</th>
                <th className="px-3 py-2.5 text-right font-normal">{t("secondaryMarket.actions.actions")}</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[12px] text-zinc-300">
              {filtered.map((row) => {
                const remaining = orderRemainingUnits(row);
                const analyticsHref = secondaryMarketReleaseAnalyticsPath(row.releaseId);
                const listingHref = secondaryMarketListingInfoPath(row.listingId);
                const assetHref = releaseAssetHref(row.releaseId);
                const stackHref = bookHrefForOrder(row);
                const isTerminal =
                  row.status === "cancelled" || row.status === "expired" || row.status === "rejected";
                const showRepeat = isTerminal;

                return (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    onClick={() => {
                      setOrderActionMenuId(null);
                      setSelectedOrder(row);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOrderActionMenuId(null);
                        setSelectedOrder(row);
                      }
                    }}
                    className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/3 focus-visible:bg-white/4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B7F500]/25"
                  >
                    <td className="px-3 py-2.5 align-middle text-[11px] text-zinc-500">{row.id}</td>
                    <td className="px-3 py-2.5 align-middle">
                      <div className="flex items-center gap-2">
                        <CoverThumb symbol={row.symbol} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-white">{row.track}</p>
                          <p className="truncate text-[11px] text-zinc-600">
                            {row.artist} · {row.symbol}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          row.side === "buy" ? "text-[#B7F500]" : "text-fuchsia-300",
                        )}
                      >
                        {sideLabel(row.side, t)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle text-zinc-400">{modeLabel(row.mode, t)}</td>
                    <td className="px-3 py-2.5 text-right align-middle tabular-nums text-white">
                      {row.mode === "market" && row.pricePerUnit == null ? (
                        <span className="text-zinc-500">{t("secondaryMarket.orders.atMarket")}</span>
                      ) : row.pricePerUnit != null ? (
                        formatUsdt(row.pricePerUnit)
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right align-middle tabular-nums">{row.unitsTotal}</td>
                    <td className="hidden px-3 py-2.5 text-right align-middle tabular-nums text-zinc-400 lg:table-cell">
                      {row.unitsFilled}
                    </td>
                    <td className="hidden px-3 py-2.5 text-right align-middle tabular-nums text-zinc-500 lg:table-cell">
                      {remaining}
                    </td>
                    <td className="px-3 py-2.5 text-right align-middle tabular-nums text-zinc-200">
                      {row.orderValueUsdt > 0 ? `${formatUsdt(row.orderValueUsdt)} USDT` : "—"}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <span
                        title={
                          row.status === "rejected" && row.failureReason
                            ? t(row.failureReason)
                            : row.side === "buy"
                              ? t("secondaryMarket.orders.statusTooltipBuy")
                              : t("secondaryMarket.orders.statusTooltipSell")
                        }
                        className={cn(
                          "inline-flex cursor-help rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
                          statusPillClass(row.status),
                        )}
                      >
                        {orderStatusUiLabel(row.status, locale)}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2.5 align-middle text-[11px] text-zinc-600 xl:table-cell">
                      {row.createdAt}
                    </td>
                    <td className="px-3 py-2.5 text-right align-middle">
                      <div
                        className="relative flex flex-nowrap items-center justify-end gap-2.5"
                        ref={orderActionMenuId === row.id ? orderMenuRef : undefined}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className={smTableActionIconCircle}
                          aria-label={t("secondaryMarket.actions.orderDetails")}
                          onClick={() => {
                            setOrderActionMenuId(null);
                            setSelectedOrder(row);
                          }}
                        >
                          <LayoutPanelTop className="size-[17px]" strokeWidth={1.75} aria-hidden />
                        </button>
                        <Link href={assetHref} scroll={false} className={smTableActionReleasePill}>
                          {t("secondaryMarket.actions.release")}
                          <ExternalLink className="size-3.5 opacity-55" aria-hidden />
                        </Link>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            aria-expanded={orderActionMenuId === row.id}
                            aria-haspopup="menu"
                            aria-label={t("secondaryMarket.aria.moreActions")}
                            onClick={() => setOrderActionMenuId((id) => (id === row.id ? null : row.id))}
                            className={cn(
                              smTableActionIconCircle,
                              orderActionMenuId === row.id && smTableActionIconCirclePressed,
                            )}
                          >
                            <MoreHorizontal className="size-[17px]" strokeWidth={1.75} aria-hidden />
                          </button>
                          {orderActionMenuId === row.id ? (
                            <div role="menu" className={smTableActionMoreMenu}>
                              <button
                                type="button"
                                role="menuitem"
                                className={smTableActionMenuItem}
                                onClick={() => {
                                  setOrderActionMenuId(null);
                                  setSelectedOrder(row);
                                }}
                              >
                                {t("secondaryMarket.actions.details")}
                              </button>
                              {canCancelOrder(row) ? (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className={smTableActionMenuItemDestructive}
                                  onClick={() => {
                                    setOrderActionMenuId(null);
                                    setCancelTarget(row);
                                  }}
                                >
                                  {row.status === "partial" ? t("secondaryMarket.actions.cancelRemainder") : t("secondaryMarket.actions.cancel")}
                                </button>
                              ) : null}
                              {stackHref ? (
                                <Link
                                  role="menuitem"
                                  href={stackHref}
                                  scroll={false}
                                  className={smTableActionMenuItemLink}
                                  onClick={() => setOrderActionMenuId(null)}
                                >
                                  {t("secondaryMarket.actions.orderBook")}
                                </Link>
                              ) : (
                                <span className={smTableActionMenuItemMuted}>{t("secondaryMarket.actions.orderBookUnavailable")}</span>
                              )}
                              {showRepeat ? (
                                <Link
                                  role="menuitem"
                                  href={listingHref}
                                  scroll={false}
                                  className={smTableActionMenuItemAccent}
                                  onClick={() => setOrderActionMenuId(null)}
                                >
                                  {t("secondaryMarket.actions.repeatOrder")}
                                </Link>
                              ) : null}
                              <Link
                                role="menuitem"
                                href={analyticsHref}
                                scroll={false}
                                className={smTableActionMenuItemSecondary}
                                onClick={() => setOrderActionMenuId(null)}
                              >
                                {t("secondaryMarket.actions.tradingAnalytics")}
                              </Link>
                              <Link
                                role="menuitem"
                                href={listingHref}
                                scroll={false}
                                className={smTableActionMenuItemSecondary}
                                onClick={() => setOrderActionMenuId(null)}
                              >
                                {t("secondaryMarket.actions.listingInfo")}
                              </Link>
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
        </>
      )}

      <OrderCancelConfirmModal
        open={cancelTarget != null}
        onOpenChange={(next) => {
          if (!next) {
            const restore = pendingDetailRestoreOrderRef.current;
            pendingDetailRestoreOrderRef.current = null;
            setCancelTarget(null);
            if (restore) {
              setSelectedOrder(restore);
            }
          }
        }}
        variant={cancelModalVariant}
        side={cancelModalSide}
        onConfirm={handleCancelConfirm}
      />

      <Dialog.Root open={isBulkCancelOpen} onOpenChange={setIsBulkCancelOpen} modal>
        <Dialog.Portal>
          <Dialog.Backdrop
            className={cn(
              "fixed inset-0 z-120 bg-black/70 backdrop-blur-[2px]",
              "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
            )}
          />
          <Dialog.Popup
            className={cn(
              "fixed left-1/2 top-1/2 z-121 w-[min(100vw-2rem,560px)] -translate-x-1/2 -translate-y-1/2 p-6",
              ordersModalPopupClass,
            )}
          >
            <Dialog.Close
              aria-label={t("secondaryMarket.aria.close")}
              className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
            >
              <X className="size-4" />
            </Dialog.Close>
            <Dialog.Title className="pr-10 text-base font-semibold tracking-tight text-white">
              {t("secondaryMarket.forms.bulkCancelTitle")}
            </Dialog.Title>
            <Dialog.Description className="mt-3 space-y-2 text-[13px] leading-relaxed text-zinc-400">
              <p>
                {tm(t, "secondaryMarket.orders.bulkCancelDesc1", {
                  count: cancellableCount,
                  ordersWord:
                    cancellableCount === 1
                      ? t("secondaryMarket.orders.orderWordOne")
                      : t("secondaryMarket.orders.orderWordMany"),
                })}
              </p>
              <p className="text-zinc-500">{t("secondaryMarket.orders.bulkCancelDesc2")}</p>
            </Dialog.Description>
            <div className="mt-5 rounded-xl bg-white/[0.04] px-4 py-3.5">
              <p className="font-mono text-[11px] text-zinc-500">{t("secondaryMarket.orders.bulkCancelCountLabel")}</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-white">{cancellableCount}</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close className="h-10 rounded-full bg-white/10 px-5 font-mono text-[12px] font-medium text-zinc-200 transition hover:bg-white/14 hover:text-white">
                {t("secondaryMarket.forms.doNotCancel")}
              </Dialog.Close>
              <button
                type="button"
                onClick={() => void handleBulkCancel()}
                className="h-10 rounded-full bg-white px-5 font-mono text-[12px] font-semibold text-black transition hover:opacity-90"
              >
                {t("secondaryMarket.forms.confirmCancel")}
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={detailOrder != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setOrderActionMenuId(null);
          }
        }}
        modal
      >
        <Dialog.Portal>
          {detailOrder ? (
            <>
              <Dialog.Backdrop
                className={cn(
                  "fixed inset-0 z-[125] bg-black/70 backdrop-blur-[3px]",
                  "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
                )}
              />
              <Dialog.Popup
                className={cn(
                  "fixed left-1/2 top-1/2 z-[126] flex w-[min(100vw-2rem,720px)] max-h-[min(92vh,900px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto overscroll-contain",
                  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0",
                  ordersModalPopupClass,
                )}
              >
                <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-5">
                  <div className="min-w-0">
                    <Dialog.Title className="text-lg font-semibold tracking-tight text-white">
                      {detailOrder.track}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-zinc-500">
                      {detailOrder.artist} · {detailOrder.symbol}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close
                    aria-label={t("secondaryMarket.aria.close")}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="size-4" />
                  </Dialog.Close>
                </div>

                <div className="px-6 pb-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{t("secondaryMarket.orders.detailOrder")}</p>
                  <dl className="mt-3 space-y-0 font-mono text-[12px]">
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.orders.columnId")}</dt>
                      <dd className="tabular-nums text-zinc-200">{detailOrder.id}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.orders.columnSide")}</dt>
                      <dd className={detailOrder.side === "buy" ? "text-[#B7F500]" : "text-fuchsia-300"}>
                        {sideLabel(detailOrder.side, t)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.orders.columnType")}</dt>
                      <dd className="text-zinc-300">{modeLabel(detailOrder.mode, t)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.listingDetail.pricePerUnit")}</dt>
                      <dd className="text-right tabular-nums text-zinc-200">
                        {detailOrder.mode === "market" && detailOrder.pricePerUnit == null ? (
                          <span className="text-zinc-500">{t("secondaryMarket.orders.atMarket")}</span>
                        ) : detailOrder.pricePerUnit != null ? (
                          formatUsdt(detailOrder.pricePerUnit)
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.orders.detailVolume")}</dt>
                      <dd className="tabular-nums text-zinc-200">{detailOrder.unitsTotal}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.forms.filledUnits")}</dt>
                      <dd className="tabular-nums text-zinc-200">{detailOrder.unitsFilled}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.orders.columnRemainder")}</dt>
                      <dd className="tabular-nums text-zinc-200">{orderRemainingUnits(detailOrder)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.orders.columnAmount")}</dt>
                      <dd className="tabular-nums text-zinc-200">
                        {detailOrder.orderValueUsdt > 0 ? `${formatUsdt(detailOrder.orderValueUsdt)} USDT` : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.orders.columnCreated")}</dt>
                      <dd className="text-right text-zinc-400">{detailOrder.createdAt}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-white/[0.05] py-2">
                      <dt className="text-zinc-600">{t("secondaryMarket.orders.detailUpdated")}</dt>
                      <dd className="text-right text-zinc-400">{detailOrder.updatedAt}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 rounded-xl bg-white/[0.03] px-4 py-3">
                    <p className="text-[11px] leading-relaxed text-zinc-500">{executionSourceLabel(detailOrder, t)}</p>
                    {detailOrder.failureReason ? (
                      <p className="mt-2 text-[11px] leading-relaxed text-fuchsia-200/80">{t(detailOrder.failureReason)}</p>
                    ) : null}
                  </div>
                  <div className="mt-2.5 rounded-xl bg-white/[0.03] px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">{t("secondaryMarket.orders.detailLockedNow")}</p>
                    <p className="mt-1 text-[12px] text-zinc-300">{lockedHint(detailOrder, t)}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">{returnOnCancelHint(detailOrder, t)}</p>
                  </div>
                </div>

                <div className="shrink-0 space-y-3 bg-black/20 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                    <Link
                      href={releaseAssetHref(detailOrder.releaseId)}
                      scroll={false}
                      className={cn(smTableActionReleasePill, "h-10 px-5")}
                    >
                      {t("secondaryMarket.actions.release")}
                      <ExternalLink className="size-3.5 opacity-55" aria-hidden />
                    </Link>
                    {bookHrefForOrder(detailOrder) ? (
                      <Link
                        href={bookHrefForOrder(detailOrder)!}
                        scroll={false}
                        className="inline-flex h-10 items-center justify-center rounded-full bg-white/10 px-5 font-mono text-[12px] font-medium text-zinc-200 transition hover:bg-white/14"
                      >
                        {t("secondaryMarket.actions.orderBook")}
                      </Link>
                    ) : null}
                  </div>
                  {canCancelOrder(detailOrder) ? (
                    <button
                      type="button"
                      onClick={() => {
                        pendingDetailRestoreOrderRef.current = detailOrder;
                        setCancelTarget(detailOrder);
                        setSelectedOrder(null);
                      }}
                      className="w-full rounded-full bg-fuchsia-500/20 py-2.5 font-mono text-[12px] font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/28"
                    >
                      {detailOrder.status === "partial" ? t("secondaryMarket.actions.cancelRemainder") : t("secondaryMarket.forms.cancelOrder")}
                    </button>
                  ) : null}
                  {!bookHrefForOrder(detailOrder) ? (
                    <p className="text-center font-mono text-[10px] text-zinc-600">{t("secondaryMarket.orders.bookUnavailableMock")}</p>
                  ) : null}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <Link
                      href={secondaryMarketReleaseAnalyticsPath(detailOrder.releaseId)}
                      scroll={false}
                      className="font-mono text-[11px] text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
                    >
                      {t("secondaryMarket.actions.secondaryAnalytics")}
                    </Link>
                    <Link
                      href={secondaryMarketListingInfoPath(detailOrder.listingId)}
                      scroll={false}
                      className="font-mono text-[11px] text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
                    >
                      {t("secondaryMarket.actions.listingInfoLong")}
                    </Link>
                  </div>
                </div>
              </Dialog.Popup>
            </>
          ) : null}
        </Dialog.Portal>
      </Dialog.Root>

      {toastMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-6 left-1/2 z-130 max-w-[min(100vw-2rem,28rem)] -translate-x-1/2 px-4"
        >
          <div className="rounded-xl bg-zinc-950/95 px-4 py-3 font-mono text-[12px] leading-snug text-zinc-100 shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/10">
            {toastMessage}
          </div>
        </div>
      ) : null}
    </div>
  );
}
