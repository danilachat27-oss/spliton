import { describe, expect, it, vi } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { AssetsStatRow } from "@/components/dashboard/assets/assets-stat-row";
import { TopPositionsCard } from "@/components/dashboard/assets/top-positions-card";

vi.mock("@/components/providers/i18n-provider", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "en",
  }),
}));

describe("assets overview live guards", () => {
  it("AssetsStatRow in live mode without stats does not render mock values", () => {
    const html = renderToStaticMarkup(<AssetsStatRow live />);
    expect(html).toContain("assets.overview.insufficientData");
    expect(html).not.toContain("58%");
    expect(html).not.toContain("14 280");
  });

  it("TopPositionsCard in live mode without rows shows empty state", () => {
    const html = renderToStaticMarkup(<TopPositionsCard live rows={[]} />);
    expect(html).toContain("assets.overview.portfolioEmptyBody");
    expect(html).not.toContain("Midnight Drive");
  });
});
