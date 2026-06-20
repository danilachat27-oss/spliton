import { isEmptyDisplayValue } from "@/lib/analytics/display-value";
import {
  buildReleaseDetailPageState,
  lifecycleLabelKey,
  mapLifecycleToRowStatus,
  type ReleaseLifecycleStatus,
} from "@/lib/analytics/release-detail-state";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import type { AppLocale } from "@/lib/i18n/types";
import type {
  ReleaseDetailPageData,
  ReleaseDetailQuickStat,
  ReleaseDetailSummaryRow,
} from "@/types/analytics/release-detail";
import type { ReleaseDetailFullApi } from "@/types/analytics/release-detail-api";

function parseNum(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = Number.parseFloat(raw.replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatZeroUsdt(): string {
  return "0 USDT";
}

function payoutHint(
  amount: string,
  zeroKey: Parameters<typeof detailPageText>[1],
  locale: AppLocale,
): string | undefined {
  const n = parseNum(amount);
  return n <= 0 ? detailPageText(locale, zeroKey) : undefined;
}

function lifecycleRoundLabel(
  lifecycle: ReleaseLifecycleStatus,
  locale: AppLocale,
  pageState: ReturnType<typeof buildReleaseDetailPageState>,
): string {
  if (lifecycle === "sold_out") {
    return detailPageText(locale, "analytics.detail.lifecycle.primaryComplete");
  }
  return detailPageText(locale, pageState.lifecycleLabelKey as Parameters<typeof detailPageText>[1]);
}

export function buildPulsePanel(
  detail: ReleaseDetailFullApi,
  locale: AppLocale,
): ReleaseDetailSummaryRow[] {
  const pageState = buildReleaseDetailPageState(detail);
  const { pulse, primaryRound, payoutSummary } = detail;
  const t = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);

  const lifecycle = pageState.lifecycle;
  const roundLabel = lifecycleRoundLabel(lifecycle, locale, pageState);

  const positionHint = pageState.hasUserPosition
    ? undefined
    : pageState.isGuest
      ? t("analytics.detail.hint.publicAnalytics")
      : t("analytics.detail.hint.noUnits");

  const positionValue = pageState.hasUserPosition
    ? `${detail.user?.userUnits ?? "0"} u.`
    : "0 u.";

  const payouts30d = payoutSummary.payouts30d || formatZeroUsdt();
  const secondary30d = pulse.secondaryVolume30d || formatZeroUsdt();
  const availableUnits = pulse.availablePrimaryUnits;
  const availableHint =
    parseNum(availableUnits) <= 0 ? t("analytics.detail.hint.primaryClosed") : t("analytics.detail.hint.availablePrimary");

  const rows: ReleaseDetailSummaryRow[] = [];

  const yieldVal = detail.expectedYieldPct ?? pulse.grossYieldReference;
  if (!isEmptyDisplayValue(yieldVal ?? undefined)) {
    rows.push({
      kind: "gross",
      label: t("analytics.detail.pulse.grossYield"),
      value: yieldVal!,
      hint: t("analytics.detail.hint.modelYield"),
    });
  }

  rows.push({
    kind: "round-status",
    label: t("analytics.detail.pulse.roundStatus"),
    value: roundLabel,
    hint: lifecycle === "sold_out" ? t("analytics.detail.hint.primaryClosed") : undefined,
  });

  rows.push({
    kind: "position",
    label: t("analytics.detail.pulse.position"),
    value: positionValue,
    hint: positionHint,
  });

  rows.push({
    kind: "payouts",
    label: t("analytics.detail.pulse.payouts30d"),
    value: payouts30d,
    hint: payoutHint(payouts30d, "analytics.detail.hint.noPayouts30d", locale) ?? t("analytics.detail.kpi.sub.payouts30d"),
  });

  const sold = parseNum(primaryRound.soldUnits);
  const total = parseNum(primaryRound.totalUnits);
  const unitsDisplay =
    total > 0 && sold > 0 ? `${sold.toLocaleString("ru-RU")} / ${total.toLocaleString("ru-RU")}` : pulse.unitsInCirculation;

  rows.push({
    kind: "units",
    label: t("analytics.detail.pulse.unitsCirculation"),
    value: unitsDisplay,
    hint: t("analytics.detail.hint.unitsCirculation"),
  });

  rows.push({
    kind: "available",
    label: t("analytics.detail.pulse.availablePrimary"),
    value: `${availableUnits} u.`,
    hint: availableHint,
  });

  rows.push({
    kind: "secondary",
    label: t("analytics.detail.pulse.secondary30d"),
    value: secondary30d,
    hint: payoutHint(secondary30d, "analytics.detail.hint.noSecondary30d", locale) ?? t("analytics.detail.hint.secondaryVolume30d"),
  });

  if (pageState.hasUserPosition && detail.user) {
    rows.push({
      kind: "my-position",
      label: t("analytics.detail.pulse.myPosition"),
      value: detail.user.userUnits ?? "0 u.",
      hint: detail.user.userPayoutsReceived
        ? `${detail.user.userPayoutsReceived} USDT`
        : undefined,
    });
  }

  const minEntry = pulse.minEntryAmount ?? primaryRound.minPurchaseAmount;
  if (!isEmptyDisplayValue(minEntry ?? undefined)) {
    rows.push({
      kind: "min-entry",
      label: t("analytics.detail.hint.minEntry"),
      value: minEntry!,
      hint: t("analytics.detail.hint.minEntry"),
    });
  }

  if (pageState.secondaryCta && pageState.secondaryMarketHref) {
    rows.push({
      kind: "action",
      label: t("analytics.detail.secondary.eyebrow"),
      value: t("analytics.detail.cta.openSecondary"),
      href: pageState.secondaryMarketHref,
    });
  }

  return rows;
}

export function buildQuickStatsLocalized(
  detail: ReleaseDetailFullApi,
  locale: AppLocale,
  soldUnitsFormatted: string,
): ReleaseDetailQuickStat[] {
  const pageState = buildReleaseDetailPageState(detail);
  const t = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);
  const { payoutSummary, primaryRound, secondarySummary } = detail;

  const stats: ReleaseDetailQuickStat[] = [
    {
      label: t("analytics.detail.kpi.payouts30d"),
      value: payoutSummary.payouts30d || formatZeroUsdt(),
      sub: t("analytics.detail.kpi.sub.payouts30d"),
      info: t("analytics.detail.kpi.info.payouts30d"),
    },
    {
      label: t("analytics.detail.kpi.payoutsAllTime"),
      value: payoutSummary.payoutsAllTime || formatZeroUsdt(),
      sub: t("analytics.detail.kpi.sub.payoutsAllTime"),
      info: t("analytics.detail.kpi.info.payoutsAllTime"),
    },
    {
      label: t("analytics.detail.kpi.unitsSold"),
      value: soldUnitsFormatted,
      sub: t("analytics.detail.kpi.sub.unitsSold"),
      info: t("analytics.detail.kpi.info.unitsSold"),
    },
    {
      label: t("analytics.detail.kpi.availablePrimary"),
      value: `${primaryRound.availableUnits} u.`,
      sub: t("analytics.detail.kpi.sub.availablePrimary"),
      info: t("analytics.detail.kpi.info.availablePrimary"),
    },
  ];

  const fillProgress =
    pageState.fillProgressDisplay ??
    (isEmptyDisplayValue(primaryRound.fillProgress) ? null : primaryRound.fillProgress);
  if (fillProgress) {
    stats.push({
      label: t("analytics.detail.kpi.fillProgress"),
      value: fillProgress,
      sub: t("analytics.detail.kpi.sub.fillProgress"),
      info: t("analytics.detail.kpi.info.fillProgress"),
    });
  } else if (pageState.lifecycle === "sold_out") {
    stats.push({
      label: t("analytics.detail.kpi.fillProgress"),
      value: detailPageText(locale, "analytics.detail.lifecycle.primaryComplete"),
      sub: t("analytics.detail.kpi.sub.fillProgress"),
      info: t("analytics.detail.kpi.info.fillProgress"),
    });
  }

  if (primaryRound.raiseTarget) {
    stats.push({
      label: t("analytics.detail.terms.raiseTarget"),
      value: primaryRound.raiseTarget,
      sub: t("analytics.detail.kpi.sub.fillProgress"),
      info: t("analytics.detail.kpi.info.raiseTarget"),
    });
  }

  const vol24 = secondarySummary.secondaryVolume24h || formatZeroUsdt();
  stats.push({
    label: t("analytics.detail.kpi.secondaryVolume24h"),
    value: vol24,
    sub: t("analytics.detail.kpi.sub.secondaryVolume24h"),
    info: t("analytics.detail.kpi.info.secondaryVolume24h"),
  });

  const avgPrice = secondarySummary.averageUnitPrice
    ? `${secondarySummary.averageUnitPrice} USDT / u.`
    : secondarySummary.bestAsk
      ? `${secondarySummary.bestAsk} USDT / u.`
      : null;
  if (avgPrice) {
    stats.push({
      label: t("analytics.detail.kpi.avgUnitPrice"),
      value: avgPrice,
      sub: t("analytics.detail.kpi.sub.avgUnitPrice"),
      info: t("analytics.detail.kpi.info.avgUnitPrice"),
    });
  }

  return stats;
}

