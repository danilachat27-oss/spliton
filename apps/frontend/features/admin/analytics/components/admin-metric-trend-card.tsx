"use client";

import Link from "next/link";

import { isAdminMetricEmpty } from "@/features/admin/lib/admin-format";
import { ANALYTICS_CHART } from "@/features/admin/analytics/lib/admin-analytics-theme";
import { adminTile } from "@/features/admin/lib/admin-ui";
import { AdminKpiValue } from "@/features/admin/ui/admin-kpi-value";
import { cn } from "@/lib/utils";
import { AdminKpiTooltip } from "./admin-kpi-tooltip";
import { buildLinePath } from "@/lib/analytics/chart-path";

type AdminMetricTrendCardProps = {
  label: string;
  value: string;
  deltaPct?: number | null;
  tooltip?: string;
  href?: string;
  onClick?: () => void;
  trend?: number[];
  className?: string;
  deltaEmptyLabel?: string;
  valueEmptyHint?: string;
};

export function AdminMetricTrendCard({
  label,
  value,
  deltaPct,
  tooltip,
  href,
  onClick,
  trend = [],
  className,
  deltaEmptyLabel = "Без сравнения с прошлым периодом",
  valueEmptyHint = "Недостаточно данных",
}: AdminMetricTrendCardProps) {
  const valueEmpty = isAdminMetricEmpty(value);
  const deltaLabel =
    deltaPct === null || deltaPct === undefined
      ? null
      : `${deltaPct >= 0 ? "+" : ""}${deltaPct.toLocaleString("ru-RU")}% к прошлому периоду`;

  const sparkColor =
    deltaPct === null || deltaPct === undefined
      ? ANALYTICS_CHART.neutral
      : deltaPct >= 0
        ? ANALYTICS_CHART.positive
        : ANALYTICS_CHART.negative;

  const spark =
    trend.length >= 2
      ? buildLinePath(trend, 64, 24, 0, 2, {
          min: Math.min(...trend),
          max: Math.max(...trend),
        })
      : null;

  const body = (
    <div
      className={cn(
        adminTile,
        "transition-all",
        (href || onClick) &&
          "cursor-pointer hover:border-[#B7F500]/25 hover:bg-zinc-900/60 hover:shadow-md hover:shadow-black/20",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          {label}
          {tooltip ? <AdminKpiTooltip text={tooltip} /> : null}
        </div>
        {spark ? (
          <svg viewBox="0 0 64 24" className="h-6 w-16 shrink-0 opacity-70" aria-hidden>
            <polyline
              points={spark}
              fill="none"
              stroke={sparkColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : null}
      </div>
      <AdminKpiValue value={value} />
      {valueEmpty ? (
        <p className="mt-1 text-xs text-zinc-600">{valueEmptyHint}</p>
      ) : deltaLabel ? (
        <p
          className={cn(
            "mt-1 text-xs font-medium tabular-nums",
            (deltaPct ?? 0) >= 0 ? "text-[#B7F500]" : "text-red-400",
          )}
        >
          {deltaLabel}
        </p>
      ) : (
        <p className="mt-1 text-xs text-zinc-600">{deltaEmptyLabel}</p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-2xl"
      >
        {body}
      </button>
    );
  }

  return body;
}
