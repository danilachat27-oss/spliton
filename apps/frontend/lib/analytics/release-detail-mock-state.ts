import type { ReleaseDetailPageState } from "@/lib/analytics/release-detail-state";
import { catalogBuyUnitsPathForRelease, ROUTES } from "@/constants/routes";
import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import type { ReleaseAnalyticsRow } from "@/types/analytics/releases";

/** Demo pageState for mock release detail pages. */
export function createMockReleaseDetailPageState(row: ReleaseAnalyticsRow): ReleaseDetailPageState {
  const isActive = row.status === "Active";
  const buyHref = catalogBuyUnitsPathForRelease({ id: row.id });
  return {
    lifecycle: isActive ? "active_primary" : row.status === "Paused" ? "paused" : "sold_out",
    lifecycleLabelKey: isActive
      ? "analytics.detail.lifecycle.activePrimary"
      : row.status === "Paused"
        ? "analytics.detail.lifecycle.paused"
        : "analytics.detail.lifecycle.soldOut",
    badgeTone: isActive ? "success" : row.status === "Paused" ? "warning" : "neutral",
    canBuyPrimary: isActive,
    primaryBlockingReasonKey: null,
    secondaryEnabled: true,
    secondaryMarketHref: secondaryMarketHref("market", { release: row.id }),
    fillProgressDisplay: "54%",
    hasUserPosition: false,
    isGuest: true,
    primaryCta: isActive
      ? { labelKey: "analytics.detail.cta.buyUnits", href: buyHref }
      : { labelKey: "analytics.detail.cta.openSecondary", href: secondaryMarketHref("market", { release: row.id }) },
    secondaryCta: {
      labelKey: "analytics.detail.cta.openSecondary",
      href: secondaryMarketHref("market", { release: row.id }),
    },
  };
}

export function mockLifecycleLabel(row: ReleaseAnalyticsRow): string {
  if (row.status === "Active") return "Раунд открыт";
  if (row.status === "Paused") return "Пауза";
  return "Распродан";
}
