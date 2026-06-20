import type { ReleaseAnalyticsPeriod } from "@/types/analytics/releases";

export function yieldChartAnchorCount(period: ReleaseAnalyticsPeriod) {
  if (period === "7d") return 8;
  if (period === "30d") return 18;
  if (period === "90d") return 30;
  return 40;
}

function resampleLinear(values: number[], targetLen: number) {
  if (values.length === 0) return [];
  if (values.length === 1) return Array.from({ length: targetLen }, () => values[0]!);
  if (values.length >= targetLen) return values;

  const out: number[] = [];
  for (let i = 0; i < targetLen; i += 1) {
    const t = i / Math.max(targetLen - 1, 1);
    const srcIdx = t * (values.length - 1);
    const lo = Math.floor(srcIdx);
    const hi = Math.min(values.length - 1, lo + 1);
    const frac = srcIdx - lo;
    out.push(values[lo]! * (1 - frac) + values[hi]! * frac);
  }
  return out;
}

/** Live-серия: только реальные точки, без декоративного шума из mock-режима. */
export function buildYieldChartSeries(values: number[], period: ReleaseAnalyticsPeriod) {
  if (!values.length) return [];
  return resampleLinear(values, yieldChartAnchorCount(period));
}

/** Ось Y с минимальным размахом — плоская доходность не превращается в «пилу». */
export function yieldChartDomain(values: number[]): { min: number; max: number } {
  if (!values.length) return { min: 0, max: 10 };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const center = (min + max) / 2;
  const dataSpan = max - min;
  const minHalfSpan = Math.max(Math.abs(center) * 0.06, 1);
  const halfSpan = Math.max(dataSpan / 2 + 0.02, minHalfSpan);

  return { min: center - halfSpan, max: center + halfSpan };
}
