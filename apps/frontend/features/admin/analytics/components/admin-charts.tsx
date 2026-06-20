"use client";

import * as React from "react";
import Link from "next/link";

import {
  buildAreaPath,
  buildLinePath,
  chartDomainFromZero,
  chartIndexX,
  chartValueY,
  paddedChartDomain,
  pickChartTickIndexes,
} from "@/lib/analytics/chart-path";
import { cn } from "@/lib/utils";
import { formatAdminDateShort } from "@/features/admin/lib/admin-format";
import { useAdminI18n } from "@/features/admin/hooks/use-admin-i18n";
import { ANALYTICS_CHART } from "@/features/admin/analytics/lib/admin-analytics-theme";

const PLOT = {
  marginLeft: 52,
  marginRight: 16,
  marginTop: 12,
  marginBottom: 36,
  plotH: 168,
  tickCount: 4,
  maxXTicks: 5,
} as const;

function defaultFormat(v: number, locale: string) {
  return v.toLocaleString(locale === "ru" ? "ru-RU" : locale === "es" ? "es-ES" : locale === "pt" ? "pt-BR" : "en-US", {
    maximumFractionDigits: 0,
  });
}

function offsetPlotPath(path: string, plotX: number, plotY: number): string {
  return path.replace(/([ML])([\d.]+),([\d.]+)/g, (_, cmd: string, x: string, y: string) =>
    `${cmd}${(Number(x) + plotX).toFixed(2)},${(Number(y) + plotY).toFixed(2)}`,
  );
}

function formatChartPeriod(period: string): string {
  if (/^\d{4}-W\d{2}$/.test(period)) {
    return period.replace(/^\d{4}-/, "");
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
    }
  }
  return formatAdminDateShort(period);
}

function formatYTick(v: number, formatValue: (v: number) => string): string {
  if (Math.abs(v) >= 1000) {
    return `${(v / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}k`;
  }
  const raw = formatValue(v);
  return raw.length > 8 ? raw.slice(0, 8) : raw;
}

function useChartWidth() {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(480);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(Math.max(Math.floor(entries[0]?.contentRect.width ?? 480), 260));
    });
    ro.observe(el);
    setWidth(Math.max(Math.floor(el.getBoundingClientRect().width), 260));
    return () => ro.disconnect();
  }, []);

  return { wrapRef, width };
}

function ChartGrid({
  plotX,
  plotY,
  plotW,
  plotH,
  domain,
  formatValue,
}: {
  plotX: number;
  plotY: number;
  plotW: number;
  plotH: number;
  domain: { min: number; max: number };
  formatValue: (v: number) => string;
}) {
  const ticks = Array.from({ length: PLOT.tickCount + 1 }, (_, i) => {
    const t = i / PLOT.tickCount;
    return domain.min + (domain.max - domain.min) * (1 - t);
  });

  return (
    <>
      {ticks.map((tick, i) => {
        const y = chartValueY(tick, plotH, plotY, domain);
        return (
          <g key={i}>
            <line x1={plotX} x2={plotX + plotW} y1={y} y2={y} stroke="#f4f4f5" strokeWidth={1} />
            <text x={plotX - 8} y={y + 4} fill="#a1a1aa" fontSize="10" textAnchor="end">
              {formatYTick(tick, formatValue)}
            </text>
          </g>
        );
      })}
      <line x1={plotX} x2={plotX + plotW} y1={plotY + plotH} y2={plotY + plotH} stroke="#e4e4e7" strokeWidth={1} />
    </>
  );
}

function ChartXLabels({
  periods,
  plotX,
  plotY,
  plotW,
  plotH,
}: {
  periods: string[];
  plotX: number;
  plotY: number;
  plotW: number;
  plotH: number;
}) {
  const tickIdx = pickChartTickIndexes(periods.length, PLOT.maxXTicks);
  return (
    <>
      {tickIdx.map((idx) => {
        const x = chartIndexX(idx, periods.length, plotW, plotX);
        return (
          <text
            key={`${periods[idx]}-${idx}`}
            x={x}
            y={plotY + plotH + 22}
            fill="#71717a"
            fontSize="10"
            textAnchor="middle"
          >
            {formatChartPeriod(periods[idx]!)}
          </text>
        );
      })}
    </>
  );
}

type AdminLineChartProps = {
  points: Array<{ period: string; value: number }>;
  valueLabel?: string;
  formatValue?: (v: number) => string;
  className?: string;
  strokeColor?: string;
  areaColor?: string;
  showArea?: boolean;
  showPoints?: boolean;
  showNegativeColor?: boolean;
  negativeColor?: string;
};

