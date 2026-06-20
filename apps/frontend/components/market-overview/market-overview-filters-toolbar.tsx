"use client";

import Link from "next/link";
import { Search } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { ROUTES } from "@/constants/routes";
import type { MarketOverviewFilters as MarketOverviewFilterState } from "@/hooks/use-market-overview-state";
import { cn } from "@/lib/utils";
import type { MarketOverviewCategory } from "@/types/market-overview";

import { MarketOverviewFilters } from "./market-overview-filters";
import { MarketOverviewTabs } from "./market-overview-tabs";

export function MarketOverviewFiltersToolbar({
  categoryTab,
  onCategoryTab,
  filters,
  onFilterChange,
  search,
  onSearchChange,
}: {
  categoryTab: MarketOverviewCategory;
  onCategoryTab: (v: MarketOverviewCategory) => void;
  filters: MarketOverviewFilterState;
  onFilterChange: (id: keyof MarketOverviewFilterState, value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="sticky top-0 z-60 shrink-0 border-b border-white/8 bg-black/90 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[1400px] space-y-2.5 px-4 py-3 md:space-y-3 md:px-6 md:py-3.5 lg:px-8">
        <MarketOverviewTabs value={categoryTab} onChange={onCategoryTab} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-2.5">
            <label className="relative block max-w-md">
              <span className="sr-only">{t("marketOverview.toolbar.searchSr")}</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t("marketOverview.toolbar.searchPlaceholder")}
                className={cn(
                  "w-full rounded-xl border border-white/8 bg-white/4 py-2.5 pl-10 pr-3",
                  "text-[13px] text-zinc-100 placeholder:text-zinc-600",
                  "outline-none focus-visible:border-[#B7F500]/40 focus-visible:ring-2 focus-visible:ring-[#B7F500]/20",
                )}
              />
            </label>
            <MarketOverviewFilters filters={filters} onChange={onFilterChange} />
          </div>
          <Link
            href={ROUTES.dashboardCatalog}
            title={t("marketOverview.toolbar.catalogTitle")}
            className="inline-flex w-full shrink-0 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 sm:w-auto"
          >
            {t("marketOverview.toolbar.buyRelease")}
          </Link>
        </div>
      </div>
    </div>
  );
}
