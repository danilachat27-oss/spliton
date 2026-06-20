"use client";

import { useMemo } from "react";

import { MetricsDetailChart, type MetricsPoint } from "@/components/dashboard/assets/metrics-charts";
import { assetsCardClass } from "@/components/dashboard/assets/assets-ui";
import { useI18n } from "@/components/providers/i18n-provider";
import { EmptyState } from "@/components/shared/data-states/empty-state";
import { formatDate } from "@/lib/i18n/formatters";

export function MetricsIncomeChart({
  live = false,
  rows,
  loading = false,
}: {
  live?: boolean;
  rows?: { period: string; amount: string }[];
  loading?: boolean;
}) {
  const { t, locale } = useI18n();

  const series: MetricsPoint[] = useMemo(() => {
    if (!rows?.length) return [];
    return rows.map((row) => ({
      label: formatDate(`${row.period}-01`, locale, { month: "short", year: "2-digit" }),
      primary: Number.parseFloat(row.amount) || 0,
    }));
  }, [locale, rows]);

  if (!live) return null;

  return (
    <section className={assetsCardClass} aria-label={t("assets.metrics.incomeChartAria")}>
      <h3 className="text-base font-semibold text-neutral-900">{t("assets.metrics.incomeChartTitle")}</h3>
      <p className="mt-1 text-sm text-neutral-500">{t("assets.metrics.incomeChartHint")}</p>
      {loading && series.length === 0 ? (
        <div className="mt-4 h-56 animate-pulse rounded-2xl bg-neutral-50" />
      ) : series.length === 0 ? (
        <EmptyState message={t("assets.metrics.payoutsAfterFirstPeriod")} />
      ) : (
        <MetricsDetailChart series={series} showSecondary={false} valueIsPercent={false} />
      )}
    </section>
  );
}
