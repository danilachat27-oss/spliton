"use client";

import * as React from "react";
import Link from "next/link";

import { useI18n } from "@/components/providers/i18n-provider";
import { catalogBuyUnitsPathForRelease } from "@/constants/routes";
import { RELEASE_DETAIL_ANALYTICS_ICONS } from "@/constants/analytics/release-detail-analytics-icons";
import { filterMetricRows } from "@/lib/analytics/display-value";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import { cn } from "@/lib/utils";
import type { ReleaseDetailChartPeriod, ReleaseDetailPageData } from "@/types/analytics/release-detail";

import { DetailEmptyState } from "./detail-empty-state";

const PERIODS: { id: ReleaseDetailChartPeriod; label: string }[] = [
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "90d", label: "90D" },
  { id: "ytd", label: "YTD" },
  { id: "all", label: "Всё" },
];

type DomainWindow = { start: number; end: number };

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function uniqueSeriesIndices(count: number, maxLabels = 6): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];
  const indices = new Set<number>();
  for (let i = 0; i < maxLabels; i++) {
    const r = maxLabels === 1 ? 0 : i / (maxLabels - 1);
    indices.add(Math.round(r * (count - 1)));
  }
  return [...indices].sort((a, b) => a - b);
}

function buildChartGeometry(
  values: number[],
  chartX: number,
  chartY: number,
  chartW: number,
  chartH: number,
  d0: number,
  d1: number,
) {
  const n = values.length;
  if (n === 0) {
    return {
      pointCoords: [] as { x: number; y: number; value: number; i: number }[],
      activeLine: "",
      vmin: 0,
      vmax: 1,
      sparseSingle: false,
    };
  }

  if (n === 1) {
    const v = values[0]!;
    const padding = Math.max(Math.abs(v) * 0.06, 0.5);
    const vmin = v - padding;
    const vmax = v + padding;
    const y = chartY + chartH / 2;
    const x = chartX + chartW / 2;
    return {
      pointCoords: [{ x, y, value: v, i: 0 }],
      activeLine: `${chartX},${y.toFixed(2)} ${chartX + chartW},${y.toFixed(2)}`,
      vmin,
      vmax,
      sparseSingle: true,
    };
  }

  const span = Math.max(d1 - d0, 1e-6);
  const i0 = Math.max(0, Math.floor(d0));
  const i1 = Math.min(n - 1, Math.ceil(d1));
  const slice = values.slice(i0, i1 + 1);
  let vmin = Math.min(...slice);
  let vmax = Math.max(...slice);
  if (vmax === vmin) {
    const padding = Math.max(Math.abs(vmin) * 0.06, 0.5);
    vmin -= padding;
    vmax += padding;
  }
  const vspan = Math.max(vmax - vmin, 1e-9);

  const pointCoords = values.map((v, i) => ({
    x: chartX + ((i - d0) / span) * chartW,
    y: chartY + (1 - (v - vmin) / vspan) * chartH,
    value: v,
    i,
  }));
  const activeLine = pointCoords.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  return { pointCoords, activeLine, vmin, vmax, sparseSingle: false };
}