export function AdminLineChart({
  points,
  valueLabel,
  formatValue,
  className,
  strokeColor = ANALYTICS_CHART.lime,
  areaColor,
  showArea = false,
  showPoints = false,
  showNegativeColor = false,
  negativeColor = "#e11d48",
}: AdminLineChartProps) {
  const a = useAdminI18n();
  const resolvedValueLabel = valueLabel ?? a.t("admin.chart.value");
  const resolvedFormatValue = formatValue ?? ((v: number) => defaultFormat(v, a.locale));
  const { wrapRef, width } = useChartWidth();
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const clipId = React.useId().replace(/:/g, "");
  const areaGradientId = React.useId().replace(/:/g, "");

  if (!points.length) return null;

  const values = points.map((p) => p.value);
  const domain = showNegativeColor ? paddedChartDomain(values, true) : chartDomainFromZero(values);
  const plotX = PLOT.marginLeft;
  const plotY = PLOT.marginTop;
  const plotW = Math.max(width - plotX - PLOT.marginRight, 80);
  const plotH = PLOT.plotH;
  const svgH = plotY + plotH + PLOT.marginBottom;
  const fillColor = areaColor ?? strokeColor;

  const linePath = buildLinePath(values, plotW, plotH, 0, 0, domain)
    .split(" ")
    .map((pt) => {
      const [x, y] = pt.split(",").map(Number);
      return `${(x + plotX).toFixed(2)},${(y + plotY).toFixed(2)}`;
    })
    .join(" ");

  const areaPath = showArea
    ? offsetPlotPath(buildAreaPath(values, plotW, plotH, 0, 0, domain), plotX, plotY)
    : "";

  const idxDenom = Math.max(points.length - 1, 1);
  const activeIdx = hoverIdx ?? points.length - 1;
  const active = points[activeIdx]!;
  const activeX = chartIndexX(activeIdx, points.length, plotW, plotX);
  const activeY = chartValueY(active.value, plotH, plotY, domain);
  const stroke = active.value < 0 && showNegativeColor ? negativeColor : strokeColor;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === "pointerleave" || e.type === "pointercancel") {
      setHoverIdx(null);
      return;
    }
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xSvg = ((e.clientX - rect.left) / rect.width) * width;
    if (xSvg < plotX || xSvg > plotX + plotW) {
      setHoverIdx(null);
      return;
    }
    const t = (xSvg - plotX) / plotW;
    const idx = Math.round(t * idxDenom);
    setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)));
  };

  const zeroY =
    showNegativeColor && domain.min < 0 && domain.max > 0
      ? chartValueY(0, plotH, plotY, domain)
      : null;

  return (
    <div ref={wrapRef} className={cn("w-full min-w-0 overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${width} ${svgH}`}
        className="block h-auto max-h-[260px] w-full touch-none select-none"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={resolvedValueLabel}
        onPointerMove={handlePointer}
        onPointerLeave={handlePointer}
        onPointerCancel={handlePointer}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={plotX} y={plotY} width={plotW} height={plotH} rx={2} />
          </clipPath>
          {showArea ? (
            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.03" />
            </linearGradient>
          ) : null}
        </defs>

        <rect x={plotX} y={plotY} width={plotW} height={plotH} rx={8} fill="#fafafa" />

        <ChartGrid plotX={plotX} plotY={plotY} plotW={plotW} plotH={plotH} domain={domain} formatValue={resolvedFormatValue} />
        <ChartXLabels periods={points.map((p) => p.period)} plotX={plotX} plotY={plotY} plotW={plotW} plotH={plotH} />

        {zeroY !== null ? (
          <line
            x1={plotX}
            x2={plotX + plotW}
            y1={zeroY}
            y2={zeroY}
            stroke="#d4d4d8"
            strokeDasharray="4 4"
          />
        ) : null}

        <g clipPath={`url(#${clipId})`}>
          {showArea && areaPath ? (
            <path d={areaPath} fill={`url(#${areaGradientId})`} stroke="none" />
          ) : null}
          <polyline
            points={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {showPoints
            ? points.map((p, i) => {
                const x = chartIndexX(i, points.length, plotW, plotX);
                const y = chartValueY(p.value, plotH, plotY, domain);
                const isActive = hoverIdx === i || (hoverIdx === null && i === points.length - 1);
                return (
                  <circle
                    key={`${p.period}-${i}`}
                    cx={x}
                    cy={y}
                    r={isActive ? 4 : 3}
                    fill={isActive ? stroke : "#fff"}
                    stroke={stroke}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                );
              })
            : null}
          {hoverIdx !== null ? (
            <>
              <line
                x1={activeX}
                x2={activeX}
                y1={plotY}
                y2={plotY + plotH}
                stroke="#a1a1aa"
                strokeDasharray="4 4"
              />
              {!showPoints ? (
                <circle cx={activeX} cy={activeY} r={4} fill={stroke} stroke="#fff" strokeWidth={2} />
              ) : null}
            </>
          ) : null}
        </g>

        <rect
          x={plotX}
          y={plotY - 4}
          width={plotW}
          height={plotH + 8}
          fill="transparent"
          pointerEvents="all"
        />

        {hoverIdx !== null ? (
          <g pointerEvents="none">
            <rect x={plotX + plotW - 132} y={plotY} width={132} height={40} rx={8} fill="#141416" opacity={0.95} />
            <text x={plotX + plotW - 124} y={plotY + 16} fill="#fafafa" fontSize="10">
              {formatChartPeriod(active.period)}
            </text>
            <text x={plotX + plotW - 124} y={plotY + 32} fill="#fafafa" fontSize="12" fontWeight="600">
              {resolvedFormatValue(active.value)}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

type AdminColumnChartProps = {
  points: Array<{ period: string; value: number }>;
  valueLabel?: string;
  formatValue?: (v: number) => string;
  className?: string;
  barColor?: string;
  barHoverColor?: string;
};

export function AdminColumnChart({
  points,
  valueLabel,
  formatValue,
  className,
  barColor = "#ec4899",
  barHoverColor = "#db2777",
}: AdminColumnChartProps) {
  const a = useAdminI18n();
  const resolvedValueLabel = valueLabel ?? a.t("admin.chart.valueByDay");
  const resolvedFormatValue = formatValue ?? ((v: number) => defaultFormat(v, a.locale));
  const { wrapRef, width } = useChartWidth();
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const clipId = React.useId().replace(/:/g, "");

  if (!points.length) return null;

  const values = points.map((p) => p.value);
  const domain = chartDomainFromZero(values);
  const plotX = PLOT.marginLeft;
  const plotY = PLOT.marginTop;
  const plotW = Math.max(width - plotX - PLOT.marginRight, 80);
  const plotH = PLOT.plotH;
  const svgH = plotY + plotH + PLOT.marginBottom;
  const baselineY = chartValueY(0, plotH, plotY, domain);
  const n = points.length;
  const slotW = plotW / Math.max(n, 1);
  const barW = Math.max(Math.min(slotW * 0.62, 36), 4);

  const idxDenom = Math.max(n - 1, 1);
  const activeIdx = hoverIdx ?? (n > 0 ? n - 1 : 0);
  const active = points[activeIdx]!;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === "pointerleave" || e.type === "pointercancel") {
      setHoverIdx(null);
      return;
    }
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xSvg = ((e.clientX - rect.left) / rect.width) * width;
    if (xSvg < plotX || xSvg > plotX + plotW) {
      setHoverIdx(null);
      return;
    }
    const t = (xSvg - plotX) / plotW;
    const idx = Math.round(t * idxDenom);
    setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
  };

  return (
    <div ref={wrapRef} className={cn("w-full min-w-0 overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${width} ${svgH}`}
        className="block h-auto max-h-[260px] w-full touch-none select-none"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={valueLabel}
        onPointerMove={handlePointer}
        onPointerLeave={handlePointer}
        onPointerCancel={handlePointer}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={plotX} y={plotY} width={plotW} height={plotH} rx={2} />
          </clipPath>
        </defs>

        <rect x={plotX} y={plotY} width={plotW} height={plotH} rx={8} fill="#fafafa" />

        <ChartGrid plotX={plotX} plotY={plotY} plotW={plotW} plotH={plotH} domain={domain} formatValue={resolvedFormatValue} />
        <ChartXLabels periods={points.map((p) => p.period)} plotX={plotX} plotY={plotY} plotW={plotW} plotH={plotH} />

        <g clipPath={`url(#${clipId})`}>
          {points.map((p, i) => {
            const x = chartIndexX(i, n, plotW, plotX);
            const topY = chartValueY(Math.max(p.value, 0), plotH, plotY, domain);
            const h = Math.max(baselineY - topY, p.value > 0 ? 2 : 0);
            const isHover = hoverIdx === i;
            if (p.value <= 0) return null;
            return (
              <rect
                key={`${p.period}-${i}`}
                x={x - barW / 2}
                y={topY}
                width={barW}
                height={h}
                rx={3}
                fill={isHover ? barHoverColor : barColor}
                opacity={isHover ? 1 : 0.88}
              />
            );
          })}
          {hoverIdx !== null ? (
            <line
              x1={chartIndexX(activeIdx, n, plotW, plotX)}
              x2={chartIndexX(activeIdx, n, plotW, plotX)}
              y1={plotY}
              y2={plotY + plotH}
              stroke="#a1a1aa"
              strokeDasharray="4 4"
            />
          ) : null}
        </g>

        <rect x={plotX} y={plotY - 4} width={plotW} height={plotH + 8} fill="transparent" pointerEvents="all" />

        {hoverIdx !== null ? (
          <g pointerEvents="none">
            <rect x={plotX + plotW - 132} y={plotY} width={132} height={40} rx={8} fill="#141416" opacity={0.95} />
            <text x={plotX + plotW - 124} y={plotY + 16} fill="#fafafa" fontSize="10">
              {formatChartPeriod(active.period)}
            </text>
            <text x={plotX + plotW - 124} y={plotY + 32} fill="#fafafa" fontSize="12" fontWeight="600">
              {resolvedFormatValue(active.value)}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

type AdminBarChartProps = {
  items: Array<{ label: string; value: number; href?: string; color?: string }>;
  formatValue?: (v: number) => string;
  className?: string;
};

export function AdminBarChart({
  items,
  formatValue,
  className,
}: AdminBarChartProps) {
  const a = useAdminI18n();
  const resolvedFormatValue = formatValue ?? ((v: number) => defaultFormat(v, a.locale));
  if (!items.length) return null;
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);

  return (
    <div className={cn("space-y-3 overflow-hidden", className)}>
      {items.map((item) => {
        const pct = Math.round((Math.abs(item.value) / max) * 100);
        const barColor = item.color ?? (item.value < 0 ? ANALYTICS_CHART.negative : ANALYTICS_CHART.lime);
        const bar = (
          <div className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-zinc-400" title={item.label}>
              {item.label}
            </span>
            <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full max-w-full rounded-full transition-all"
                style={{ width: `${Math.max(Math.min(pct, 100), item.value !== 0 ? 4 : 0)}%`, backgroundColor: barColor }}
              />
            </div>
            <span
              className={cn(
                "w-20 shrink-0 text-right text-xs tabular-nums",
                item.value < 0 ? "text-rose-700" : "text-zinc-300",
              )}
            >
              {resolvedFormatValue(item.value)}
            </span>
          </div>
        );
        return item.href ? (
          <Link key={item.label} href={item.href} className="block hover:opacity-80">
            {bar}
          </Link>
        ) : (
          <div key={item.label}>{bar}</div>
        );
      })}
    </div>
  );
}

type AdminMultiLineChartProps = {
  series: Array<{ key: string; label: string; color: string; points: Array<{ period: string; value: number }> }>;
  formatValue?: (v: number) => string;
};

export function AdminMultiLineChart({ series, formatValue }: AdminMultiLineChartProps) {
  const a = useAdminI18n();
  const resolvedFormatValue = formatValue ?? ((v: number) => defaultFormat(v, a.locale));
  const { wrapRef, width } = useChartWidth();
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const periods = [...new Set(series.flatMap((s) => s.points.map((p) => p.period)))].sort();
  if (!periods.length) return null;

  const allValues = series.flatMap((s) =>
    periods.map((period) => s.points.find((p) => p.period === period)?.value ?? 0),
  );
  const domain = paddedChartDomain(allValues, true);

  const plotX = PLOT.marginLeft;
  const plotY = PLOT.marginTop;
  const plotW = Math.max(width - plotX - PLOT.marginRight, 80);
  const plotH = PLOT.plotH;
  const svgH = plotY + plotH + PLOT.marginBottom;
  const idxDenom = Math.max(periods.length - 1, 1);
  const activeIdx = hoverIdx ?? periods.length - 1;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === "pointerleave" || e.type === "pointercancel") {
      setHoverIdx(null);
      return;
    }
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xSvg = ((e.clientX - rect.left) / rect.width) * width;
    if (xSvg < plotX || xSvg > plotX + plotW) {
      setHoverIdx(null);
      return;
    }
    const t = (xSvg - plotX) / plotW;
    const idx = Math.round(t * idxDenom);
    setHoverIdx(Math.max(0, Math.min(periods.length - 1, idx)));
  };

  const activeX = chartIndexX(activeIdx, periods.length, plotW, plotX);
  const clipId = React.useId().replace(/:/g, "");

  return (
    <div ref={wrapRef} className="w-full min-w-0 overflow-hidden">
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <span key={s.key} className="inline-flex max-w-full items-center gap-1.5 truncate text-xs text-zinc-400">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="truncate">{s.label}</span>
          </span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${svgH}`}
        className="block h-auto max-h-[280px] w-full touch-none select-none"
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={handlePointer}
        onPointerLeave={handlePointer}
        onPointerCancel={handlePointer}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={plotX} y={plotY} width={plotW} height={plotH} rx={2} />
          </clipPath>
        </defs>

        <ChartGrid plotX={plotX} plotY={plotY} plotW={plotW} plotH={plotH} domain={domain} formatValue={resolvedFormatValue} />
        <ChartXLabels periods={periods} plotX={plotX} plotY={plotY} plotW={plotW} plotH={plotH} />

        {domain.min < 0 && domain.max > 0 ? (
          <line
            x1={plotX}
            x2={plotX + plotW}
            y1={chartValueY(0, plotH, plotY, domain)}
            y2={chartValueY(0, plotH, plotY, domain)}
            stroke="#d4d4d8"
            strokeDasharray="4 4"
          />
        ) : null}

        <g clipPath={`url(#${clipId})`}>
          {series.map((s) => {
            const values = periods.map((period) => s.points.find((p) => p.period === period)?.value ?? 0);
            const path = buildLinePath(values, plotW, plotH, 0, 0, domain)
              .split(" ")
              .map((pt) => {
                const [x, y] = pt.split(",").map(Number);
                return `${(x + plotX).toFixed(2)},${(y + plotY).toFixed(2)}`;
              })
              .join(" ");
            return (
              <polyline
                key={s.key}
                points={path}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          {hoverIdx !== null
            ? series.map((s) => {
                const values = periods.map((period) => s.points.find((p) => p.period === period)?.value ?? 0);
                const v = values[activeIdx] ?? 0;
                const y = chartValueY(v, plotH, plotY, domain);
                return (
                  <circle key={`dot-${s.key}`} cx={activeX} cy={y} r={3.5} fill={s.color} stroke="#fff" strokeWidth={1.5} />
                );
              })
            : null}
          {hoverIdx !== null ? (
            <line
              x1={activeX}
              x2={activeX}
              y1={plotY}
              y2={plotY + plotH}
              stroke="#a1a1aa"
              strokeDasharray="4 4"
            />
          ) : null}
        </g>
      </svg>

      {hoverIdx !== null ? (
        <div className="mt-2 rounded-lg border border-zinc-800/80 bg-zinc-900/80 px-3 py-2 text-xs">
          <p className="font-medium text-zinc-200">{formatChartPeriod(periods[activeIdx]!)}</p>
          <div className="mt-1 space-y-0.5">
            {series.map((s) => {
              const v = s.points.find((p) => p.period === periods[activeIdx])?.value ?? 0;
              return (
                <p key={s.key} className="flex items-center justify-between gap-2 tabular-nums">
                  <span className="inline-flex items-center gap-1.5 text-zinc-400">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-medium text-zinc-100">{resolvedFormatValue(v)}</span>
                </p>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">{a.t("admin.chart.hoverHint")}</p>
      )}
    </div>
  );
}

type AdminDonutChartProps = {
  items: Array<{ label: string; value: number; color: string }>;
  formatValue?: (v: number) => string;
  className?: string;
};

export function AdminDonutChart({
  items,
  formatValue,
  className,
}: AdminDonutChartProps) {
  const a = useAdminI18n();
  const resolvedFormatValue = formatValue ?? ((v: number) => defaultFormat(v, a.locale));
  if (!items.length) return null;
  const total = items.reduce((s, i) => s + Math.max(i.value, 0), 0);
  if (total <= 0) return null;

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const stroke = 20;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className={cn("flex flex-col gap-4 overflow-hidden sm:flex-row sm:items-center", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-40 w-40 shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f4f4f5" strokeWidth={stroke} />
        {items.map((item) => {
          const pct = item.value / total;
          const dash = pct * circumference;
          const seg = (
            <circle
              key={item.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={item.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dash;
          return seg;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fill="#e4e4e7" fontSize="13" fontWeight="600">
          {resolvedFormatValue(total)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#71717a" fontSize="9">
          {a.t("admin.chart.total")}
        </text>
      </svg>
      <div className="min-w-0 flex-1 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="min-w-0 flex-1 truncate text-zinc-400">{item.label}</span>
            <span className="shrink-0 tabular-nums text-zinc-200">{resolvedFormatValue(item.value)}</span>
            <span className="w-10 shrink-0 text-right tabular-nums text-zinc-400">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
