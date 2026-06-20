import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { I18nProvider } from "@/components/providers/i18n-provider";
import { FeesPageContent } from "@/components/fees/fees-page-content";
import { dashboardNavItems } from "@/components/dashboard/dashboard-nav";
import { DASHBOARD_MISC_PATHS } from "@/constants/routes";

vi.mock("@/hooks/use-public-platform-fees", () => ({
  usePublicPlatformFees: () => ({
    live: true,
    fees: null,
    loading: false,
    error: "API unavailable",
    reload: vi.fn(),
  }),
}));

describe("services section live guards", () => {
  it("fees page in live mode with API error shows unavailable, not mock rates", () => {
    const html = renderToStaticMarkup(
      <I18nProvider initialLocale="ru">
        <FeesPageContent />
      </I18nProvider>,
    );
    expect(html).toContain("Тарифы временно недоступны");
    expect(html).toContain("API unavailable");
    expect(html).not.toContain("Краткий обзор");
  });

  it("all services megamenu cards have registered routes", () => {
    const misc = dashboardNavItems.find((i) => i.id === "misc");
    expect(misc?.children?.length).toBe(10);
    const childHrefs = misc!.children!.map((c) => c.href);
    for (const href of childHrefs) {
      expect(DASHBOARD_MISC_PATHS).toContain(href);
    }
  });

  it("no services card href is empty or hash-only", () => {
    const misc = dashboardNavItems.find((i) => i.id === "misc");
    for (const child of misc?.children ?? []) {
      expect(child.href).toMatch(/^\//);
      expect(child.href).not.toBe("#");
    }
  });
});