export function ReleaseDetailPerformanceChart({
  title: _title,
  subtitle: _subtitle,
  seriesByPeriod,
  miniStats,
  releaseId,
  buyHref,
  buyLabel,
  releaseSlug,
  pageState,
  chartLoading = false,
}: {
  title: string;
  subtitle: string;
  seriesByPeriod: Record<ReleaseDetailChartPeriod, number[]>;
  miniStats: { label: string; value: string }[];
  releaseId: string;
  releaseSlug?: string | null;
  buyHref?: string;
  buyLabel?: string;
  pageState?: ReleaseDetailPageData["pageState"];
  chartLoading?: boolean;
}) {
  const { t, locale } = useI18n();
  const visibleMiniStats = filterMetricRows(miniStats);
  const canBuy = pageState?.canBuyPrimary ?? false;
  const secondaryHref = pageState?.secondaryMarketHref;
  const secondaryEnabled = pageState?.secondaryEnabled ?? false;

  const resolvedBuyHref =
    buyHref ?? catalogBuyUnitsPathForRelease({ id: releaseId, slug: releaseSlug });
  const resolvedBuyLabel = buyLabel ?? t("analytics.detail.cta.buyUnits");
  const uid = React.useId().replace(/:/g, "");
  const glowId = `release-detail-line-glow-${uid}`;
  const clipId = `release-detail-chart-clip-${uid}`;

  const [period, setPeriod] = React.useState<ReleaseDetailChartPeriod>("30d");
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  /** Visible index range [start, end], floats; full series when null (synced to 0..n-1). */
  const [domainWindow, setDomainWindow] = React.useState<DomainWindow | null>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const svgWrapRef = React.useRef<HTMLDivElement>(null);
  const panRef = React.useRef<{ pointerId: number; lastClientX: number } | null>(null);
  const domainRef = React.useRef<DomainWindow>({ start: 0, end: 1 });

  const activeSeries = seriesByPeriod[period];
  const n = activeSeries.length;
  const lastIdx = Math.max(n - 1, 0);

  React.useEffect(() => {
    setDomainWindow(null);
    setHoverIndex(null);
  }, [period]);

  React.useEffect(() => {
    const el = svgWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(Math.floor(w));
    });
    ro.observe(el);
    setContainerWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const svgW = Math.max(containerWidth || 640, 360);
  /** Taller viewBox + fixed min CSS height so wide layouts don’t squash the curve vertically. */
  const svgH = 400;
  const chartX = 48;
  const chartY = 32;
  const chartW = Math.max(svgW - chartX - 14, 120);
  const chartH = 300;
  const chartBottom = chartY + chartH;

  const d0 = domainWindow?.start ?? 0;
  const d1 = domainWindow?.end ?? lastIdx;
  const domainSpan = n <= 1 ? 1 : Math.max(d1 - d0, 1e-6);

  React.useEffect(() => {
    domainRef.current = { start: d0, end: d1 };
  }, [d0, d1]);

  const last = activeSeries[activeSeries.length - 1] ?? 0;
  const prev = activeSeries[activeSeries.length - 2] ?? last;
  const delta = last - prev;
  const deltaPct = prev === 0 ? 0 : (delta / prev) * 100;
  const avg = activeSeries.reduce((a, v) => a + v, 0) / Math.max(activeSeries.length, 1);
  const displayPrice = last;
  const hasData = n > 0;
  const sparseSingle = n === 1;
  const chartInteractive = n >= 2;
  const chartText = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);

  if (chartLoading) {
    return (
      <div className="rounded-2xl bg-[#0d0d0d] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.35)] md:p-5">
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-[180px] animate-pulse rounded-xl bg-white/[0.04]" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="rounded-2xl bg-[#0d0d0d] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.35)] md:p-5">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          {detailPageText(locale, "analytics.detail.chart.title")}
        </p>
        <div className="mt-2 overflow-hidden rounded-xl bg-[#111111] ring-1 ring-white/6">
          <DetailEmptyState
            imageSrc={RELEASE_DETAIL_ANALYTICS_ICONS.chartEmpty}
            imageSize="lg"
            title={detailPageText(locale, "analytics.detail.chart.emptyTitle")}
            body={detailPageText(locale, "analytics.detail.chart.emptyBody")}
            action={
              secondaryEnabled && secondaryHref ? (
                <Link
                  href={secondaryHref}
                  className="inline-flex rounded-full bg-[#B7F500] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#c9ff52]"
                >
                  {detailPageText(locale, "analytics.detail.cta.openSecondary")}
                </Link>
              ) : (
                <span className="inline-flex rounded-full bg-white/8 px-4 py-2 text-sm text-zinc-500">
                  {detailPageText(locale, "analytics.detail.chart.emptySecondaryOff")}
                </span>
              )
            }
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-1">
          {PERIODS.map((p) => (
            <span
              key={p.id}
              className="cursor-not-allowed rounded-full px-3 py-1 text-[11px] font-medium text-zinc-600 ring-1 ring-white/8 opacity-60"
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const { pointCoords, activeLine, vmin, vmax, sparseSingle: geometrySparse } = buildChartGeometry(
    activeSeries,
    chartX,
    chartY,
    chartW,
    chartH,
    d0,
    d1,
  );
  const isSparseChart = sparseSingle || geometrySparse;

  const yTicks = [vmax, vmin + (vmax - vmin) * 0.5, vmin];
  const xTickIndices = uniqueSeriesIndices(n);
  const xLabelsByPeriod: Record<ReleaseDetailChartPeriod, string[]> = {
    "7d": ["1д", "2д", "3д", "4д", "5д", "7д"],
    "30d": ["1д", "6д", "12д", "18д", "24д", "30д"],
    "90d": ["15д", "30д", "45д", "60д", "75д", "90д"],
    ytd: ["янв", "мар", "май", "июл", "сен", "дек"],
    all: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"],
  };
  const windowLabel = (idx: number) => {
    if (isSparseChart) return chartText("analytics.detail.chart.sparseWindow");
    const clamped = Math.max(0, Math.min(idx, activeSeries.length - 1));
    const ratio = clamped / Math.max(activeSeries.length - 1, 1);
    const i = Math.min(
      xLabelsByPeriod[period].length - 1,
      Math.round(ratio * (xLabelsByPeriod[period].length - 1)),
    );
    return xLabelsByPeriod[period][i] ?? "—";
  };

  const activePoint = hoverIndex != null ? pointCoords[hoverIndex] : pointCoords.at(-1);
  const activeIndex = hoverIndex ?? Math.max(activeSeries.length - 1, 0);
  const activeDelta =
    hoverIndex != null && hoverIndex > 0 ? activeSeries[hoverIndex] - activeSeries[hoverIndex - 1] : delta;

  const clientXToIndex = (clientX: number) => {
    const el = svgWrapRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const localX = clamp(clientX - rect.left, 0, rect.width);
    const ratio = rect.width <= 0 ? 0 : localX / rect.width;
    const svgLocalX = ratio * svgW;
    const chartRatio = chartW <= 0 ? 0 : clamp((svgLocalX - chartX) / chartW, 0, 1);
    const idxFloat = d0 + chartRatio * domainSpan;
    return clamp(Math.round(idxFloat), 0, Math.max(n - 1, 0));
  };

  const [isPanning, setIsPanning] = React.useState(false);

  const onMoveHover = (clientX: number) => {
    if (panRef.current || isPanning) return;
    setHoverIndex(clientXToIndex(clientX));
  };

  const applyZoomRef = React.useRef<(clientX: number, zoomOut: boolean) => void>(() => {});
  applyZoomRef.current = (clientX: number, zoomOut: boolean) => {
    const el = svgWrapRef.current;
    if (!el || n < 2 || lastIdx < 1) return;
    const rect = el.getBoundingClientRect();
    const localX = clamp(clientX - rect.left, 0, rect.width);
    const ratio = rect.width <= 0 ? 0 : localX / rect.width;
    const svgLocalX = ratio * svgW;
    const r = clamp(chartW <= 0 ? 0.5 : (svgLocalX - chartX) / chartW, 0, 1);

    const cur = domainRef.current;
    const span = Math.max(cur.end - cur.start, 1e-6);
    const center = cur.start + r * span;
    const factor = zoomOut ? 1.12 : 0.88;
    const minSpan = Math.min(lastIdx, Math.max(2, lastIdx * 0.04));
    let newSpan = clamp(span * factor, minSpan, lastIdx);
    let newStart = center - r * newSpan;
    let newEnd = newStart + newSpan;
    if (newStart < 0) {
      newStart = 0;
      newEnd = newSpan;
    }
    if (newEnd > lastIdx) {
      newEnd = lastIdx;
      newStart = lastIdx - newSpan;
    }
    newStart = clamp(newStart, 0, lastIdx - newSpan);
    newEnd = newStart + newSpan;
    const fullView = newSpan >= lastIdx - 0.02 && newStart <= 0.02;
    if (fullView) {
      setDomainWindow(null);
      domainRef.current = { start: 0, end: lastIdx };
    } else {
      const next = { start: newStart, end: newEnd };
      setDomainWindow(next);
      domainRef.current = next;
    }
  };

  React.useEffect(() => {
    const el = svgWrapRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      applyZoomRef.current(e.clientX, e.deltaY > 0);
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, []);

  const resetView = () => {
    setDomainWindow(null);
    domainRef.current = { start: 0, end: lastIdx };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panRef.current = { pointerId: e.pointerId, lastClientX: e.clientX };
    setIsPanning(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (panRef.current && panRef.current.pointerId === e.pointerId) {
      const el = svgWrapRef.current;
      if (!el || n < 2 || lastIdx < 1) return;
      const dx = e.clientX - panRef.current.lastClientX;
      panRef.current.lastClientX = e.clientX;
      const rect = el.getBoundingClientRect();
      const cur = domainRef.current;
      const span = Math.max(cur.end - cur.start, 1e-6);
      const deltaDomain = -(dx / Math.max(rect.width, 1)) * (svgW / Math.max(chartW, 1)) * span;
      let newStart = cur.start + deltaDomain;
      let newEnd = cur.end + deltaDomain;
      if (newStart < 0) {
        newStart = 0;
        newEnd = span;
      }
      if (newEnd > lastIdx) {
        newEnd = lastIdx;
        newStart = lastIdx - span;
      }
      newStart = clamp(newStart, 0, lastIdx - span);
      newEnd = newStart + span;
      const next = { start: newStart, end: newEnd };
      domainRef.current = next;
      setDomainWindow(next);
      return;
    }
    onMoveHover(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (panRef.current?.pointerId === e.pointerId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      panRef.current = null;
      setIsPanning(false);
    }
  };

  const startPt = pointCoords[0];
  const endPt = pointCoords[pointCoords.length - 1];

  return (
    <div className="rounded-2xl bg-[#0d0d0d] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.35)] md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            {chartText("analytics.detail.chart.title")}
          </p>
          <h3 className="mt-1 text-[42px] font-semibold leading-none tracking-tight text-white sm:text-[52px]">
            {displayPrice.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} USDT
          </h3>
          {!isSparseChart ? (
            <p className={cn("mt-2 text-[30px] font-semibold leading-none", delta >= 0 ? "text-[#B7F500]" : "text-rose-300")}>
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(2)} ({deltaPct >= 0 ? "+" : ""}
              {deltaPct.toFixed(2)}%)
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">{chartText("analytics.detail.chart.sparseHint")}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          {chartInteractive ? (
            <div className="flex items-center gap-1 rounded-full bg-[#161616] p-0.5">
              <button
                type="button"
                onClick={() => {
                  const el = svgWrapRef.current;
                  const cx = el ? el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2 : 0;
                  applyZoomRef.current(cx, false);
                }}
                className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#24272b] hover:text-white"
                aria-label={t("analytics.detail.performanceChart.zoomIn")}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = svgWrapRef.current;
                  const cx = el ? el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2 : 0;
                  applyZoomRef.current(cx, true);
                }}
                className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-[#24272b] hover:text-white"
                aria-label={t("analytics.detail.performanceChart.zoomOut")}
              >
                −
              </button>
              <button
                type="button"
                onClick={resetView}
                className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-[#24272b] hover:text-zinc-100"
              >
                {t("analytics.detail.performanceChart.reset")}
              </button>
            </div>
          ) : null}
          {canBuy ? (
            <Link
              href={resolvedBuyHref}
              className="rounded-full bg-[#B7F500] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#c9ff52]"
            >
              {resolvedBuyLabel}
            </Link>
          ) : secondaryEnabled && secondaryHref ? (
            <Link
              href={secondaryHref}
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {detailPageText(locale, "analytics.detail.cta.openSecondary")}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex shrink-0 flex-wrap gap-1.5 lg:justify-center">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              period === p.id
                ? "bg-white/15 text-zinc-100"
                : "bg-[#161616] text-zinc-500 hover:bg-[#1a1a1a] hover:text-zinc-300",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        ref={svgWrapRef}
        className={cn(
          "mt-4 w-full select-none touch-none",
          chartInteractive && (isPanning ? "cursor-grabbing" : "cursor-crosshair"),
        )}
        onPointerDown={chartInteractive ? onPointerDown : undefined}
        onPointerMove={chartInteractive ? onPointerMove : undefined}
        onPointerUp={chartInteractive ? onPointerUp : undefined}
        onPointerCancel={chartInteractive ? onPointerUp : undefined}
        onPointerLeave={
          chartInteractive
            ? (e) => {
                onPointerUp(e);
                setHoverIndex(null);
              }
            : undefined
        }
        style={{ touchAction: "none" }}
      >
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-[50vh] min-h-[320px] w-full max-h-[600px] sm:h-[48vh] sm:min-h-[380px]"
          role="img"
          aria-label={t("analytics.detail.performanceChart.aria")}
        >
          <defs>
            <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.72
                        0 0 0 0 0.96
                        0 0 0 0 0
                        0 0 0 0.55 0"
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
                <text x={8} y={y + 4} fill="rgba(161,161,170,0.88)" fontSize="11">
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}
          {startPt && !isSparseChart && n >= 3 ? (
            <text
              x={chartX + 4}
              y={chartY + 14}
              fill="rgba(161,161,170,0.9)"
              fontSize="10"
              className="tabular-nums"
            >
              {startPt.value.toFixed(1)}
            </text>
          ) : null}
          {endPt && !isSparseChart && n >= 3 ? (
            <text
              x={chartX + chartW - 4}
              y={chartY + 14}
              textAnchor="end"
              fill="rgba(161,161,170,0.9)"
              fontSize="10"
              className="tabular-nums"
            >
              {endPt.value.toFixed(1)}
            </text>
          ) : null}
          {activePoint && chartInteractive ? (
            <line
              x1={activePoint.x}
              y1={chartY}
              x2={activePoint.x}
              y2={chartBottom}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ) : null}
          <g clipPath={`url(#${clipId})`}>
            {isSparseChart ? (
              <line
                x1={chartX}
                y1={activePoint?.y ?? chartY + chartH / 2}
                x2={chartX + chartW}
                y2={activePoint?.y ?? chartY + chartH / 2}
                stroke="#B7F500"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.35"
                strokeDasharray="6 6"
              />
            ) : null}
            {!isSparseChart ? (
              <>
                <polyline
                  points={activeLine}
                  fill="none"
                  stroke="#B7F500"
                  strokeWidth="5"
                  strokeLinecap="round"
                  opacity="0.18"
                />
                <polyline
                  points={activeLine}
                  fill="none"
                  stroke="#B7F500"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  filter={`url(#${glowId})`}
                />
              </>
            ) : null}
          </g>
          {activePoint ? (
            <circle cx={activePoint.x} cy={activePoint.y} r={isSparseChart ? 5 : 4} fill="#B7F500" stroke="#0d0d0d" strokeWidth="2" />
          ) : null}
          {activePoint && chartInteractive ? (
            <g
              transform={`translate(${Math.min(activePoint.x + 10, chartX + chartW - 150)},${Math.max(activePoint.y - 52, chartY + 4)})`}
            >
              <rect width="150" height="46" rx="10" fill="#0a0a0a" stroke="rgba(255,255,255,0.10)" />
              <text x="10" y="15" fill="rgba(161,161,170,0.92)" fontSize="10" fontWeight="600">
                Окно: {windowLabel(activeIndex)}
              </text>
              <text x="10" y="32" fill="white" fontSize="13" fontWeight="700">
                {activePoint.value.toFixed(1)}
              </text>
              <text x="10" y="44" fill="rgba(161,161,170,0.88)" fontSize="10">
                Δ {activeDelta >= 0 ? "+" : ""}
                {activeDelta.toFixed(2)}
              </text>
            </g>
          ) : null}
          {xTickIndices.map((idx) => {
            const x = isSparseChart
              ? chartX + chartW / 2
              : chartX + ((idx - d0) / domainSpan) * chartW;
            if (x < chartX - 2 || x > chartX + chartW + 2) return null;
            const label = isSparseChart
              ? chartText("analytics.detail.chart.axisNow")
              : (() => {
                  const ratio = idx / Math.max(activeSeries.length - 1, 1);
                  const labelIdx = Math.min(
                    xLabelsByPeriod[period].length - 1,
                    Math.round(ratio * (xLabelsByPeriod[period].length - 1)),
                  );
                  return xLabelsByPeriod[period][labelIdx] ?? "—";
                })();
            return (
              <text
                key={`x-${idx}`}
                x={x}
                y={chartBottom + 16}
                textAnchor="middle"
                fill="rgba(161,161,170,0.75)"
                fontSize="10"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl bg-[#090909] px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-600">Последнее (норм.)</div>
          <div className="mt-1 text-sm font-semibold tabular-nums text-white">{last.toFixed(1)}</div>
        </div>
        <div className="rounded-xl bg-[#090909] px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-600">Δ к шагу</div>
          <div className={cn("mt-1 text-sm font-semibold tabular-nums", delta >= 0 ? "text-emerald-300" : "text-rose-300")}>
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl bg-[#090909] px-2.5 py-2">
          <div className="text-[10px] uppercase tracking-wide text-zinc-600">Среднее</div>
          <div className="mt-1 text-sm font-semibold tabular-nums text-white">{avg.toFixed(1)}</div>
        </div>
        {visibleMiniStats.map((s) => (
          <div key={s.label} className="rounded-xl bg-[#090909] px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wide text-zinc-600">{s.label}</div>
            <div className="mt-1 text-sm font-semibold tabular-nums text-zinc-200">{s.value}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-zinc-600">
        {detailPageText(locale, "analytics.detail.chart.sourceNote")}
      </p>
    </div>
  );
}
