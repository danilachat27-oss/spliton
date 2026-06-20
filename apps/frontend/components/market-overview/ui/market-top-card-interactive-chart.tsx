"use client";

import * as React from "react";

import { useI18n } from "@/components/providers/i18n-provider";
import { buildDetailedSeries } from "@/lib/analytics/detailed-series";
import { buildLinePath } from "@/lib/analytics/chart-path";
import { cn } from "@/lib/utils";
import type { MarketRowTrend } from "@/types/market-overview";

const STROKE: Record<MarketRowTrend, string> = {
  up: "#B7F500",
  down: "#fb7185",
  flat: "#38bdf8",
};

const HI: Record<MarketRowTrend, string> = {
  up: "#e8ff9a",
  down: "#fecdd3",
  flat: "#99f6ff",
};

type ChartMode = "slim" | "compact" | "expanded";

const LAYOUT: Record<
  ChartMode,
  { svgH: number; chartX: number; chartY: number; chartH: number; padR: number; detailSeg: number; minSvgW: number }
> = {
  slim: {
    svgH: 68,
    chartX: 4,
    chartY: 6,
    chartH: 52,
    padR: 4,
    detailSeg: 4,
    minSvgW: 108,
  },
  compact: {
    svgH: 84,
    chartX: 6,
    chartY: 8,
    chartH: 64,
    padR: 6,
    detailSeg: 5,
    minSvgW: 132,
  },
  expanded: {
    svgH: 196,
    chartX: 10,
    chartY: 12,
    chartH: 164,
    padR: 10,
    detailSeg: 6,
    minSvgW: 280,
  },
};

/** Детализированная линия + неон; hover — вертикаль и точка (без осей и тултипов, чтобы не наслаивалось). */
export function MarketTopCardInteractiveChart({
  values,
  trend,
  mode,
  className,
}: {
  values: number[];
  trend: MarketRowTrend;
  mode: ChartMode;
  className?: string;
}) {
  const { t: tr } = useI18n();
  const uid = React.useId().replace(/:/g, "");
  const glowNeonId = `mtc-neon-${uid}`;
  const glowId = `mtc-core-${uid}`;
  const softWideId = `mtc-sw-${uid}`;
  const softCoreId = `mtc-sc-${uid}`;
  const clipId = `mtc-clip-${uid}`;

  const lay = LAYOUT[mode];
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = React.useState(0);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState(1);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerW(Math.floor(w));
    });
    ro.observe(el);
    setContainerW(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  const svgW = Math.max(containerW || lay.minSvgW, lay.minSvgW);
  const chartW = Math.max(svgW - lay.chartX - lay.padR, 80);
  const chartH = lay.chartH;
  const chartX = lay.chartX;
  const chartY = lay.chartY;
  const svgH = lay.svgH;
  const chartBottom = chartY + chartH;

  const series = React.useMemo(
    () => buildDetailedSeries(values.length >= 2 ? values : [values[0] ?? 0, values[0] ?? 0], lay.detailSeg),
    [values, lay.detailSeg],
  );

  const domain = React.useMemo(() => {
    const max = Math.max(...series);
    const min = Math.min(...series);
    const baseSpan = Math.max(max - min, 1e-6);
    if (mode !== "expanded") {
      const pad = baseSpan * 0.06;
      return { min: min - pad, max: max + pad };
    }
    const center = (max + min) / 2;
    const zoomHalfSpan = baseSpan / 2 / zoom;
    return { min: center - zoomHalfSpan, max: center + zoomHalfSpan };
  }, [series, mode, zoom]);

  const activeLine = buildLinePath(series, chartW, chartH, 0, 0, domain)
    .split(" ")
    .map((pt) => {
      const [x, y] = pt.split(",").map(Number);
      return `${(x + chartX).toFixed(2)},${(y + chartY).toFixed(2)}`;
    })
    .join(" ");

  const spanY = domain.max - domain.min || 1;
  const idxDenom = Math.max(series.length - 1, 1);

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
    setHoverIdx(Math.max(0, Math.min(series.length - 1, idx)));
  };

  const hoverX = hoverIdx !== null ? chartX + (hoverIdx / idxDenom) * chartW : null;
  const hY =
    hoverIdx !== null
      ? chartY +
        (1 - (Math.max(domain.min, Math.min(domain.max, series[hoverIdx]!)) - domain.min) / spanY) * chartH
      : null;

  const stroke = STROKE[trend];
  const hi = HI[trend];
  const k = Math.max(0.35, Math.min(1, chartH / 170));

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (mode !== "expanded" || !e.ctrlKey) return;
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((z) => Math.max(0.75, Math.min(2.8, Number((z + step).toFixed(2)))));
  };

  return (
    <div
      ref={wrapRef}
      className={cn("w-full min-w-0", className)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        preserveAspectRatio="xMidYMid meet"
        className="block w-full touch-none select-none"
        role="img"
        aria-label={tr("marketOverview.topCard.chartAria")}
        onPointerMove={handleSvgPointer}
        onPointerDown={handleSvgPointer}
        onPointerLeave={handleSvgPointer}
        onPointerCancel={handleSvgPointer}
        onWheel={handleWheel}
      >
        <defs>
          {trend === "up" ? (
            <>
              <filter id={glowNeonId} x="-55%" y="-55%" width="210%" height="210%">
                <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(1.4, 6.5 * k * 0.42)} result="blurWide" />
                <feColorMatrix
                  in="blurWide"
                  type="matrix"
                  values="0 0 0 0 0.72
                          0 0 0 0 0.98
                          0 0 0 0 0.12
                          0 0 0 0.72 0"
                  result="glowWide"
                />
                <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(0.85, 2.2 * k * 0.45)} result="blurCore" />
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
                <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(0.75, 3.2 * k * 0.45)} result="blur" />
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
            </>
          ) : (
            <>
              <filter id={softWideId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(1.4, 4.8 * k * 0.5)} result="bw" />
                <feMerge>
                  <feMergeNode in="bw" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={softCoreId} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(0.75, 2.4 * k * 0.5)} result="bc" />
                <feMerge>
                  <feMergeNode in="bc" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </>
          )}
          <clipPath id={clipId}>
            <rect x={chartX} y={chartY} width={chartW} height={chartH} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <polyline
            points={activeLine}
            fill="none"
            stroke={stroke}
            strokeWidth={Math.max(2.8, 5.5 * k)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.16"
          />
          <polyline
            points={activeLine}
            fill="none"
            stroke={stroke}
            strokeWidth={Math.max(4, 9 * k)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.22"
            filter={trend === "up" ? `url(#${glowNeonId})` : `url(#${softWideId})`}
          />
          <polyline
            points={activeLine}
            fill="none"
            stroke={stroke}
            strokeWidth={Math.max(1.6, 2.75 * k)}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={trend === "up" ? `url(#${glowId})` : `url(#${softCoreId})`}
          />
          <polyline
            points={activeLine}
            fill="none"
            stroke={hi}
            strokeWidth={Math.max(0.9, 1.15 * k)}
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
            <circle cx={hoverX} cy={hY} r={mode === "expanded" ? 5 : 4} fill={stroke} stroke="#0d0d0d" strokeWidth="2" />
          </g>
        ) : (
          <circle
            cx={Number(activeLine.split(" ").at(-1)?.split(",")[0] ?? chartX + chartW)}
            cy={Number(activeLine.split(" ").at(-1)?.split(",")[1] ?? chartBottom)}
            r={mode === "expanded" ? 4.5 : 3.5}
            fill={stroke}
            stroke="#0d0d0d"
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
}
