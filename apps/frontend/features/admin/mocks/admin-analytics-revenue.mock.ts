/** Revenue distribution analytics mocks — mock mode only (Spliton). */

function days(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const PERIODS = days(14);

export const MOCK_REVENUE_ANALYTICS_SUMMARY = {
  period: { from: PERIODS[0]!, to: PERIODS[PERIODS.length - 1]! },
  revenueEventsCount: 24,
  grossRevenueUsdt: "482 400,00",
  avgRevenueEventUsdt: "20 100,00",
  eventsWithoutDistribution: 3,
  distributedToHoldersUsdt: "312 800,00",
  distributedUsdt: "312 800,00",
  platformShareUsdt: "72 360,00",
  artistShareUsdt: "72 360,00",
  holdersShareUsdt: "337 680,00",
  completedDistributions: 18,
  processingDistributions: 2,
  failedDistributions: 2,
  failedCount: 2,
  payoutHoldersCount: 412,
  avgPayoutPerHolderUsdt: "759,22",
  averagePayoutUsdt: "759,22",
  maxPayoutUsdt: "12 400,00",
  pendingPayouts: 5,
  ledgerMismatchCount: 0,
  pendingEvents: 3,
  deltas: { grossPct: 11.2, distributedPct: 9.4, eventsPct: 4.0 },
};

export const MOCK_REVENUE_ANALYTICS_EVENTS = {
  items: PERIODS.map((period, i) => ({
    period,
    count: 1 + (i % 3),
    amountUsdt: (18000 + i * 2400).toLocaleString("ru-RU", { minimumFractionDigits: 2 }),
  })),
};

export const MOCK_REVENUE_ANALYTICS_DISTRIBUTIONS = {
  byStatus: [
    { status: "completed", count: 18, amountUsdt: "312 800,00" },
    { status: "preview", count: 2, amountUsdt: "0,00" },
    { status: "failed", count: 2, amountUsdt: "1 240,00" },
    { status: "processing", count: 5, amountUsdt: "4 800,00" },
  ],
  items: [
    { status: "completed", count: 18, amountUsdt: "312 800,00" },
    { status: "failed", count: 2, amountUsdt: "1 240,00" },
  ],
};

export const MOCK_REVENUE_ANALYTICS_BY_TRACK = {
  items: [
    {
      trackId: "r1",
      trackTitle: "Glass Horizon",
      artistName: "Arctic Line",
      grossRevenueUsdt: "200 000,00",
      holdersPayoutUsdt: "140 000,00",
      artistShareUsdt: "30 000,00",
      platformShareUsdt: "30 000,00",
      payoutsCount: 890,
      failedItems: 0,
      lastDistributionAt: new Date().toISOString(),
      status: "distributed",
      amountUsdt: "140 000,00",
    },
  ],
};

export const MOCK_REVENUE_ANALYTICS_PAYOUTS = {
  items: PERIODS.map((period, i) => ({
    period,
    amountUsdt: (12000 + i * 1800).toLocaleString("ru-RU", { minimumFractionDigits: 2 }),
    holdersCount: 28 + i,
    payoutItems: 32 + i,
  })),
};

export const MOCK_REVENUE_ANALYTICS_PIPELINE = {
  stages: [
    { key: "created", label: "Revenue event создан", count: 24, amountUsdt: "482 400,00" },
    { key: "preview", label: "Preview рассчитан", count: 5, amountUsdt: null },
    { key: "distribution", label: "Distribution запущен", count: 21, amountUsdt: null },
    { key: "wallet", label: "Wallet ledger начислен", count: 412, amountUsdt: null },
    { key: "completed", label: "Completed", count: 18, amountUsdt: null },
    { key: "failed", label: "Failed / manual review", count: 2, amountUsdt: null },
  ],
};

export const MOCK_REVENUE_ANALYTICS_SPLIT = {
  holdersShareUsdt: "337 680,00",
  artistShareUsdt: "72 360,00",
  platformShareUsdt: "72 360,00",
  grossRevenueUsdt: "482 400,00",
  holdersPct: 70,
  artistPct: 15,
  platformPct: 15,
};

export const MOCK_REVENUE_ANALYTICS_TOP_HOLDERS = {
  items: [
    { userId: "u1", email: "holder@spliton.test", totalPayoutUsdt: "12 400,00", payoutCount: 8, releasesCount: 3, riskStatus: "none" },
    { userId: "u2", email: "investor@spliton.test", totalPayoutUsdt: "8 200,00", payoutCount: 5, releasesCount: 2, riskStatus: "none" },
  ],
};

export const MOCK_REVENUE_ANALYTICS_FAILED = {
  items: [
    {
      payoutId: "p1",
      distributionId: "d1",
      releaseId: "r2",
      releaseTitle: "Echo Chamber",
      amountUsdt: "620,00",
      reason: "payout_failed",
      status: "failed",
      retryAvailable: true,
      lastAttemptAt: new Date().toISOString(),
    },
  ],
};

export const MOCK_REVENUE_ANALYTICS_RECONCILIATION = {
  matched: true,
  payoutItemsCount: 412,
  payoutSumUsdt: "312 800,00",
  ledgerTxCount: 412,
  ledgerSumUsdt: "312 800,00",
  missingWalletTxCount: 0,
  mismatchedAmountUsdt: "0,00",
  lastCheckedAt: new Date().toISOString(),
};
