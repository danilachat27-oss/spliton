import { describe, expect, it } from "vitest";

import { buildAreaPath, buildLinePath, chartDomainFromZero, chartValueY } from "@/lib/analytics/chart-path";

describe("chartDomainFromZero", () => {
  it("anchors domain at zero for positive series", () => {
    expect(chartDomainFromZero([0, 55, 65])).toEqual({ min: 0, max: 65 + 65 * 0.12 });
  });

  it("returns stable defaults for empty input", () => {
    expect(chartDomainFromZero([])).toEqual({ min: 0, max: 1 });
  });
});

describe("column chart geometry", () => {
  it("maps zero to plot baseline", () => {
    const domain = chartDomainFromZero([0, 55, 65]);
    const plotH = 168;
    const plotY = 12;
    const baseline = chartValueY(0, plotH, plotY, domain);
    const mid = chartValueY(55, plotH, plotY, domain);
    expect(baseline).toBeGreaterThan(mid);
    expect(baseline - mid).toBeGreaterThan(40);
  });

  it("builds closed area path", () => {
    const domain = chartDomainFromZero([10, 20, 30]);
    const area = buildAreaPath([10, 20, 30], 200, 100, 0, 0, domain);
    expect(area.startsWith("M")).toBe(true);
    expect(area.endsWith("Z")).toBe(true);
    expect(buildLinePath([10, 20, 30], 200, 100, 0, 0, domain).split(" ").length).toBe(3);
  });
});
