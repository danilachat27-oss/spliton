"use client";

import { useMemo, useState } from "react";

import type { CatalogItem } from "@/lib/catalog-mock";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";
import type { CatalogGridView, CatalogPagination, CatalogStats } from "@/types/catalog/page";
import type { CatalogKindFilter } from "@/types/catalog/page";

import { useI18n } from "@/components/providers/i18n-provider";
import { CatalogTrackCard } from "@/components/dashboard/catalog-track-card";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";

import { CatalogMainSubheader } from "./catalog-main-subheader";
import { CatalogMarketsToolbar } from "./catalog-markets-toolbar";
import { CatalogPageHero } from "./catalog-page-hero";
import { CatalogActiveFilterChips } from "../ui/catalog-active-filter-chips";
import { CatalogEmptyState } from "../ui/catalog-empty-state";
import { CatalogCardsSkeleton } from "../ui/catalog-skeleton";
import {
  CatalogMarketInstrumentRow,
  catalogItemHref,
} from "../ui/catalog-market-instrument-row";
import type { CatalogActiveFilter } from "../hooks/use-catalog-active-filters";

export function CatalogMainArea({
  catalogView,
  onCatalogView,
  filtered,
  resultCount,
  totalCount,
  pagination,
  page,
  onPageChange,
  catalogLoading,
  catalogError,
  liveMode,
  stats,
  statsUnavailable = false,
  onReloadCatalog,
  hasActiveFilters,
  onResetFilters,
  onOpenFilters,
  activeFiltersCount,
  activeFilters = [],
  kind,
  onKind,
  genre,
  onGenre,
  onFocusSearch,
}: {
  catalogView: CatalogGridView;
  onCatalogView: (v: CatalogGridView) => void;
  filtered: CatalogItem[];
  resultCount: number;
  totalCount: number;
  pagination: CatalogPagination | null;
  page: number;
  onPageChange: (page: number) => void;
  catalogLoading?: boolean;
  catalogError?: unknown;
  liveMode?: boolean;
  stats?: CatalogStats | null;
  statsUnavailable?: boolean;
  onReloadCatalog?: () => void;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  onOpenFilters?: () => void;
  activeFiltersCount?: number;
  activeFilters?: CatalogActiveFilter[];
  kind: CatalogKindFilter;
  onKind: (k: CatalogKindFilter) => void;
  genre: string;
  onGenre: (g: string) => void;
  onFocusSearch?: () => void;
}) {
  const { t } = useI18n();
  const isList = catalogView === "list";
  const totalPages = pagination?.totalPages ?? 1;
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  const catalogCardGrid = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((item) => (
        <CatalogTrackCard key={item.id} item={item} variant="card" size="large" />
      ))}
    </div>
  );

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sortedForList = useMemo(() => filtered, [filtered]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-black",
      )}
      aria-label={t("catalog.main.ariaLabel")}
    >
      <div className="shrink-0 border-b border-white/[0.06] bg-black px-4 sm:px-5 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <CatalogMarketsToolbar
            kind={kind}
            onKind={onKind}
            genre={genre}
            onGenre={onGenre}
            onOpenSearch={onFocusSearch}
            onOpenFilters={onOpenFilters}
            activeFiltersCount={activeFiltersCount}
          />
          {isList ? (
            <>
              <div className="hidden items-center justify-between py-2.5 text-[11px] text-zinc-500 lg:flex">
                <span>{t("catalog.markets.colName")}</span>
                <span>{t("catalog.markets.colPrice")}</span>
              </div>
              <div className="py-3 lg:hidden">
                <CatalogMainSubheader
                  view={catalogView}
                  onViewChange={onCatalogView}
                  resultCount={resultCount}
                  totalCount={totalCount}
                  onOpenFilters={onOpenFilters}
                  activeFiltersCount={activeFiltersCount}
                  compact
                />
              </div>
            </>
          ) : (
            <div className="py-3">
              <CatalogMainSubheader
                view={catalogView}
                onViewChange={onCatalogView}
                resultCount={resultCount}
                totalCount={totalCount}
                onOpenFilters={onOpenFilters}
                activeFiltersCount={activeFiltersCount}
                compact
              />
            </div>
          )}
          {activeFilters.length > 0 ? (
            <div className="pb-3 lg:hidden">
              <CatalogActiveFilterChips filters={activeFilters} onReset={onResetFilters} compact />
            </div>
          ) : null}
        </div>
      </div>

      <main
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain bg-black",
          "touch-pan-y",
        )}
        data-mobile-scroll-root
      >
      <CatalogPageHero stats={liveMode ? (stats ?? null) : null} statsUnavailable={liveMode ? statsUnavailable : false} />

      <div className="mx-auto max-w-[1600px] px-4 pb-12 sm:px-5 lg:px-8 lg:pb-16">
        {catalogError ? (
          <div className="mb-4">
            <ReadOnlySectionError
              sectionId="catalog-main"
              error={catalogError}
              onRetry={onReloadCatalog}
              retryLabel={t("common.retry")}
              variant="dark"
            />
          </div>
        ) : null}

        {catalogLoading ? (
          <>
            <div className={cn(isList && "hidden lg:block")}>
              <CatalogCardsSkeleton count={8} variant={isList ? "list" : "grid"} />
            </div>
            {isList ? (
              <div className="lg:hidden">
                <CatalogCardsSkeleton count={6} variant="grid" />
              </div>
            ) : null}
          </>
        ) : filtered.length === 0 ? (
          <CatalogEmptyState
            title={hasActiveFilters ? t("catalog.empty.filteredTitle") : t("catalog.empty.noItemsTitle")}
            hint={hasActiveFilters ? t("catalog.empty.filteredHint") : t("catalog.empty.noItemsHint")}
            action={
              hasActiveFilters && onResetFilters ? (
                <button
                  type="button"
                  className="rounded-full bg-[#B7F500] px-5 py-2 text-[13px] font-semibold text-black"
                  onClick={onResetFilters}
                >
                  {t("catalog.actions.resetFilters")}
                </button>
              ) : null
            }
          />
        ) : isList ? (
          <>
            <div className="hidden lg:block">
              <div className="flex items-center justify-end gap-2 pb-2">
                <CatalogMainSubheader
                  view={catalogView}
                  onViewChange={onCatalogView}
                  resultCount={resultCount}
                  totalCount={totalCount}
                  compact
                />
              </div>
              <div>
                {sortedForList.map((item) => (
                  <CatalogMarketInstrumentRow
                    key={item.id}
                    item={item}
                    href={catalogItemHref(item)}
                    isFavorite={favorites.has(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                  />
                ))}
              </div>
            </div>
            <div className="lg:hidden">
              <p className="mb-4 text-xs text-zinc-500">
                {tf(t("catalog.main.shownCount"), {
                  shown: String(resultCount),
                  total: String(totalCount),
                })}
              </p>
              {catalogCardGrid}
            </div>
            {liveMode && totalPages > 1 ? (
              <PaginationBlock page={page} totalPages={totalPages} onPageChange={onPageChange} t={t} />
            ) : null}
          </>
        ) : (
          <>
            <p className="mb-4 text-xs text-zinc-500">
              {tf(t("catalog.main.shownCount"), {
                shown: String(resultCount),
                total: String(totalCount),
              })}
            </p>
            {catalogCardGrid}
            {liveMode && totalPages > 1 ? (
              <PaginationBlock page={page} totalPages={totalPages} onPageChange={onPageChange} t={t} />
            ) : null}
          </>
        )}
      </div>
      </main>
    </div>
  );
}

function PaginationBlock({
  page,
  totalPages,
  onPageChange,
  t,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <PaginationButton disabled={page <= 1} onClick={() => onPageChange(page - 1)} label={t("catalog.pagination.prev")} />
      <span className="px-3 text-sm text-zinc-400">
        {tf(t("catalog.pagination.page"), { page: String(page), total: String(totalPages) })}
      </span>
      <PaginationButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} label={t("catalog.pagination.next")} />
    </div>
  );
}

function PaginationButton({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-10 rounded-full px-4 text-[12px] font-semibold transition",
        disabled ? "cursor-not-allowed bg-white/5 text-zinc-600" : "bg-white/10 text-zinc-100 hover:bg-white/14",
      )}
    >
      {label}
    </button>
  );
}
