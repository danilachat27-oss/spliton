import { secondaryMarketHref } from "@/constants/dashboard/secondary-market";
import { catalogBuyUnitsPathForRelease, ROUTES } from "@/constants/routes";
import { isEmptyDisplayValue } from "@/lib/analytics/display-value";
import type { ReleaseDetailFullApi } from "@/types/analytics/release-detail-api";

export type ReleaseLifecycleStatus =
  | "draft"
  | "active_primary"
  | "sold_out"
  | "closed"
  | "paused"
  | "coming_soon";

export type ReleaseDetailCtaAction = {
  labelKey: string;
  href: string;
  disabled?: boolean;
  reasonKey?: string;
};

export type ReleaseDetailPageState = {
  lifecycle: ReleaseLifecycleStatus;
  lifecycleLabelKey: string;
  badgeTone: "success" | "warning" | "neutral" | "muted";
  canBuyPrimary: boolean;
  primaryBlockingReasonKey: string | null;
  secondaryEnabled: boolean;
  secondaryMarketHref?: string;
  fillProgressDisplay: string | null;
  hasUserPosition: boolean;
  isGuest: boolean;
  primaryCta: ReleaseDetailCtaAction | null;
  secondaryCta: ReleaseDetailCtaAction | null;
};

const DEPOSIT_HREF = "/assets/payouts/deposit";

