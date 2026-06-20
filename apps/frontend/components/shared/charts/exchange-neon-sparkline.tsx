"use client";

import * as React from "react";

import { buildDetailedSeries } from "@/lib/analytics/detailed-series";
import { buildLinePath } from "@/lib/analytics/chart-path";
import { cn } from "@/lib/utils";

export type ExchangeNeonTrend = "up" | "down" | "flat";

const STROKE: Record<ExchangeNeonTrend, string> = {
  up: "#B7F500",
  down: "#fb7185",
  flat: "rgba(255,255,255,0.82)",
};

const STROKE_MUTED: Record<ExchangeNeonTrend, string> = {
  up: "#71717a",
  down: "#a8a29e",
  flat: "rgba(255,255,255,0.42)",
};

const HI: Record<ExchangeNeonTrend, string> = {
  up: "#e8ff9a",
  down: "#fecdd3",
  flat: "#ffffff",
};

const HI_MUTED: Record<ExchangeNeonTrend, string> = {
  up: "#e4e4e7",
  down: "#d6d3d1",
  flat: "rgba(255,255,255,0.72)",
};

function normalizeValues(values: number[]): number[] {
  if (values.length === 0) return [0, 0];
  if (values.length === 1) return [values[0]!, values[0]!];
  return values;
}

/**
 * Компактная линия в стиле графика «Доходность»: плотная серия + неон (как yield-dynamics-chart).
 */
export function ExchangeNeonSparkline({
  values,
  trend,
  width,
  height,
  className,
  fitContainer,
  /** Чем больше, тем плавнее линия между опорными точками */
  detailSegments = 5,
  palette = "neon",
}: {
  values: number[];
  trend: ExchangeNeonTrend;
  width: number;
  height: number;
  className?: string;
  fitContainer?: boolean;
  detailSegments?: number;
  palette?: "neon" | "muted";
}) {
  const uid = React.useId().replace(/:/g, "");
  const glowNeonId = `ex-neon-wide-${uid}`;
  const glowId = `ex-neon-core-${uid}`;
  const softWideId = `ex-neon-softw-${uid}`;
  const softCoreId = `ex-neon-softc-${uid}`;

  const padX = 2;
  const padY = 3;
  const innerW = Math.max(width - padX * 2, 8);
  const innerH = Math.max(height - padY * 2, 8);
  const k = Math.max(0.38, Math.min(1.15, height / 48));

  const series = React.useMemo(
    () => buildDetailedSeries(normalizeValues(values), detailSegments),
    [values, detailSegments],
  );

  const domain = React.useMemo(() => {
    const min = Math.min(...series);
    const max = Math.max(...series);
    if (max === min) return { min: min - 1, max: max + 1 };
    const pad = (max - min) * 0.08;
    return { min: min - pad, max: max + pad };
  }, [series]);

  const points = React.useMemo(() => {
    const raw = buildLinePath(series, innerW, innerH, 0, 0, domain).split(" ");
    const ox = padX;
    const oy = padY;
    return raw
      .map((pt) => {
        const [x, y] = pt.split(",").map(Number);
        return `${(x + ox).toFixed(2)},${(y + oy).toFixed(2)}`;
      })
      .join(" ");
  }, [series, innerW, innerH, domain, padX, padY]);

  const stroke = palette === "muted" ? STROKE_MUTED[trend] : STROKE[trend];
  const hi = palette === "muted" ? HI_MUTED[trend] : HI[trend];
  const useNeonGlow = palette === "neon" && trend === "up";
  const sw5 = Math.max(2.2, height * 0.11);
  const sw9 = Math.max(3.5, height * 0.2);
  const sw28 = Math.max(1.35, height * 0.065);
  const sw11 = Math.max(0.9, height * 0.028);

  return (
    <svg
      width={fitContainer ? "100%" : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn("min-h-0 shrink-0 overflow-visible", fitContainer && "max-w-full", className)}
      aria-hidden
    >
      <defs>
        {useNeonGlow ? (
          <>
            <filter id={glowNeonId} x="-55%" y="-55%" width="210%" height="210%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(1.8, 6.5 * k * 0.42)} result="blurWide" />
              <feColorMatrix
                in="blurWide"
                type="matrix"
                values="0 0 0 0 0.72
                        0 0 0 0 0.98
                        0 0 0 0 0.12
                        0 0 0 0.72 0"
                result="glowWide"
              />
              <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(1, 2.2 * k * 0.45)} result="blurCore" />
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
              <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(0.9, 3.2 * k * 0.45)} result="blur" />
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
              <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(1.6, 4.8 * k * 0.5)} result="bw" />
              <feMerge>
                <feMergeNode in="bw" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id={softCoreId} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(0.85, 2.4 * k * 0.5)} result="bc" />
              <feMerge>
                <feMergeNode in="bc" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </>
        )}
      </defs>

      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={sw5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.16"
      />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={sw9}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.22"
        filter={useNeonGlow ? `url(#${glowNeonId})` : `url(#${softWideId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={sw28}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={useNeonGlow ? `url(#${glowId})` : `url(#${softCoreId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={hi}
        strokeWidth={sw11}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={palette === "muted" ? "0.35" : "0.55"}
      />
    </svg>
  );
}
