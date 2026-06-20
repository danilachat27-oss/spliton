export function buildLinePath(
  values: number[],
  width: number,
  height: number,
  paddingX = 0,
  paddingY = 0,
  domain?: { min: number; max: number },
) {
  const min = domain?.min ?? Math.min(...values);
  const max = domain?.max ?? Math.max(...values);
  const span = max - min || 1;
  const denom = Math.max(values.length - 1, 1);
  const innerW = Math.max(width - paddingX * 2, 1);
  const innerH = Math.max(height - paddingY * 2, 1);

  return values
    .map((v, i) => {
      const x = paddingX + (i / denom) * innerW;
      const norm = Math.max(0, Math.min(1, (v - min) / span));
      const y = paddingY + (1 - norm) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/** Y coordinate for a value inside plot area (for dots / crosshair). */
export function chartValueY(
  value: number,
  plotH: number,
  plotY: number,
  domain: { min: number; max: number },
): number {
  const span = domain.max - domain.min || 1;
  const norm = Math.max(0, Math.min(1, (value - domain.min) / span));
  return plotY + (1 - norm) * plotH;
}

export function chartIndexX(index: number, count: number, plotW: number, plotX: number): number {
  const denom = Math.max(count - 1, 1);
  return plotX + (index / denom) * plotW;
}

export function paddedChartDomain(values: number[], includeZero = false): { min: number; max: number } {
  if (!values.length) return { min: 0, max: 1 };
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.15, 1);
    return { min: min - pad, max: max + pad };
  }
  const span = max - min;
  const pad = span * 0.12;
  return { min: min - pad, max: max + pad };
}

export function pickChartTickIndexes(length: number, maxTicks = 5): number[] {
  if (length <= 0) return [];
  if (length <= maxTicks) return Array.from({ length }, (_, i) => i);
  const out: number[] = [];
  for (let t = 0; t < maxTicks; t += 1) {
    out.push(Math.round((t / (maxTicks - 1)) * (length - 1)));
  }
  return [...new Set(out)];
}

/** Domain anchored at zero — for revenue / volume column charts. */
export function chartDomainFromZero(values: number[]): { min: number; max: number } {
  if (!values.length) return { min: 0, max: 1 };
  const max = Math.max(...values, 0);
  if (max === 0) return { min: 0, max: 1 };
  const pad = Math.max(max * 0.12, 1);
  return { min: 0, max: max + pad };
}

export function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  paddingX = 0,
  paddingY = 0,
  domain?: { min: number; max: number },
): string {
  if (!values.length) return "";
  const line = buildLinePath(values, width, height, paddingX, paddingY, domain);
  const pts = line.split(" ").filter(Boolean);
  if (!pts.length) return "";
  const first = pts[0]!.split(",").map(Number);
  const last = pts[pts.length - 1]!.split(",").map(Number);
  const baselineY = paddingY + height;
  const path = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt}`).join(" ");
  return `${path} L${last[0]!.toFixed(2)},${baselineY.toFixed(2)} L${first[0]!.toFixed(2)},${baselineY.toFixed(2)} Z`;
}
