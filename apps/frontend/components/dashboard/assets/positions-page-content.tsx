"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/lib/lucide";

import { positionPreviews } from "@/components/dashboard/assets/assets-mock-data";
import {
  assetsCardClass,
  assetsOutlineButtonClass,
  assetsPrimaryButtonClass,
} from "@/components/dashboard/assets/assets-ui";
import { PositionsHeaderBar } from "@/components/dashboard/assets/positions-header-bar";
import { PositionsTableCard } from "@/components/dashboard/assets/positions-table-card";
import { useAssetsPositionsPage } from "@/hooks/use-assets-positions-page";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function PositionsPageContent() {
  const { t } = useI18n();
  const {
    live,
    filters,
    updateFilters,
    setPage,
    resetFilters,
    rows,
    total,
    page,
    pageSize,
    genreOptions,
    loading,
    error,
    hasActiveFilters,
    reload,
  } = useAssetsPositionsPage();

  const displayRows = live ? (rows ?? []) : positionPreviews;
  const isInitialLoad = live && loading && rows === null;
  const isEmpty = !isInitialLoad && displayRows.length === 0 && !hasActiveFilters;
  const isFilteredEmpty = !isInitialLoad && displayRows.length === 0 && hasActiveFilters;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (live && error && rows === null) {
    return (
      <ReadOnlySectionError
        sectionId="assets-positions"
        error={error}
        onRetry={() => void reload()}
        retryLabel={t("positions.retry")}
      />
    );
  }

  if (isEmpty) {
    return (
      <section className={cn(assetsCardClass, "py-14 text-center")}>
        <p className="text-lg font-semibold text-neutral-900">{t("positions.emptyTitle")}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{t("positions.emptyBody")}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href={ROUTES.dashboardCatalog} className={assetsPrimaryButtonClass}>
            {t("positions.openCatalog")}
          </Link>
          <Link href={ROUTES.dashboardOverview} className={assetsOutlineButtonClass}>
            {t("positions.goOverview")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {live && error && rows !== null ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <PositionsHeaderBar
        query={filters.q}
        onQuery={(q) => updateFilters({ q })}
        status={filters.status}
        onStatus={(status) => updateFilters({ status })}
        genre={filters.genre}
        onGenre={(genre) => updateFilters({ genre })}
        genreOptions={genreOptions}
        sort={filters.sort}
        onSort={(sort) => updateFilters({ sort: sort as typeof filters.sort })}
        disabled={live && loading}
      />

      {isInitialLoad ? (
        <section className={assetsCardClass}>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-neutral-100" />
            ))}
          </div>
        </section>
      ) : isFilteredEmpty ? (
        <section className={cn(assetsCardClass, "py-12 text-center")}>
          <p className="text-base font-semibold text-neutral-900">{t("positions.filteredEmptyTitle")}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{t("positions.filteredEmptyBody")}</p>
          <button
            type="button"
            onClick={resetFilters}
            className={cn(assetsOutlineButtonClass, "mt-6")}
          >
            {t("positions.resetFilters")}
          </button>
        </section>
      ) : (
        <>
          <PositionsTableCard rows={displayRows} loading={isInitialLoad} live={live} compact />

          {live && total > pageSize ? (
            <nav
              className="flex flex-wrap items-center justify-between gap-3 px-1"
              aria-label={t("positions.paginationLabel")}
            >
              <p className="text-xs text-neutral-500">
                {t("positions.paginationSummary")
                  .replace("{page}", String(page))
                  .replace("{totalPages}", String(totalPages))
                  .replace("{total}", String(total))}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(page - 1)}
                  className={cn(assetsOutlineButtonClass, "h-9 disabled:cursor-not-allowed disabled:opacity-50")}
                >
                  <ChevronLeft className="size-3.5" />
                  {t("positions.paginationPrev")}
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(page + 1)}
                  className={cn(assetsOutlineButtonClass, "h-9 disabled:cursor-not-allowed disabled:opacity-50")}
                >
                  {t("positions.paginationNext")}
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
