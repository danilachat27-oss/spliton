"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, RotateCcw } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { SecondaryMarketResponsiveSheet } from "@/components/dashboard/secondary-market/secondary-market-responsive-sheet";
import { smExchange } from "@/components/dashboard/secondary-market/secondary-market-exchange-styles";
import {
  DEFAULT_WATCHLIST_FILTERS,
  type WatchlistFiltersState,
} from "@/components/dashboard/secondary-market/secondary-market-watchlist.types";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(smExchange.chipBase, active ? smExchange.chipActive : smExchange.chipIdle)}
    >
      {label}
    </button>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: WatchlistFiltersState;
  onChange: (patch: Partial<WatchlistFiltersState>) => void;
  onReset: () => void;
  resultCount: number;
  totalCount: number;
};

export function SecondaryMarketWatchlistFiltersSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  onReset,
  resultCount,
  totalCount,
}: Props) {
  const { t } = useI18n();

  const segmentOptions = React.useMemo(
    (): { id: WatchlistFiltersState["segment"]; label: string }[] => [
      { id: "all", label: t("secondaryMarket.filters.all") },
      { id: "liquid", label: t("secondaryMarket.filters.liquid") },
      { id: "active", label: t("secondaryMarket.filters.active24h") },
    ],
    [t],
  );

  const sortOptions = React.useMemo(
    (): { id: WatchlistFiltersState["sort"]; label: string }[] => [
      { id: "activity", label: t("secondaryMarket.filters.sortByActivity") },
      { id: "change", label: t("secondaryMarket.filters.sortByChange24h") },
      { id: "price", label: t("secondaryMarket.filters.sortByPrice") },
      { id: "name", label: t("secondaryMarket.filters.sortByName") },
    ],
    [t],
  );

  const liquidityOptions = React.useMemo(
    (): { id: WatchlistFiltersState["liquidity"]; label: string }[] => [
      { id: "all", label: t("secondaryMarket.filters.liquidityAny") },
      { id: "high", label: t("secondaryMarket.kpi.liquidity.high") },
      { id: "med", label: t("secondaryMarket.kpi.liquidity.med") },
      { id: "low", label: t("secondaryMarket.kpi.liquidity.low") },
    ],
    [t],
  );

  return (
    <SecondaryMarketResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("secondaryMarket.watchlist.filtersTitle")}
      description={tf(t("secondaryMarket.watchlist.shownOfReleases"), {
        shown: String(resultCount),
        total: String(totalCount),
      })}
      footer={
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className={smExchange.submitBuy}>
            {tf(t("secondaryMarket.watchlist.showReleasesCount"), { count: String(resultCount) })}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white/10 font-mono text-[12px] font-medium text-zinc-300 transition hover:bg-white/14 hover:text-white"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {t("secondaryMarket.filters.resetFilters")}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <section>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            {t("secondaryMarket.filters.searchPlaceholder")}
          </p>
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder={t("secondaryMarket.watchlist.searchFieldPlaceholder")}
            className={cn(smExchange.input, "mt-2")}
          />
        </section>

        <section>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            {t("secondaryMarket.filters.segment")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {segmentOptions.map((opt) => (
              <FilterChip
                key={opt.id}
                active={filters.segment === opt.id}
                label={opt.label}
                onClick={() => onChange({ segment: opt.id })}
              />
            ))}
          </div>
        </section>

        <section>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            {t("secondaryMarket.analytics.liquidity")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {liquidityOptions.map((opt) => (
              <FilterChip
                key={opt.id}
                active={filters.liquidity === opt.id}
                label={opt.label}
                onClick={() => onChange({ liquidity: opt.id })}
              />
            ))}
          </div>
        </section>

        <section>
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            {t("secondaryMarket.filters.sort")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sortOptions.map((opt) => (
              <FilterChip
                key={opt.id}
                active={filters.sort === opt.id}
                label={opt.label}
                onClick={() => onChange({ sort: opt.id })}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange({ sortDir: filters.sortDir === "desc" ? "asc" : "desc" })}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#111111] px-3 py-1.5 font-mono text-[11px] text-zinc-400 ring-1 ring-white/8 transition hover:text-zinc-200"
          >
            {filters.sortDir === "desc" ? (
              <>
                <ArrowDown className="size-3.5" aria-hidden />
                {t("secondaryMarket.filters.sortDescending")}
              </>
            ) : (
              <>
                <ArrowUp className="size-3.5" aria-hidden />
                {t("secondaryMarket.filters.sortAscending")}
              </>
            )}
          </button>
        </section>
      </div>
    </SecondaryMarketResponsiveSheet>
  );
}

export function countActiveWatchlistFilters(filters: WatchlistFiltersState): number {
  let n = 0;
  if (filters.segment !== DEFAULT_WATCHLIST_FILTERS.segment) n += 1;
  if (filters.liquidity !== DEFAULT_WATCHLIST_FILTERS.liquidity) n += 1;
  if (filters.sort !== DEFAULT_WATCHLIST_FILTERS.sort || filters.sortDir !== DEFAULT_WATCHLIST_FILTERS.sortDir) {
    n += 1;
  }
  if (filters.query.trim()) n += 1;
  return n;
}

const LIQUIDITY_SUMMARY_KEYS: Record<WatchlistFiltersState["liquidity"], string | null> = {
  all: null,
  high: "secondaryMarket.kpi.liquidity.high",
  med: "secondaryMarket.kpi.liquidity.med",
  low: "secondaryMarket.kpi.liquidity.low",
};

export function watchlistFiltersSummary(filters: WatchlistFiltersState, t: (key: string) => string): string {
  const parts: string[] = [];
  if (filters.segment === "liquid") parts.push(t("secondaryMarket.filters.liquid"));
  if (filters.segment === "active") parts.push(t("secondaryMarket.filters.active24h"));
  if (filters.liquidity !== "all") {
    const key = LIQUIDITY_SUMMARY_KEYS[filters.liquidity];
    if (key) parts.push(t(key));
  }
  if (filters.query.trim()) parts.push(t("secondaryMarket.filters.searchPlaceholder"));
  return parts.length ? parts.join(" · ") : t("secondaryMarket.watchlist.allReleases");
}
