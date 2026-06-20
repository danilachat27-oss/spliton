"use client";

import * as React from "react";
import { RotateCcw } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { SecondaryMarketResponsiveSheet } from "@/components/dashboard/secondary-market/secondary-market-responsive-sheet";
import { smExchange } from "@/components/dashboard/secondary-market/secondary-market-exchange-styles";
import {
  DEFAULT_MARKET_TAB_FILTERS,
  type MarketTabFiltersState,
} from "@/lib/secondary-market/market-tab-filters";
import { MARKET_LISTING_STATUS_FILTERS, MARKET_LISTING_SORT_KEYS } from "@/lib/secondary-market/market-listings-query";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: MarketTabFiltersState;
  onChange: (patch: Partial<MarketTabFiltersState>) => void;
  onReset: () => void;
  resultCount: number;
};

export function SecondaryMarketMarketFiltersSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  onReset,
  resultCount,
}: Props) {
  const { t } = useI18n();

  return (
    <SecondaryMarketResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("secondaryMarket.filters.sheetTitle")}
      description={
        <>
          {t("secondaryMarket.filters.sheetDesc")}{" "}
          <span className="font-mono text-zinc-400">{resultCount}</span>
        </>
      }
      footer={
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={onReset}
            className={cn(smExchange.chipBase, smExchange.chipIdle, "flex-1 justify-center py-2.5")}
          >
            <RotateCcw className="mr-1.5 size-3.5" aria-hidden />
            {t("secondaryMarket.filters.resetFilters")}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(smExchange.chipBase, smExchange.chipActive, "flex-1 justify-center py-2.5")}
          >
            {t("secondaryMarket.filters.apply")}
          </button>
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        <section>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {t("secondaryMarket.filters.status")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MARKET_LISTING_STATUS_FILTERS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ status: id })}
                className={cn(
                  smExchange.chipBase,
                  filters.status === id ? smExchange.chipActive : smExchange.chipIdle,
                )}
              >
                {t(`secondaryMarket.filters.listingStatus.${id}`)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {t("secondaryMarket.filters.sort")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {MARKET_LISTING_SORT_KEYS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ sort: id })}
                className={cn(
                  smExchange.chipBase,
                  filters.sort === id ? smExchange.chipActive : smExchange.chipIdle,
                )}
              >
                {t(`secondaryMarket.filters.listingSort.${id}`)}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {t("secondaryMarket.filters.priceMin")}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.priceMin}
              onChange={(e) => onChange({ priceMin: e.target.value })}
              className={smExchange.inputPill}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {t("secondaryMarket.filters.priceMax")}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.priceMax}
              onChange={(e) => onChange({ priceMax: e.target.value })}
              className={smExchange.inputPill}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {t("secondaryMarket.filters.yieldMin")}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.yieldMin}
              onChange={(e) => onChange({ yieldMin: e.target.value })}
              className={smExchange.inputPill}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {t("secondaryMarket.filters.yieldMax")}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.yieldMax}
              onChange={(e) => onChange({ yieldMax: e.target.value })}
              className={smExchange.inputPill}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {t("secondaryMarket.filters.unitsMin")}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.unitsMin}
              onChange={(e) => onChange({ unitsMin: e.target.value })}
              className={smExchange.inputPill}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {t("secondaryMarket.filters.unitsMax")}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={filters.unitsMax}
              onChange={(e) => onChange({ unitsMax: e.target.value })}
              className={smExchange.inputPill}
            />
          </label>
        </section>
      </div>
    </SecondaryMarketResponsiveSheet>
  );
}
