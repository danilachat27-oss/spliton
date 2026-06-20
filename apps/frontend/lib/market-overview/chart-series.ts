export type ChartSeriesShape = "up" | "down" | "flat" | "wave" | "pulse";

export function sanitizeChartSeries(values: readonly number[]): number[] {
  return values.map((v) => Number(v)).filter((v) => Number.isFinite(v));
}

export function buildFallbackSeries(base: number, points: number, shape: ChartSeriesShape): number[] {
  const seed = Math.max(Math.abs(base), 1);
  const out: number[] = [];

  for (let i = 0; i < points; i++) {
    const t = i / Math.max(points - 1, 1);
    let mul = 1;

    switch (shape) {
      case "up":
        mul = 0.82 + t * 0.28 + Math.sin(i * 0.4) * 0.03;
        break;
      case "down":
        mul = 1.12 - t * 0.22 + Math.sin(i * 0.5) * 0.04;
        break;
      case "flat":
        mul = 0.97 + Math.sin(i * 1.1) * 0.025;
        break;
      case "pulse":
        mul = 0.9 + Math.sin(i * 0.9) * 0.12;
        break;
      case "wave":
      default:
        mul = 0.88 + t * 0.1 + Math.sin(i * 0.65) * 0.08;
        break;
    }

    out.push(Math.round(seed * mul * 100) / 100);
  }

  return out;
}

/** Возвращает серию из API или детерминированный fallback с уникальной формой. */
export function resolveChartSeries(
  primary: readonly number[],
  fallbackBase: number,
  shape: ChartSeriesShape,
  points = 14,
): number[] {
  const clean = sanitizeChartSeries(primary);
  if (clean.length >= 2) return clean;
  return buildFallbackSeries(fallbackBase, points, shape);
}

export function formatSeriesDisplayValue(series: readonly number[], fallback = "0"): string {
  const last = series[series.length - 1];
  if (last == null || !Number.isFinite(last)) return fallback;
  return Math.round(last).toLocaleString("ru-RU");
}
