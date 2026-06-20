"use client";

import "./services-megamenu-preview.css";
import "./cabinet-megamenu-preview.css";

import { ROUTES } from "@/constants/routes";
import {
  CatalogAnalyticsScene,
  CatalogGuideScene,
  CatalogMainScene,
  CatalogMarketScene,
  CatalogReleaseParamsScene,
} from "@/components/dashboard/catalog-megamenu-preview-scenes";
import { MegamenuPreviewSceneShell } from "@/components/dashboard/megamenu-preview-primitives";
import {
  HoldingsActivityScene,
  HoldingsMetricsScene,
  HoldingsOverviewScene,
  HoldingsPositionsScene,
} from "@/components/dashboard/holdings-megamenu-preview-scenes";
import {
  PayoutsComparisonScene,
  PayoutsDepositScene,
  PayoutsHistoryScene,
  PayoutsOverviewScene,
  PayoutsWithdrawScene,
} from "@/components/dashboard/payouts-megamenu-preview-scenes";

const CABINET_SCENE_BY_HREF: Record<string, string> = {
  [ROUTES.dashboardCatalog]: "catalog-main",
  [ROUTES.analyticsReleases]: "catalog-analytics",
  [ROUTES.guideSelection]: "catalog-guide",
  [ROUTES.catalogReleaseParameters]: "catalog-params",
  [ROUTES.catalogMarketOverview]: "catalog-market",
  [ROUTES.myAssetsOverview]: "holdings-overview",
  [ROUTES.myAssetsMetrics]: "holdings-metrics",
  [ROUTES.myAssetsOperations]: "holdings-activity",
  [ROUTES.myAssetsPositionsStructure]: "holdings-positions",
  [ROUTES.dashboardPayouts]: "payouts-overview",
  [ROUTES.dashboardPayoutsComparison]: "payouts-comparison",
  [ROUTES.dashboardPayoutsHistory]: "payouts-history",
  [`${ROUTES.dashboardPayouts}/deposit`]: "payouts-deposit",
  [`${ROUTES.dashboardPayouts}/withdraw`]: "payouts-withdraw",
};

function CabinetSceneContent({ href }: { href: string }) {
  switch (href) {
    case ROUTES.dashboardCatalog:
      return <CatalogMainScene />;
    case ROUTES.analyticsReleases:
      return <CatalogAnalyticsScene />;
    case ROUTES.guideSelection:
      return <CatalogGuideScene />;
    case ROUTES.catalogReleaseParameters:
      return <CatalogReleaseParamsScene />;
    case ROUTES.catalogMarketOverview:
      return <CatalogMarketScene />;
    case ROUTES.myAssetsOverview:
      return <HoldingsOverviewScene />;
    case ROUTES.myAssetsMetrics:
      return <HoldingsMetricsScene />;
    case ROUTES.myAssetsOperations:
      return <HoldingsActivityScene />;
    case ROUTES.myAssetsPositionsStructure:
      return <HoldingsPositionsScene />;
    case ROUTES.dashboardPayouts:
      return <PayoutsOverviewScene />;
    case ROUTES.dashboardPayoutsComparison:
      return <PayoutsComparisonScene />;
    case ROUTES.dashboardPayoutsHistory:
      return <PayoutsHistoryScene />;
    case `${ROUTES.dashboardPayouts}/deposit`:
      return <PayoutsDepositScene />;
    case `${ROUTES.dashboardPayouts}/withdraw`:
      return <PayoutsWithdrawScene />;
    default:
      return null;
  }
}

export function CabinetMegamenuPagePreview({ href, label }: { href: string; label: string }) {
  const scene = CABINET_SCENE_BY_HREF[href] ?? "holdings-overview";
  const darkScene =
    scene === "catalog-main" ||
    scene === "catalog-analytics" ||
    scene === "catalog-guide" ||
    scene === "catalog-params" ||
    scene === "catalog-market";

  return (
    <MegamenuPreviewSceneShell
      key={href}
      title={label}
      dark={darkScene}
      sceneClass={`service-preview-scene--${scene}`}
    >
      <CabinetSceneContent href={href} />
    </MegamenuPreviewSceneShell>
  );
}

export function isCabinetMegamenuPreviewHref(href: string): boolean {
  return href in CABINET_SCENE_BY_HREF;
}
