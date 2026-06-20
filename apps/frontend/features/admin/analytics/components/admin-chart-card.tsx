"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { adminBtnOutline, adminBtnSecondary } from "@/features/admin/lib/admin-ui";
import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { formatAdminDateShort } from "@/features/admin/lib/admin-format";
import { AdminChartEmptyState, AdminChartSkeleton } from "./admin-chart-states";
import type { ChartEmptyVariant } from "@/features/admin/lib/admin-analytics-i18n";

type AdminChartCardProps = {
  title: string;
  description?: string;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyVariant?: ChartEmptyVariant;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  lastUpdated?: string;
  drilldownHref?: string;
  drilldownLabel?: string;
  exportDisabled?: boolean;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AdminChartCard({
  title,
  description,
  loading,
  error,
  empty,
  emptyVariant = "default",
  emptyTitle,
  emptyDescription,
  onRetry,
  lastUpdated,
  drilldownHref,
  drilldownLabel = "Подробнее",
  exportDisabled = true,
  headerAction,
  children,
  className,
}: AdminChartCardProps) {
  const { t } = useAdminI18n();

  return (
    <div
      className={cn(
        "rounded-3xl bg-zinc-900/80 p-4 shadow-[0_8px_30px_-18px_rgba(0,0,0,0.12)] ring-1 ring-zinc-900/[0.04] md:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
          {lastUpdated ? (
            <p className="mt-1 text-xs text-zinc-400">
              Обновлено: {formatAdminDateShort(lastUpdated)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {headerAction}
          {drilldownHref ? (
            <Link href={drilldownHref}>
              <Button type="button" size="sm" variant="ghost" className={adminBtnOutline}>
                {drilldownLabel}
              </Button>
            </Link>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost" className={adminBtnOutline}
            disabled={exportDisabled}
            title={t("admin.chart.exportCsvTitle")}
          >
            Экспорт
          </Button>
        </div>
      </div>
      <div className="mt-4 min-w-0 overflow-hidden">
        {loading ? (
          <AdminChartSkeleton />
        ) : error ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-6 text-center">
            <p className="text-sm text-rose-700">Не удалось загрузить данные графика</p>
            {onRetry ? (
              <Button type="button" size="sm" variant="ghost" className={cn(adminBtnOutline, "mt-3")} onClick={onRetry}>
                Повторить
              </Button>
            ) : null}
          </div>
        ) : empty ? (
          <AdminChartEmptyState variant={emptyVariant} title={emptyTitle} description={emptyDescription} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
