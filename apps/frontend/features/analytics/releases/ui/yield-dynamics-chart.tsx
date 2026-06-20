"use client";

import * as React from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { MOCK_YIELD_SERIES } from "@/constants/analytics/releases";
import { buildDetailedSeries } from "@/lib/analytics/detailed-series";
import { buildLinePath, paddedChartDomain } from "@/lib/analytics/chart-path";
import { buildYieldChartSeries, yieldChartDomain } from "@/lib/analytics/yield-chart-series";
import { releaseAnalyticsPeriodLabel } from "@/lib/analytics/period-label";
import type { ReleaseAnalyticsYieldDynamicsPoint } from "@/services/release-analytics.service";
import { cn } from "@/lib/utils";
import type { ReleaseAnalyticsPeriod } from "@/types/analytics/releases";

function xAxisTicks(len: number, period: ReleaseAnalyticsPeriod, chartX: number, chartW: number) {
  if (len <= 1) return [{ idx: 0, label: "сейчас", x: chartX }];
  const raw = [0, Math.round((len - 1) * 0.25), Math.round((len - 1) * 0.5), Math.round((len - 1) * 0.75), len - 1];
  const idxs = [...new Set(raw)].sort((a, b) => a - b);
  const spanDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 140;
  return idxs.map((idx) => {
    const ratio = idx / (len - 1);
    const daysBack = Math.round((1 - ratio) * spanDays);
    const label =
      idx === len - 1 || daysBack <= 0
        ? "сейчас"
        : idx === 0
          ? `−${spanDays}д`
          : `−${Math.max(1, daysBack)}д`;
    const x = chartX + ratio * chartW;
    return { idx, label, x };
  });
}

function fmtYieldPct(n: number, fractionDigits = 1) {
  return `${n.toLocaleString("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`;
}