export function buildTermsRows(
  detail: ReleaseDetailFullApi,
  locale: AppLocale,
): ReleaseDetailPageData["terms"]["rows"] {
  const pageState = buildReleaseDetailPageState(detail);
  const t = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);
  const { dealTerms, primaryRound } = detail;
  const roundLabel = detailPageText(locale, pageState.lifecycleLabelKey as Parameters<typeof detailPageText>[1]);

  const rows: ReleaseDetailPageData["terms"]["rows"] = [];
  if (dealTerms.artistShare) {
    rows.push({ key: t("analytics.detail.terms.artistShare"), val: `${dealTerms.artistShare}%` });
  }
  if (dealTerms.investorShare) {
    rows.push({ key: t("analytics.detail.terms.investorShare"), val: `${dealTerms.investorShare}%` });
  }
  if (dealTerms.platformFee) {
    rows.push({ key: t("analytics.detail.terms.platformShare"), val: `${dealTerms.platformFee}%` });
  }
  if (primaryRound.raiseTarget) {
    rows.push({ key: t("analytics.detail.terms.raiseTarget"), val: primaryRound.raiseTarget });
  }
  if (primaryRound.hardCap) {
    rows.push({ key: t("analytics.detail.terms.hardCap"), val: primaryRound.hardCap });
  }
  if (primaryRound.totalUnits) {
    rows.push({ key: t("analytics.detail.terms.totalUnits"), val: primaryRound.totalUnits });
  }
  rows.push({ key: t("analytics.detail.terms.roundStatus"), val: roundLabel });
  return rows;
}

