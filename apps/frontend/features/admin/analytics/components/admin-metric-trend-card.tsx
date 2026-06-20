"use client";

import Link from "next/link";

import { ADMIN_METRIC_NA_LABEL, isAdminMetricEmpty } from "@/features/admin/lib/admin-format";
import { ADMIN_SECTION_TILE } from "@/features/admin/lib/admin-section-styles";
import { ANALYTICS_CHART } from "@/features/admin/analytics/lib/admin-analytics-theme";
import { cn } from "@/lib/utils";
import { AdminKpiTooltip } from "./admin-kpi-tooltip";
import { buildLinePath } from "@/lib/analytics/chart-path";

export type AdminMetricActiveTone = "neutral" | "warning" | "danger" | "info" | "success";

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
  activeTone?: AdminMetricActiveTone;
};

function parseMetricNumber(value: string): number | null {
  if (isAdminMetricEmpty(value)) return null;
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildSparkSeries(values: number[]): number[] {
  if (values.length >= 2) return values;
  const peak = values[0] ?? 0;
  if (peak <= 0) return [0, 0];
  return [0, peak];
}

function resolveMetricPresentation(
  value: string,
  activeTone: AdminMetricActiveTone,
  deltaPct?: number | null,
) {
  const valueEmpty = isAdminMetricEmpty(value);
  const metricNumber = parseMetricNumber(value);
  const hasAttention =
    !valueEmpty && activeTone !== "neutral" && (metricNumber === null ? true : metricNumber > 0);

  const valueClass = valueEmpty
    ? "text-base font-medium text-zinc-500"
    : cn(
        "text-xl font-semibold sm:text-2xl",
        !hasAttention
          ? "text-zinc-100"
          : activeTone === "danger"
            ? "text-rose-400"
            : activeTone === "info"
              ? "text-sky-400"
              : activeTone === "success"
                ? "text-emerald-400"
                : "text-amber-400",
      );

  const sparkColor = valueEmpty
    ? ANALYTICS_CHART.neutral
    : !hasAttention
      ? ANALYTICS_CHART.neutral
      : activeTone === "danger"
        ? ANALYTICS_CHART.negative
        : activeTone === "info"
          ? "#38bdf8"
          : "#fbbf24";

  if (deltaPct !== null && deltaPct !== undefined && !valueEmpty) {
    return { valueEmpty, valueClass, sparkColor, footerTone: "delta" as const };
  }
  if (valueEmpty) {
    return { valueEmpty, valueClass, sparkColor, footerTone: "empty" as const };
  }
  return { valueEmpty, valueClass, sparkColor, footerTone: "hint" as const };
}

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
  activeTone = "neutral",
}: AdminMetricTrendCardProps) {
  const deltaLabel =
    deltaPct === null || deltaPct === undefined
      ? null
      : deltaPct === 0
        ? "Без изменений к прошлому периоду"
        : `${deltaPct >= 0 ? "+" : ""}${deltaPct.toLocaleString("ru-RU")}% к прошлому периоду`;

  const { valueEmpty, valueClass, sparkColor, footerTone } = resolveMetricPresentation(
    value,
    activeTone,
    deltaPct,
  );

  const metricNumber = parseMetricNumber(value);
  const series = buildSparkSeries(
    trend.length >= 2 ? trend : metricNumber !== null ? [metricNumber] : [0],
  );
  const spark = buildLinePath(series, 64, 24, 0, 2, {
    min: Math.min(...series),
    max: Math.max(...series),
  });

  const body = (
    <div
      className={cn(
        ADMIN_SECTION_TILE,
        "flex h-full min-w-0 flex-col transition-colors",
        (href || onClick) && "cursor-pointer hover:bg-zinc-900/70",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 pr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          {label}
        </p>
        {tooltip ? (
          <AdminKpiTooltip text={tooltip} />
        ) : (
          <span className="size-5 shrink-0" aria-hidden />
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <p className={cn("min-w-0 tabular-nums tracking-tight", valueClass)}>
          {valueEmpty ? ADMIN_METRIC_NA_LABEL : value}
        </p>
        <svg viewBox="0 0 64 24" className="h-6 w-16 shrink-0 opacity-70" aria-hidden>
          <polyline
            points={spark}
            fill="none"
            stroke={sparkColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {footerTone === "empty" ? (
        <p className="mt-2 min-h-[1rem] text-xs text-zinc-600">{valueEmptyHint}</p>
      ) : footerTone === "delta" && deltaLabel ? (
        <p
          className={cn(
            "mt-2 min-h-[1rem] text-xs font-medium tabular-nums",
            deltaPct === 0
              ? "text-zinc-500"
              : (deltaPct ?? 0) >= 0
                ? "text-[#B7F500]"
                : "text-rose-400",
          )}
        >
          {deltaLabel}
        </p>
      ) : (
        <p className="mt-2 min-h-[1rem] text-xs text-zinc-600">{deltaEmptyLabel}</p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full min-w-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/25"
      >
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block h-full min-w-0 w-full rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F500]/25"
      >
        {body}
      </button>
    );
  }

  return body;
}
