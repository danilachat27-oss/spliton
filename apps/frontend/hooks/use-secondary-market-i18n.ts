"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { statusLabel } from "@/lib/i18n/status-labels";
import type { SecondaryMarketTabId } from "@/constants/dashboard/secondary-market";

export function useSecondaryMarketTabs() {
  const { t } = useI18n();
  return useMemo(
    (): { id: SecondaryMarketTabId; label: string }[] => [
      { id: "market", label: t("secondaryMarket.tabs.market") },
      { id: "analytics", label: t("secondaryMarket.tabs.analytics") },
      { id: "orders", label: t("secondaryMarket.tabs.orders") },
      { id: "history", label: t("secondaryMarket.tabs.history") },
      { id: "watchlist", label: t("secondaryMarket.tabs.watchlist") },
      { id: "rules", label: t("secondaryMarket.tabs.rules") },
    ],
    [t],
  );
}

export function useSecondaryMarketTabMeta(tab: SecondaryMarketTabId) {
  const { t } = useI18n();
  return useMemo(
    () => ({
      documentTitle: t(`meta.secondaryMarket.documentTitle.${tab}`),
      zoneLabel: t(`meta.secondaryMarket.zone.${tab === "market" || tab === "analytics" ? "trading" : tab === "orders" ? "operations" : tab === "history" ? "ledger" : tab === "watchlist" ? "research" : "reference"}`),
      surfaceTitle: t(`meta.secondaryMarket.surface.${tab}.title`),
      surfaceSubtitle: t(`meta.secondaryMarket.surface.${tab}.subtitle`),
    }),
    [t, tab],
  );
}

const ZONE_BY_TAB: Record<SecondaryMarketTabId, string> = {
  market: "trading",
  analytics: "trading",
  orders: "operations",
  history: "ledger",
  watchlist: "research",
  rules: "reference",
};

export function useSecondaryMarketPageMeta(tab: SecondaryMarketTabId) {
  const { t } = useI18n();
  const zone = ZONE_BY_TAB[tab];
  return useMemo(
    () => ({
      documentTitle: t(`meta.secondaryMarket.documentTitle.${tab}`),
      zone,
      zoneLabel: t(`meta.secondaryMarket.zone.${zone}`),
      surfaceTitle: t(`meta.secondaryMarket.surface.${tab}.title`),
      surfaceSubtitle: t(`meta.secondaryMarket.surface.${tab}.subtitle`),
    }),
    [t, tab, zone],
  );
}

export function useSecondaryMarketSideLabel(side: "buy" | "sell") {
  const { t } = useI18n();
  return side === "buy" ? t("secondaryMarket.side.buy") : t("secondaryMarket.side.sell");
}

export function useSecondaryMarketOrderStatusLabel(
  status: string,
  opts?: { feminine?: boolean },
) {
  const { t, locale } = useI18n();
  const key = `statuses.order.${status}${opts?.feminine ? "Fem" : ""}`;
  const direct = t(key);
  if (direct !== key) return direct;
  return statusLabel("order", status, locale);
}

export function useSecondaryMarketTradeStatusLabel(status: string) {
  const { t, locale } = useI18n();
  const key = `statuses.trade.${status}`;
  const direct = t(key);
  if (direct !== key) return direct;
  return statusLabel("trade", status, locale);
}

export function useSecondaryMarketOrderTypeLabel(mode: "limit" | "market") {
  const { t } = useI18n();
  return mode === "limit" ? t("statuses.order.limit") : t("statuses.order.market");
}

export function useSecondaryMarketLiquidityLabel(level: "high" | "med" | "low", short = false) {
  const { t } = useI18n();
  if (short) {
    return t(`secondaryMarket.kpi.liquidity.${level}Short`);
  }
  return t(`secondaryMarket.kpi.liquidity.${level}`);
}
