"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/lib/lucide";

import {
  ActivityFiltersBar,
} from "@/components/dashboard/assets/activity-filters-bar";
import { activityRecords } from "@/components/dashboard/assets/activity-mock-data";
import { ActivityTableCard } from "@/components/dashboard/assets/activity-table-card";
import {
  assetsCardClass,
  assetsOutlineButtonClass,
  assetsPrimaryButtonClass,
} from "@/components/dashboard/assets/assets-ui";
import { useAssetsActivityPage } from "@/hooks/use-assets-activity-page";
import { useI18n } from "@/components/providers/i18n-provider";
import { ReadOnlySectionError } from "@/components/shared/data-states/read-only-section-error";
import { ProductDemoBanner } from "@/components/shared/product-demo-banner";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function ActivityPageContent() {
  const { t } = useI18n();
  const {
    live,
    filters,
    updateFilters,
    setPage,
    records,
    total,
    page,
    pageSize,
    hasMore,
    releaseOptions,
    loading,
    error,
    hasActiveFilters,
    reload,
  } = useAssetsActivityPage();

  const rows = live ? (records ?? []) : activityRecords;
  const isInitialLoad = live && loading && records === null;
  const isEmpty = !isInitialLoad && rows.length === 0;
  const tableState: "default" | "empty" | "loading" = isInitialLoad
    ? "loading"
    : isEmpty
      ? "empty"
      : "default";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (live && error && records === null) {
    return (
      <ReadOnlySectionError
        sectionId="assets-activity"
        error={error}
        onRetry={() => void reload()}
        retryLabel={t("activity.retry")}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {!live ? <ProductDemoBanner messageKey="activity.demoBanner" /> : null}
      {live && error && records !== null ? (
        <ReadOnlySectionError
          sectionId="assets-activity-partial"
          error={error}
          onRetry={() => void reload()}
          retryLabel={t("activity.retry")}
          compact
        />
      ) : null}

      <ActivityFiltersBar
        activeTab={filters.tab}
        onTabChange={(tab) => updateFilters({ tab })}
        period={filters.period}
        onPeriodChange={(period) =>
          updateFilters({ period: period as typeof filters.period })
        }
        release={filters.releaseId}
        onReleaseChange={(releaseId) => updateFilters({ releaseId })}
        releaseOptions={releaseOptions}
        status={filters.status}
        onStatusChange={(status) => updateFilters({ status })}
        direction={filters.direction}
        onDirectionChange={(direction) =>
          updateFilters({ direction: direction as typeof filters.direction })
        }
        sort={filters.sort}
        onSortChange={(sort) => updateFilters({ sort: sort as typeof filters.sort })}
        query={filters.q}
        onQueryChange={(q) => updateFilters({ q })}
        disabled={live && loading}
      />

      {tableState === "empty" ? (
        <section className={cn(assetsCardClass, "py-14 text-center")}>
          <p className="text-base font-semibold text-neutral-900">
            {hasActiveFilters && live ? t("activity.filteredEmptyTitle") : t("activity.emptyTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
            {hasActiveFilters && live ? t("activity.filteredEmptyBody") : t("activity.emptyBody")}
          </p>
          {!hasActiveFilters ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link href={ROUTES.dashboardCatalog} className={assetsPrimaryButtonClass}>
                {t("activity.openCatalog")}
              </Link>
              <Link href={`${ROUTES.dashboardPayouts}/deposit`} className={assetsOutlineButtonClass}>
                {t("activity.depositUsdt")}
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <ActivityTableCard rows={rows} state={tableState} compact />

          {live && total > pageSize ? (
            <nav
              className="flex flex-wrap items-center justify-between gap-3 px-1"
              aria-label={t("activity.paginationLabel")}
            >
              <p className="text-xs text-neutral-500">
                {t("activity.paginationSummary")
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
                  {t("activity.paginationPrev")}
                </button>
                <button
                  type="button"
                  disabled={!hasMore || loading}
                  onClick={() => setPage(page + 1)}
                  className={cn(assetsOutlineButtonClass, "h-9 disabled:cursor-not-allowed disabled:opacity-50")}
                >
                  {t("activity.paginationNext")}
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