export function buildHowItWorksBlocks(
  detail: ReleaseDetailFullApi,
  locale: AppLocale,
): ReleaseDetailPageData["howItWorks"]["blocks"] {
  const t = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);
  const { primaryRound, dealTerms } = detail;
  const blocks: ReleaseDetailPageData["howItWorks"]["blocks"] = [];

  const roundRows: { label: string; value: string }[] = [];
  if (primaryRound.raiseTarget) {
    roundRows.push({ label: t("analytics.detail.terms.raiseTarget"), value: `${primaryRound.raiseTarget} USDT` });
  }
  if (primaryRound.hardCap) {
    roundRows.push({ label: t("analytics.detail.terms.hardCap"), value: `${primaryRound.hardCap} USDT` });
  }
  if (primaryRound.raisedAmount) {
    roundRows.push({ label: t("analytics.detail.mechanics.label.raised"), value: `${primaryRound.raisedAmount} USDT` });
  }
  if (roundRows.length) {
    blocks.push({ heading: t("analytics.detail.mechanics.round"), rows: roundRows });
  }

  if (dealTerms.investorShare) {
    blocks.push({
      heading: t("analytics.detail.mechanics.pool"),
      rows: [{ label: t("analytics.detail.mechanics.label.investorShare"), value: `${dealTerms.investorShare}%` }],
    });
  }

  const promoRows: { label: string; value: string }[] = [];
  if (dealTerms.promoBudget) promoRows.push({ label: t("analytics.detail.mechanics.promo"), value: dealTerms.promoBudget });
  if (dealTerms.artistUpfront) {
    promoRows.push({ label: t("analytics.detail.terms.artistShare"), value: dealTerms.artistUpfront });
  }
  if (dealTerms.platformUpfront) {
    promoRows.push({ label: t("analytics.detail.terms.platformShare"), value: dealTerms.platformUpfront });
  }
  if (promoRows.length) {
    blocks.push({ heading: t("analytics.detail.mechanics.promo"), rows: promoRows });
  }

  const payoutRows: { label: string; value: string }[] = [];
  if (dealTerms.payoutFrequency) {
    payoutRows.push({
      label: t("analytics.detail.mechanics.label.frequency"),
      value: payoutFrequencyLabel(dealTerms.payoutFrequency, locale),
    });
  }
  if (dealTerms.payoutCurrency) {
    payoutRows.push({ label: t("analytics.detail.mechanics.label.currency"), value: dealTerms.payoutCurrency });
  }
  if (dealTerms.payoutNetwork) {
    payoutRows.push({ label: t("analytics.detail.mechanics.label.network"), value: dealTerms.payoutNetwork });
  }
  if (payoutRows.length) {
    blocks.push({ heading: t("analytics.detail.mechanics.payouts"), rows: payoutRows });
  }

  if (dealTerms.modelNotes?.trim()) {
    blocks.push({ heading: t("analytics.detail.mechanics.title"), body: dealTerms.modelNotes.trim() });
  }

  return blocks;
}

