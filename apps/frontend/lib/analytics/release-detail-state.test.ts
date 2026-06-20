import { describe, expect, it } from "vitest";

import {
  buildReleaseDetailPageState,
  computeFillProgressDisplay,
  resolveReleaseLifecycleFromApi,
} from "@/lib/analytics/release-detail-state";
import type { ReleaseDetailFullApi } from "@/types/analytics/release-detail-api";

function baseDetail(overrides: Partial<ReleaseDetailFullApi> = {}): ReleaseDetailFullApi {
  return {
    identity: {
      id: "rel-1",
      slug: "test-release",
      symbol: "TST",
      title: "Test Release",
      artistName: "Artist",
      genre: "electronic",
      status: "ACTIVE",
      publicStatus: "ACTIVE",
      lifecycleStatus: null,
      shortDescription: null,
      fullDescription: null,
      coverUrl: null,
      videoUrl: null,
      videoPosterUrl: null,
      videoType: "NONE",
      videoStatus: "NONE",
    },
    primaryRound: {
      totalUnits: "100",
      soldUnits: "100",
      availableUnits: "0",
      canBuyPrimary: false,
      primaryBlockingReason: "SOLD_OUT",
      fillProgress: null,
      raiseTarget: null,
      hardCap: null,
      raisedAmount: null,
      minPurchaseAmount: null,
    },
    dealTerms: {
      secondaryEnabled: true,
      artistShare: "40",
      investorShare: "26",
      platformFee: "34",
      payoutFrequency: "Monthly",
      payoutCurrency: "USDT",
      payoutNetwork: "TRC20",
      promoBudget: null,
      artistUpfront: null,
      platformUpfront: null,
      modelNotes: null,
      riskDisclosureText: null,
      legalDisclaimer: null,
    },
    pulse: {
      grossYieldReference: "12%",
      availablePrimaryUnits: "0",
      unitsInCirculation: "100",
      secondaryVolume30d: "0 USDT",
      minEntryAmount: null,
      walletCtaHref: "/assets/payouts/deposit",
      walletCtaAvailable: true,
    },
    payoutSummary: {
      payouts30d: "0 USDT",
      payoutsAllTime: "0 USDT",
      lastPayoutDate: null,
    },
    secondarySummary: {
      activeListings: 0,
      trades7d: 0,
      averageSpread: null,
      bestBid: null,
      bestAsk: null,
      lastTradePrice: null,
      liquidityLabel: "LOW",
      secondaryVolume24h: "0 USDT",
      secondaryAvailable: false,
      averageUnitPrice: null,
      priceChange7d: null,
    },
    payoutHistory: [],
    faq: [],
    user: null,
    expectedYieldPct: null,
    ...overrides,
  } as ReleaseDetailFullApi;
}

describe("release-detail-state", () => {
  it("resolves sold_out when all units sold", () => {
    const lifecycle = resolveReleaseLifecycleFromApi(baseDetail());
    expect(lifecycle).toBe("sold_out");
  });

  it("shows 100% fill progress for fully sold release", () => {
    expect(computeFillProgressDisplay("sold_out", null, "100", "100")).toBe("100%");
  });

  it("disables primary buy CTA for sold_out release", () => {
    const detail = baseDetail({
      user: {
        userUnits: "0",
        userPayoutsReceived: null,
        userPendingOrders: 0,
        avgEntryPrice: null,
      },
    });
    const state = buildReleaseDetailPageState(detail);
    expect(state.canBuyPrimary).toBe(false);
    expect(state.lifecycle).toBe("sold_out");
    expect(state.primaryCta?.labelKey).toBe("analytics.detail.cta.openSecondary");
    expect(state.primaryCta?.disabled).toBeFalsy();
  });

  it("enables buy CTA for active primary with available units", () => {
    const detail = baseDetail({
      user: {
        userUnits: "0",
        userPayoutsReceived: null,
        userPendingOrders: 0,
        avgEntryPrice: null,
      },
      identity: {
        ...baseDetail().identity,
        lifecycleStatus: "active_primary",
      },
      primaryRound: {
        ...baseDetail().primaryRound,
        soldUnits: "40",
        availableUnits: "60",
        canBuyPrimary: true,
        primaryBlockingReason: null,
      },
    });
    const state = buildReleaseDetailPageState(detail);
    expect(state.lifecycle).toBe("active_primary");
    expect(state.canBuyPrimary).toBe(true);
    expect(state.primaryCta?.labelKey).toBe("analytics.detail.cta.buyUnits");
  });

  it("shows login CTA for guest on active primary", () => {
    const detail = baseDetail({
      identity: {
        ...baseDetail().identity,
        lifecycleStatus: "active_primary",
      },
      primaryRound: {
        ...baseDetail().primaryRound,
        soldUnits: "10",
        availableUnits: "90",
        canBuyPrimary: true,
      },
    });
    const state = buildReleaseDetailPageState(detail);
    expect(state.isGuest).toBe(true);
    expect(state.primaryCta?.labelKey).toBe("analytics.detail.cta.loginToBuy");
  });
});
