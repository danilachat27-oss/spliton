"use client";

import { LayoutGrid, List, SlidersHorizontal } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { tf } from "@/lib/i18n/financial-messages";
import type { CatalogGridView } from "@/types/catalog/page";

import { cn } from "@/lib/utils";

import { CatalogViewIconButton } from "../ui/catalog-view-icon-button";

export function CatalogMainSubheader({
  view,
  onViewChange,
  resultCount,
  totalCount,
  onOpenFilters,
  activeFiltersCount = 0,
  compact = false,
}: {
  view: CatalogGridView;
  onViewChange: (v: CatalogGridView) => void;
  resultCount: number;
  totalCount: number;
  onOpenFilters?: () => void;
  activeFiltersCount?: number;
  compact?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div className={cn("flex flex-col gap-3 font-mono text-[13px] tabular-nums tracking-tight", compact && "gap-2")}>
      {!compact ? (
        <h2 className="font-sans text-lg font-semibold tracking-tight text-white sm:text-xl">
          {t("catalog.main.resultsTitle")}
        </h2>
      ) : null}
      <div className="flex items-center gap-2">
        <div className="inline-flex h-8 shrink-0 items-center rounded-full bg-[#1a1a1a] px-3.5 font-sans text-[12px] font-medium text-zinc-300">
          {tf(t("catalog.main.positionsCount"), {
            result: String(resultCount),
            total: String(totalCount),
          })}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="inline-flex items-center gap-0.5 rounded-full bg-white/[0.06] p-0.5">
            <CatalogViewIconButton
              icon={LayoutGrid}
              label={t("catalog.view.grid")}
              active={view === "grid"}
              onClick={() => onViewChange("grid")}
            />
            <CatalogViewIconButton
              icon={List}
              label={t("catalog.view.list")}
              active={view === "list"}
              onClick={() => onViewChange("list")}
            />
          </div>
          {onOpenFilters ? (
            <button
              type="button"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 font-sans text-[12px] font-medium text-zinc-100 transition hover:bg-white/12 lg:hidden"
              onClick={onOpenFilters}
              data-testid="catalog-mobile-filters-button"
            >
              <SlidersHorizontal className="size-3.5" strokeWidth={2} />
              {t("catalog.filters.mobileButton")}
              {activeFiltersCount > 0 ? (
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none text-black">
                  {activeFiltersCount}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