function parseNum(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = Number.parseFloat(raw.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function resolveReleaseLifecycleFromApi(detail: ReleaseDetailFullApi): ReleaseLifecycleStatus {
  const lifecycle = detail.identity.lifecycleStatus;
  if (lifecycle) {
    return lifecycle as ReleaseLifecycleStatus;
  }
  const available = parseNum(detail.primaryRound.availableUnits);
  const sold = parseNum(detail.primaryRound.soldUnits);
  const total = parseNum(detail.primaryRound.totalUnits);
  const status = (detail.identity.status ?? "").toLowerCase();
  const pub = (detail.identity.publicStatus ?? "").toLowerCase();

  if (pub.includes("coming") || pub.includes("soon") || pub.includes("скоро")) return "coming_soon";
  if (status.includes("pause")) return "paused";
  if (status.includes("draft") || status.includes("review")) return "draft";
  if (status.includes("sold") || (available <= 0 && sold > 0 && (total <= 0 || sold >= total))) {
    return "sold_out";
  }
  if (detail.primaryRound.canBuyPrimary && available > 0) return "active_primary";
  if (available <= 0 && sold > 0) return "sold_out";
  if (status.includes("closed") || status.includes("archived")) return "closed";
  return detail.primaryRound.canBuyPrimary ? "active_primary" : "closed";
}

export function lifecycleLabelKey(lifecycle: ReleaseLifecycleStatus): string {
  switch (lifecycle) {
    case "active_primary":
      return "analytics.detail.lifecycle.activePrimary";
    case "sold_out":
      return "analytics.detail.lifecycle.soldOut";
    case "paused":
      return "analytics.detail.lifecycle.paused";
    case "coming_soon":
      return "analytics.detail.lifecycle.comingSoon";
    case "draft":
      return "analytics.detail.lifecycle.draft";
    default:
      return "analytics.detail.lifecycle.closed";
  }
}

export function lifecycleBadgeTone(lifecycle: ReleaseLifecycleStatus): ReleaseDetailPageState["badgeTone"] {
  switch (lifecycle) {
    case "active_primary":
      return "success";
    case "sold_out":
      return "neutral";
    case "paused":
      return "warning";
    case "coming_soon":
      return "muted";
    default:
      return "muted";
  }
}

export function computeFillProgressDisplay(
  lifecycle: ReleaseLifecycleStatus,
  fillProgress: string | null | undefined,
  soldUnits: string,
  totalUnits: string,
): string | null {
  const sold = parseNum(soldUnits);
  const total = parseNum(totalUnits);
  if (lifecycle === "sold_out" && total > 0 && sold >= total) {
    return "100%";
  }
  if (isEmptyDisplayValue(fillProgress ?? undefined)) {
    return lifecycle === "sold_out" ? null : null;
  }
  return fillProgress ?? null;
}

export function buildReleaseDetailPageState(detail: ReleaseDetailFullApi): ReleaseDetailPageState {
  const lifecycle = resolveReleaseLifecycleFromApi(detail);
  const hasUserPosition = parseNum(detail.user?.userUnits ?? "0") > 0;
  const isGuest = detail.user == null;
  const secondaryEnabled = detail.dealTerms.secondaryEnabled;
  const slug = detail.identity.slug;
  const releaseId = detail.identity.id;
  const marketHref = secondaryEnabled ? secondaryMarketHref("market", { release: slug }) : undefined;
  const buyHref = catalogBuyUnitsPathForRelease({ id: releaseId, slug });
  const canBuyPrimary = detail.primaryRound.canBuyPrimary && lifecycle === "active_primary";

  let primaryCta: ReleaseDetailCtaAction | null = null;
  let secondaryCta: ReleaseDetailCtaAction | null = null;

  if (hasUserPosition) {
    primaryCta = {
      labelKey: "analytics.detail.cta.myPosition",
      href: `${ROUTES.analyticsReleases}/${encodeURIComponent(releaseId)}?view=ledger`,
    };
    secondaryCta = {
      labelKey: "analytics.detail.cta.payoutHistory",
      href: `${ROUTES.analyticsReleases}/${encodeURIComponent(releaseId)}?view=ledger`,
    };
  } else if (isGuest) {
    primaryCta = {
      labelKey: "analytics.detail.cta.loginToBuy",
      href: "/login",
    };
    if (secondaryEnabled && marketHref) {
      secondaryCta = { labelKey: "analytics.detail.cta.openSecondary", href: marketHref };
    }
  } else if (canBuyPrimary) {
    primaryCta = { labelKey: "analytics.detail.cta.buyUnits", href: buyHref };
    secondaryCta = { labelKey: "analytics.detail.cta.topUpWallet", href: DEPOSIT_HREF };
  } else if (lifecycle === "sold_out" && secondaryEnabled && marketHref) {
    primaryCta = { labelKey: "analytics.detail.cta.openSecondary", href: marketHref };
  } else if (lifecycle === "paused") {
    primaryCta = {
      labelKey: "analytics.detail.cta.roundPaused",
      href: buyHref,
      disabled: true,
      reasonKey: "analytics.detail.cta.roundPausedReason",
    };
  } else if (lifecycle === "coming_soon") {
    primaryCta = {
      labelKey: "analytics.detail.cta.comingSoon",
      href: ROUTES.dashboardCatalog,
      disabled: true,
    };
  } else {
    primaryCta = {
      labelKey: "analytics.detail.cta.primaryClosed",
      href: buyHref,
      disabled: true,
      reasonKey: detail.primaryRound.primaryBlockingReason
        ? undefined
        : "analytics.detail.cta.primaryClosedReason",
    };
    if (secondaryEnabled && marketHref) {
      secondaryCta = { labelKey: "analytics.detail.cta.openSecondary", href: marketHref };
    }
  }

  const blockingKey =
    !canBuyPrimary && detail.primaryRound.primaryBlockingReason
      ? null
      : lifecycle === "sold_out"
        ? "analytics.detail.hint.primaryClosed"
        : lifecycle === "paused"
          ? "analytics.detail.cta.roundPausedReason"
          : null;

  return {
    lifecycle,
    lifecycleLabelKey: lifecycleLabelKey(lifecycle),
    badgeTone: lifecycleBadgeTone(lifecycle),
    canBuyPrimary,
    primaryBlockingReasonKey: blockingKey,
    secondaryEnabled,
    secondaryMarketHref: marketHref,
    fillProgressDisplay: computeFillProgressDisplay(
      lifecycle,
      detail.primaryRound.fillProgress,
      detail.primaryRound.soldUnits,
      detail.primaryRound.totalUnits,
    ),
    hasUserPosition,
    isGuest,
    primaryCta,
    secondaryCta,
  };
}

export function mapLifecycleToRowStatus(
  lifecycle: ReleaseLifecycleStatus,
): "Active" | "Paused" | "Closed" {
  if (lifecycle === "active_primary") return "Active";
  if (lifecycle === "paused") return "Paused";
  if (lifecycle === "sold_out") return "Closed";
  return "Closed";
}

export function rowStatusForHero(lifecycle: ReleaseLifecycleStatus): "Active" | "Paused" | "Closed" {
  if (lifecycle === "active_primary") return "Active";
  if (lifecycle === "paused") return "Paused";
  return "Closed";
}

/** Hero badge uses dedicated sold_out label via lifecycle, not generic Active. */
export function heroStatusLabelKey(lifecycle: ReleaseLifecycleStatus): string {
  return lifecycleLabelKey(lifecycle);
}
