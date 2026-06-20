import { describe, expect, it, vi } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { MetricsKpiGrid } from "@/components/dashboard/assets/metrics-kpi-grid";

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}));

describe("assets metrics live guards", () => {
  it("MetricsKpiGrid in live mode without data shows unavailable, not fake zeros", () => {
    const html = renderToStaticMarkup(<MetricsKpiGrid live loading={false} error />);
    expect(html).toContain("assets.metrics.metricsUnavailable");
    expect(html).not.toContain("$0");
  });
});
