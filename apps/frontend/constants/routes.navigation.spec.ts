import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { dashboardNavItems } from "@/components/dashboard/dashboard-nav";
import { ROUTES } from "@/constants/routes";

const REQUIRED_ROUTES: string[] = [
  ROUTES.dashboard,
  ROUTES.dashboardCatalog,
  ROUTES.analyticsReleases,
  ROUTES.guideSelection,
  ROUTES.catalogReleaseParameters,
  ROUTES.catalogMarketOverview,
  ROUTES.myAssetsOverview,
  ROUTES.myAssetsMetrics,
  ROUTES.myAssetsOperations,
  ROUTES.myAssetsPositionsStructure,
  ROUTES.dashboardPayouts,
  ROUTES.dashboardPayoutsComparison,
  ROUTES.dashboardPayoutsHistory,
  `${ROUTES.dashboardPayouts}/deposit`,
  `${ROUTES.dashboardPayouts}/withdraw`,
  ROUTES.dashboardSecondaryMarket,
  ROUTES.calculator,
  ROUTES.fees,
  ROUTES.systemStatus,
  ROUTES.news,
  ROUTES.referralProgram,
  ROUTES.partnerProgram,
  ROUTES.support,
  ROUTES.dashboardProfile,
  ROUTES.dashboardArtist,
  ROUTES.dashboardDisputes,
  ROUTES.dashboardStatements,
  ROUTES.trust,
];

/** Route groups in app/ that do not appear in the URL but host page.tsx files. */
const ROUTE_GROUP_CANDIDATES: Record<string, string[]> = {
  "/assets/overview": ["assets/(portfolio)/overview/page.tsx"],
  "/assets/metrics": ["assets/(portfolio)/metrics/page.tsx"],
  "/assets/positions": ["assets/(portfolio)/positions/page.tsx"],
  "/assets/activity": ["assets/(portfolio)/activity/page.tsx"],
};

/** Map route → app/page.tsx path under apps/frontend/app */
function routeToPagePath(route: string): string {
  const grouped = ROUTE_GROUP_CANDIDATES[route];
  if (grouped?.[0]) return join("app", grouped[0]);

  const clean = route.replace(/^\//, "").replace(/\/$/, "");
  if (!clean) return join("app", "(home)", "page.tsx");
  const segments = clean.split("/");
  return join("app", ...segments, "page.tsx");
}

describe("user navigation routes", () => {
  it("exposes all top-level nav hrefs", () => {
    const hrefs = dashboardNavItems.map((i) => i.href);
    expect(hrefs).toContain(ROUTES.dashboard);
    expect(hrefs).toContain(ROUTES.dashboardCatalog);
    expect(hrefs).toContain(ROUTES.dashboardSecondaryMarket);
  });

  it("includes analytics releases in catalog dropdown", () => {
    const catalog = dashboardNavItems.find((i) => i.id === "catalog");
    const childHrefs = catalog?.children?.map((c) => c.href) ?? [];
    expect(childHrefs).toContain(ROUTES.analyticsReleases);
  });

  it("maps dropdown children to known routes", () => {
    const childHrefs = dashboardNavItems.flatMap((i) => i.children?.map((c) => c.href) ?? []);
    for (const href of childHrefs) {
      expect(href.startsWith("/")).toBe(true);
      expect(href).not.toContain("#");
    }
  });

  it("every nav child href has a page file or is in required list", () => {
    const childHrefs = dashboardNavItems.flatMap((i) => i.children?.map((c) => c.href) ?? []);
    for (const href of childHrefs) {
      expect(REQUIRED_ROUTES).toContain(href);
    }
  });

  it("required closeout routes have page.tsx files", () => {
    const appRoot = join(process.cwd(), "app");
    for (const route of REQUIRED_ROUTES) {
      const pagePath = join(appRoot, routeToPagePath(route).replace(/^app[/\\]/, ""));
      expect(existsSync(pagePath), `missing page for ${route} → ${pagePath}`).toBe(true);
    }
  });

  it("support help center dynamic routes and admin page exist", () => {
    const appRoot = join(process.cwd(), "app");
    expect(existsSync(join(appRoot, "support/articles/[slug]/page.tsx"))).toBe(true);
    expect(existsSync(join(appRoot, "support/categories/[slug]/page.tsx"))).toBe(true);
    expect(existsSync(join(appRoot, "admin/(portal)/help-center/page.tsx"))).toBe(true);
  });
});