function payoutFrequencyLabel(freq: string, locale: AppLocale): string {
  const n = freq.trim().toLowerCase().replace(/_/g, " ").replace(/-/g, " ");
  const map: Record<string, Parameters<typeof detailPageText>[1]> = {
    monthly: "analytics.detail.payoutFreq.monthly",
    quarterly: "analytics.detail.payoutFreq.quarterly",
    weekly: "analytics.detail.payoutFreq.weekly",
    "semi annual": "analytics.detail.payoutFreq.semiAnnual",
    semiannual: "analytics.detail.payoutFreq.semiAnnual",
    annual: "analytics.detail.payoutFreq.annual",
    yearly: "analytics.detail.payoutFreq.annual",
  };
  const key = map[n];
  return key ? detailPageText(locale, key) : freq;
}

export function buildHowItWorksSection(
  detail: ReleaseDetailFullApi,
  locale: AppLocale,
): ReleaseDetailPageData["howItWorks"] {
  const t = (key: Parameters<typeof detailPageText>[1]) => detailPageText(locale, key);
  return {
    title: t("analytics.detail.mechanics.title"),
    description: t("analytics.detail.mechanics.description"),
    blocks: buildHowItWorksBlocks(detail, locale),
  };
}

export function buildAboutParagraphs(
  detail: ReleaseDetailFullApi,
  locale: AppLocale,
): string[] {
  const { identity, dealTerms } = detail;
  const paragraphs: string[] = [];
  if (identity.fullDescription?.trim()) {
    paragraphs.push(identity.fullDescription.trim());
  } else if (identity.shortDescription?.trim()) {
    paragraphs.push(identity.shortDescription.trim());
  } else {
    paragraphs.push(detailPageText(locale, "analytics.detail.about.empty"));
  }
  if (dealTerms.riskDisclosureText?.trim()) {
    paragraphs.push(dealTerms.riskDisclosureText.trim());
  }
  if (dealTerms.legalDisclaimer?.trim()) {
    paragraphs.push(dealTerms.legalDisclaimer.trim());
  }
  return paragraphs;
}

export function resolveDetailRowStatus(detail: ReleaseDetailFullApi): "Active" | "Paused" | "Closed" {
  const pageState = buildReleaseDetailPageState(detail);
  return mapLifecycleToRowStatus(pageState.lifecycle);
}

export function resolveLifecycleLabel(detail: ReleaseDetailFullApi, locale: AppLocale): string {
  const pageState = buildReleaseDetailPageState(detail);
  return detailPageText(locale, lifecycleLabelKey(pageState.lifecycle) as Parameters<typeof detailPageText>[1]);
}

export { buildReleaseDetailPageState };