function fmtSignedPp(n: number, fractionDigits = 2) {
  const s = Math.abs(n).toLocaleString("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  if (n > 0) return `+${s}`;
  if (n < 0) return `−${s}`;
  return s;
}

export function YieldDynamicsChart({
  period,
  yieldDynamics,
  mockMode = false,
}: {
  period: ReleaseAnalyticsPeriod;
  yieldDynamics?: ReleaseAnalyticsYieldDynamicsPoint[] | null;
  mockMode?: boolean;
}) {
  const { t } = useI18n();
  const uid = React.useId().replace(/:/g, "");
  const glowId = `yield-line-glow-${uid}`;
  const glowNeonId = `yield-line-glow-neon-${uid}`;
  const clipId = `yield-chart-clip-${uid}`;

  const rawValues = React.useMemo(
    () =>
      (yieldDynamics ?? [])
        .map((p) => Number(p.averageYieldPct))
        .filter((v) => Number.isFinite(v)),
    [yieldDynamics],
  );

  const activeSeries = React.useMemo(() => {
    if (mockMode) {
      const source =
        period === "7d"
          ? MOCK_YIELD_SERIES.slice(-8)
          : period === "30d"
            ? MOCK_YIELD_SERIES.slice(-18)
            : period === "90d"
              ? MOCK_YIELD_SERIES.slice(-30)
              : MOCK_YIELD_SERIES;
      const detailStep = period === "7d" ? 7 : period === "30d" ? 6 : period === "90d" ? 5 : 4;
      return buildDetailedSeries(source, detailStep);
    }
    return buildYieldChartSeries(rawValues, period);
  }, [mockMode, period, rawValues]);

  const statsSeries = mockMode || rawValues.length === 0 ? activeSeries : rawValues;

  const [containerWidth, setContainerWidth] = React.useState(0);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(Math.floor(w));
    });
    ro.observe(el);
    setContainerWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const svgW = Math.max(containerWidth || 720, 400);
  const svgH = 400;
  const chartX = 52;
  const chartY = 36;
  const chartW = Math.max(svgW - chartX - 16, 160);
  const chartH = 286;
  const chartBottom = chartY + chartH;
  const axisLabelY = chartBottom + 22;

  const baseDomain = mockMode ? paddedChartDomain(activeSeries) : yieldChartDomain(statsSeries);
  const center = (baseDomain.max + baseDomain.min) / 2;
  const zoomHalfSpan = (baseDomain.max - baseDomain.min) / 2 / zoom;
  const domainMin = center - zoomHalfSpan;
  const domainMax = center + zoomHalfSpan;
  const domain = { min: domainMin, max: domainMax };
  const last = statsSeries[statsSeries.length - 1] ?? 0;
  const prev = statsSeries[statsSeries.length - 2] ?? last;
  const delta = last - prev;
  const avg = statsSeries.reduce((acc, n) => acc + n, 0) / Math.max(statsSeries.length, 1);
  const hi = Math.max(...statsSeries);
  const lo = Math.min(...statsSeries);
  const range = hi - lo;

  const activeLine = buildLinePath(activeSeries, chartW, chartH, 0, 0, domain)
    .split(" ")
    .map((pt) => {
      const [x, y] = pt.split(",").map(Number);
      return `${(x + chartX).toFixed(2)},${(y + chartY).toFixed(2)}`;
    })
    .join(" ");

  const pointCoords = activeSeries.map((v, i) => {
    const span = domainMax - domainMin || 1;
    const x = chartX + (i / Math.max(activeSeries.length - 1, 1)) * chartW;
    const clamped = Math.max(domainMin, Math.min(domainMax, v));
    const y = chartY + (1 - (clamped - domainMin) / span) * chartH;
    return { x, y, value: v, i };
  });

  const ySpan = domainMax - domainMin || 1;
  const yTickFormat = ySpan < 2 ? (v: number) => v.toFixed(1) : (v: number) => v.toFixed(0);
  const yTicks = [domainMax, domainMin + ySpan * 0.66, domainMin + ySpan * 0.33, domainMin];
  const xTicks = React.useMemo(
    () => xAxisTicks(activeSeries.length, period, chartX, chartW),
    [activeSeries.length, period, chartX, chartW],
  );

  const spanY = domainMax - domainMin || 1;
  const idxDenom = Math.max(activeSeries.length - 1, 1);

  const handleSvgPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === "pointerleave" || e.type === "pointercancel") {
      setHoverIdx(null);
      return;
    }
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xSvg = ((e.clientX - rect.left) / rect.width) * svgW;
    if (xSvg < chartX || xSvg > chartX + chartW) {
      setHoverIdx(null);
      return;
    }
    const t = (xSvg - chartX) / chartW;
    const idx = Math.round(t * idxDenom);
    setHoverIdx(Math.max(0, Math.min(activeSeries.length - 1, idx)));
  };
  const hoverX = hoverIdx !== null ? chartX + (hoverIdx / idxDenom) * chartW : null;
  const hY =
    hoverIdx !== null
      ? chartY +
        (1 - (Math.max(domainMin, Math.min(domainMax, activeSeries[hoverIdx])) - domainMin) / spanY) * chartH
      : null;
  const hoverDelta =
    hoverIdx !== null && hoverIdx > 0 ? activeSeries[hoverIdx]! - activeSeries[hoverIdx - 1]! : delta;

  const startPt = pointCoords[0];
  const endPt = pointCoords[pointCoords.length - 1];
  const activePoint =
    hoverIdx !== null ? pointCoords[hoverIdx] : pointCoords.length ? pointCoords[pointCoords.length - 1] : null;
  const activeIndex = hoverIdx ?? Math.max(activeSeries.length - 1, 0);
  const baselineValue = statsSeries[0] ?? 0;
  const headValue = hoverIdx !== null ? (activePoint?.value ?? last) : last;
  const windowDelta = headValue - baselineValue;
  const windowPctDen = Math.max(Math.abs(baselineValue), 1e-6);
  const windowPct = (windowDelta / windowPctDen) * 100;

  const handleWheelZoom = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((z) => Math.max(0.7, Math.min(3, Number((z + step).toFixed(2)))));
  };

  if (!mockMode && activeSeries.length === 0) {
    return (
      <div className="w-full min-w-0 rounded-2xl bg-[#0d0d0d] p-8 text-center shadow-[0_14px_34px_rgba(0,0,0,0.35)] md:p-10">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Динамика доходности
        </div>
        <p className="mt-3 font-sans text-sm text-zinc-400">
          Недостаточно данных для графика за выбранный период.
        </p>
        <p className="mt-1 font-mono text-[11px] text-zinc-600">
          {releaseAnalyticsPeriodLabel(period)} · данные появятся после накопления метрик
        </p>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="w-full min-w-0 rounded-2xl bg-[#0d0d0d] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.35)] md:p-5"
    >
      <div className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Доходность</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{fmtYieldPct(headValue, 1)}</div>
          <div
            className={cn(
              "mt-1 font-mono text-sm font-semibold tabular-nums sm:text-[15px]",
              windowDelta > 0 ? "text-[#B7F500]" : windowDelta < 0 ? "text-rose-400" : "text-sky-400",
            )}
          >
            {fmtSignedPp(windowDelta, 2)} п.п.{" "}
            <span className="text-zinc-500">
              (
              {Math.abs(windowPct) < 1e-6
                ? "0,0%"
                : `${windowPct >= 0 ? "+" : "−"}${Math.abs(windowPct).toLocaleString("ru-RU", {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 1,
                  })}%`}
              )
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-zinc-600">
            Относительно левой границы графика{hoverIdx !== null ? " · точка по курсору" : ""}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pt-1">
          <div className="rounded-full bg-[#111111] px-3 py-1.5 font-mono text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10">
            {releaseAnalyticsPeriodLabel(period)}
          </div>
        </div>
      </div>

      <div className="w-full min-w-0">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-[46vh] min-h-[280px] w-full max-h-[520px] touch-none select-none sm:min-h-[300px]"
          role="img"
          aria-label={t("analytics.yieldChart.aria")}
          onPointerMove={handleSvgPointer}
          onPointerDown={handleSvgPointer}
          onPointerLeave={handleSvgPointer}
          onPointerCancel={handleSvgPointer}
          onWheel={handleWheelZoom}
        >
          <defs>
            <filter id={glowNeonId} x="-55%" y="-55%" width="210%" height="210%">
              <feGaussianBlur stdDeviation="6.5" result="blurWide" />
              <feColorMatrix
                in="blurWide"
                type="matrix"
                values="0 0 0 0 0.72
                        0 0 0 0 0.98
                        0 0 0 0 0.12
                        0 0 0 0.72 0"
                result="glowWide"
              />
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blurCore" />
              <feColorMatrix
                in="blurCore"
                type="matrix"
                values="0 0 0 0 0.78
                        0 0 0 0 1
                        0 0 0 0 0.22
                        0 0 0 0.9 0"
                result="glowCore"
              />
              <feMerge>
                <feMergeNode in="glowWide" />
                <feMergeNode in="glowCore" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={glowId} x="-45%" y="-45%" width="190%" height="190%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.78
                        0 0 0 0 1
                        0 0 0 0 0.18
                        0 0 0 0.72 0"
                result="glow"
              />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id={clipId}>
              <rect x={chartX} y={chartY} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {yTicks.map((tick, i) => {
            const y = chartY + (i / Math.max(yTicks.length - 1, 1)) * chartH;
            return (
              <g key={`${tick}-${i}`}>
                <line
                  x1={chartX}
                  y1={y}
                  x2={chartX + chartW}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text x={10} y={y + 4} fill="rgba(161,161,170,0.88)" fontSize="11" className="tabular-nums">
                  {yTickFormat(tick)}
                </text>
              </g>
            );
          })}

          {startPt ? (
            <text
              x={chartX + 4}
              y={chartY + 16}
              fill="rgba(161,161,170,0.9)"
              fontSize="10"
              className="tabular-nums"
            >
              {startPt.value.toFixed(1)}
            </text>
          ) : null}
          {endPt ? (
            <text
              x={chartX + chartW - 4}
              y={chartY + 16}
              textAnchor="end"
              fill="rgba(161,161,170,0.9)"
              fontSize="10"
              className="tabular-nums"
            >
              {endPt.value.toFixed(1)}
            </text>
          ) : null}

          <g clipPath={`url(#${clipId})`}>
            <polyline
              points={activeLine}
              fill="none"
              stroke="#B7F500"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.16"
            />
            <polyline
              points={activeLine}
              fill="none"
              stroke="#B7F500"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.22"
              filter={`url(#${glowNeonId})`}
            />
            <polyline
              points={activeLine}
              fill="none"
              stroke="#B7F500"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowId})`}
            />
            <polyline
              points={activeLine}
              fill="none"
              stroke="#e8ff9a"
              strokeWidth="1.15"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.55"
            />
          </g>

          {hoverX !== null && hY !== null ? (
            <g>
              <line
                x1={hoverX}
                y1={chartY}
                x2={hoverX}
                y2={chartBottom}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <circle cx={hoverX} cy={hY} r="4.5" fill="#B7F500" stroke="#0d0d0d" strokeWidth="2" />
            </g>
          ) : (
            <circle
              cx={Number(activeLine.split(" ").at(-1)?.split(",")[0] ?? chartX + chartW)}
              cy={Number(activeLine.split(" ").at(-1)?.split(",")[1] ?? chartBottom)}
              r="4"
              fill="#B7F500"
              stroke="#0d0d0d"
              strokeWidth="2"
            />
          )}

          {activePoint ? (
            <g
              transform={`translate(${Math.min(activePoint.x + 10, chartX + chartW - 148)},${Math.max(activePoint.y - 54, chartY + 6)})`}
            >
              <rect width="140" height="48" rx="10" fill="#0a0a0a" stroke="rgba(255,255,255,0.1)" />
              <text x="10" y="17" fill="rgba(161,161,170,0.92)" fontSize="10" fontWeight="600">
                T-{Math.max(0, activeSeries.length - 1 - activeIndex)}
              </text>
              <text x="10" y="34" fill="white" fontSize="13" fontWeight="700" className="tabular-nums">
                {activePoint.value.toFixed(1)}
              </text>
              <text x="10" y="46" fill="rgba(161,161,170,0.88)" fontSize="10" className="tabular-nums">
                Δ {hoverDelta >= 0 ? "+" : ""}
                {hoverDelta.toFixed(2)}
              </text>
            </g>
          ) : null}

          {xTicks.map(({ idx, label, x }) => (
            <g key={`${idx}-${label}`}>
              <line x1={x} y1={chartBottom} x2={x} y2={chartBottom + 5} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
              <text
                x={x}
                y={axisLabelY}
                fill="rgba(161,161,170,0.88)"
                fontSize="10"
                textAnchor="middle"
                className="tabular-nums"
              >
                {label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={t("analytics.yieldChart.stat.last")} value={last.toFixed(1)} />
        <Stat
          label={t("analytics.yieldChart.stat.deltaStep")}
          value={`${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`}
          valueClass={delta >= 0 ? "text-[#B7F500]" : "text-fuchsia-400"}
        />
        <Stat label={t("analytics.yieldChart.stat.avg")} value={avg.toFixed(1)} />
        <Stat label={t("analytics.yieldChart.stat.max")} value={hi.toFixed(1)} />
        <Stat label={t("analytics.yieldChart.stat.min")} value={lo.toFixed(1)} />
        <Stat label={t("analytics.yieldChart.stat.range")} value={range.toFixed(1)} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl bg-[#090909] px-2.5 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">{label}</div>
      <div className={cn("mt-1 font-mono text-sm font-semibold tabular-nums text-white", valueClass)}>{value}</div>
    </div>
  );
}
