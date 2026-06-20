"use client";

import * as React from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

import { useReleaseAnalyticsState } from "./hooks/use-release-analytics-state";
import { ReleaseAnalyticsChartsSection } from "./sections/release-analytics-charts-section";
import { ReleaseAnalyticsFiltersToolbar } from "./sections/release-analytics-filters-toolbar";
import { ReleaseAnalyticsInsights } from "./sections/release-analytics-insights";
import { ReleaseAnalyticsOverviewSection } from "./sections/release-analytics-overview-section";
import { ReleaseAnalyticsReleasesTable } from "./sections/release-analytics-releases-table";

function ReleaseAnalyticsTableSkeleton() {
  return (
    <div className="mt-5 overflow-hidden rounded-xl bg-[#111111]" aria-hidden>
      <div className="space-y-2 p-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={`ra-row-skeleton-${i}`} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
        ))}
      </div>
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
        disabled
          ? "cursor-not-allowed bg-white/5 text-zinc-600"
          : "bg-white/10 text-zinc-100 hover:bg-white/14",
      )}
    >
      {label}
    </button>
  );
}

export function ReleaseAnalyticsScreen() {
  const { t } = useI18n();
  const {
    liveMode,
    period,
    setPeriod,
    query,
    setQuery,
    statusTab,
    setStatusTab,
    sort,
    sortDir,
    handleSort,
    genre,
    setGenre,
    chipPreset,
    setChipPreset,
    page,
    setPage,
    pagination,
    totalCount,
    resultCount,
    watch,
    setWatch,
    stats,
    overview,
    timeseries,
    compare,
    genresApi,
    funnel,
    filteredRows,
    loadError,
    overviewError,
    chartsError,
    loading,
    overviewLoading,
    chartsLoading,
    reload,
  } = useReleaseAnalyticsState();

  const toggleWatch = React.useCallback(
    (id: string) => {
      setWatch((w) => ({ ...w, [id]: !w[id] }));
    },
    [setWatch],
  );

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="h-full min-h-0 overflow-auto bg-black font-sans tabular-nums" data-mobile-scroll-root>
      <ReleaseAnalyticsOverviewSection
        period={period}
        onPeriodChange={setPeriod}
        stats={stats}
        overview={overview}
        loading={liveMode && overviewLoading}
        overviewError={liveMode && overviewError}
        mockMode={!liveMode}
      />

      {liveMode ? (
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8">
          <ReleaseAnalyticsChartsSection
            timeseries={timeseries}
            compare={compare}
            genres={genresApi}
            funnel={funnel}
            loading={chartsLoading}
            error={chartsError}
          />
        </div>
      ) : null}

      <ReleaseAnalyticsFiltersToolbar
        statusTab={statusTab}
        onStatusTab={setStatusTab}
        chipPreset={chipPreset}
        onChipPreset={setChipPreset}
        query={query}
        onQuery={setQuery}
        genre={genre}
        onGenre={setGenre}
      />

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-4 md:px-6 lg:px-8">
        {!liveMode ? (
          <p
            className="mb-4 rounded-xl border border-amber-500/20 bg-amber-950/30 px-4 py-3 text-sm text-amber-100"
            role="status"
          >
            Демо-режим: KPI, график и таблица построены на мок-данных и не отражают реальную платформу.
          </p>
        ) : null}

        {loadError ? (
          <div
            className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            Не удалось загрузить аналитику. Проверьте соединение и попробуйте снова.
            <button type="button" className="ml-3 underline" onClick={reload}>
              Повторить
            </button>
          </div>
        ) : null}


        {liveMode && !loadError ? (
          <p className="mb-4 text-xs text-zinc-500">
            Показано {resultCount} из {totalCount}
          </p>
        ) : null}

        {loading ? (
          <ReleaseAnalyticsTableSkeleton />
        ) : (
          <ReleaseAnalyticsReleasesTable
            rows={filteredRows}
            sort={sort}
            sortDir={sortDir}
            onSort={handleSort}
            watch={watch}
            onToggleWatch={toggleWatch}
          />
        )}

        {liveMode && !loading && totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <PaginationButton disabled={page <= 1} onClick={() => setPage(page - 1)} label={t("analytics.releases.pagination.back")} />
            <span className="px-3 text-sm text-zinc-400">
              {t("analytics.releases.pagination.page")
                .replace("{page}", String(page))
                .replace("{total}", String(totalPages))}
            </span>
            <PaginationButton
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              label={t("analytics.releases.pagination.next")}
            />
          </div>
        ) : null}

        <ReleaseAnalyticsInsights period={period} rows={filteredRows} stats={stats} />
        <div className="h-6 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
