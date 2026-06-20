/** Admin platform revenue — mock data (mock mode only). */

export type PlatformRevenueSourceKey =
  | "primary_purchase_fee"
  | "withdrawal_fee"
  | "secondary_market_fee"
  | "premium"
  | "private_deals"
  | "manual";

export type PlatformRevenueSummary = {
  totalUsdt: string;
  periodUsdt: string;
  previousPeriodUsdt: string;
  deltaPct: number | null;
  transactionCount: number;
  avgFeeUsdt: string | null;
  pendingCount: number;
  failedCount: number;
  bySource: PlatformRevenueSourceRow[];
  lastUpdatedAt: string | null;
};

export type PlatformRevenueSourceRow = {
  source: string;
  amountUsdt: string;
  sharePct: string;
  operationCount: number;
  avgAmountUsdt: string;
  deltaPct: number | null;
};

export type PlatformRevenuePeriodPoint = {
  period: string;
  amountUsdt: string;
  count: number;
  bySource?: Record<string, string>;
};

export type AdminPlatformRevenueTransaction = {
  id: string;
  source: string;
  amountUsdt: string;
  asset: string;
  period: string;
  createdAt: string;
  status: string;
  userId: string | null;
  userEmail: string | null;
  subjectType: string;
  subjectId: string | null;
  releaseId: string | null;
  releaseTitle: string | null;
  walletTxId: string | null;
};

export type PlatformRevenueReleaseRow = {
  releaseId: string;
  releaseTitle: string;
  artistName: string | null;
  roundId: string | null;
  primaryFeeUsdt: string;
  secondaryFeeUsdt: string;
  withdrawalFeeUsdt: string;
  totalFeeUsdt: string;
  purchaseCount: number;
  tradeCount: number;
};

export type PlatformFeeSettings = {
  primaryPurchaseFeePct: string;
  withdrawalFeeUsdt: string;
  withdrawalFeePct: string | null;
  secondaryMarketFeePct: string;
  premiumMonthlyUsdt: string;
  effectiveFrom: string;
  updatedAt?: string;
  createdByEmail: string | null;
  updatedByEmail: string | null;
};

export type PlatformFeeHistoryRow = {
  id: string;
  primaryPurchaseFeePct: string;
  withdrawalFeeUsdt: string;
  secondaryMarketFeePct: string;
  premiumMonthlyUsdt: string;
  effectiveFrom: string;
  isActive: boolean;
  createdByEmail: string | null;
  updatedByEmail: string | null;
  createdAt: string;
};

export type AdminPlatformRevenueTransactionDetail = AdminPlatformRevenueTransaction & {
  rate: string | null;
  fixedAmount: string | null;
  audit?: Array<{
    id: string;
    action: string;
    actorEmail: string | null;
    before: unknown;
    after: unknown;
    createdAt: string;
  }>;
};

/** @deprecated use AdminPlatformRevenueTransaction */
export type AdminPlatformRevenueRow = AdminPlatformRevenueTransaction;

export const MOCK_PLATFORM_REVENUE_SUMMARY: PlatformRevenueSummary = {
  totalUsdt: "28460.00",
  periodUsdt: "14460.00",
  previousPeriodUsdt: "12100.00",
  deltaPct: 19.5,
  transactionCount: 186,
  avgFeeUsdt: "77.74",
  pendingCount: 0,
  failedCount: 0,
  bySource: [
    {
      source: "primary_purchase_fee",
      amountUsdt: "12400.00",
      sharePct: "85.8",
      operationCount: 42,
      avgAmountUsdt: "295.24",
      deltaPct: 12.3,
    },
    {
      source: "secondary_market_fee",
      amountUsdt: "1240.00",
      sharePct: "8.6",
      operationCount: 28,
      avgAmountUsdt: "44.29",
      deltaPct: 8.1,
    },
    {
      source: "withdrawal_fee",
      amountUsdt: "820.00",
      sharePct: "5.7",
      operationCount: 116,
      avgAmountUsdt: "7.07",
      deltaPct: -3.2,
    },
  ],
  lastUpdatedAt: "2026-05-30T18:42:00Z",
};

export const MOCK_PLATFORM_REVENUE_TRANSACTIONS: AdminPlatformRevenueTransaction[] = [
  {
    id: "fee-demo-001",
    source: "primary_purchase_fee",
    amountUsdt: "62.50",
    asset: "USDT",
    period: "2026-05-30",
    createdAt: "2026-05-30T14:20:00Z",
    status: "completed",
    userId: "usr-demo-001",
    userEmail: "investor@spliton.demo",
    subjectType: "primary_order",
    subjectId: "round-demo-001",
    releaseId: "rel-demo-northern-lights",
    releaseTitle: "Northern Lights",
    walletTxId: "wtx-fee-001",
  },
  {
    id: "fee-demo-002",
    source: "withdrawal_fee",
    amountUsdt: "5.00",
    asset: "USDT",
    period: "2026-05-29",
    createdAt: "2026-05-29T09:15:00Z",
    status: "completed",
    userId: "usr-demo-002",
    userEmail: "holder@spliton.demo",
    subjectType: "withdrawal",
    subjectId: "wd-demo-001",
    releaseId: null,
    releaseTitle: null,
    walletTxId: "wtx-fee-002",
  },
  {
    id: "fee-demo-003",
    source: "secondary_market_fee",
    amountUsdt: "12.40",
    asset: "USDT",
    period: "2026-05-28",
    createdAt: "2026-05-28T16:00:00Z",
    status: "completed",
    userId: "usr-demo-003",
    userEmail: "trader@spliton.demo",
    subjectType: "secondary_trade",
    subjectId: "lst-demo-001",
    releaseId: "rel-demo-echo-chamber",
    releaseTitle: "Echo Chamber",
    walletTxId: "wtx-fee-003",
  },
];

export const MOCK_PLATFORM_REVENUE_PERIODS: PlatformRevenuePeriodPoint[] = [
  {
    period: "2026-05-24",
    amountUsdt: "1200.00",
    count: 12,
    bySource: { primary_purchase_fee: "900.00", withdrawal_fee: "200.00", secondary_market_fee: "100.00" },
  },
  {
    period: "2026-05-25",
    amountUsdt: "980.00",
    count: 10,
    bySource: { primary_purchase_fee: "700.00", withdrawal_fee: "180.00", secondary_market_fee: "100.00" },
  },
  {
    period: "2026-05-26",
    amountUsdt: "1450.00",
    count: 15,
    bySource: { primary_purchase_fee: "1100.00", withdrawal_fee: "200.00", secondary_market_fee: "150.00" },
  },
  {
    period: "2026-05-27",
    amountUsdt: "2100.00",
    count: 22,
    bySource: { primary_purchase_fee: "1600.00", withdrawal_fee: "300.00", secondary_market_fee: "200.00" },
  },
  {
    period: "2026-05-28",
    amountUsdt: "1890.00",
    count: 18,
    bySource: { primary_purchase_fee: "1400.00", withdrawal_fee: "290.00", secondary_market_fee: "200.00" },
  },
  {
    period: "2026-05-29",
    amountUsdt: "2340.00",
    count: 24,
    bySource: { primary_purchase_fee: "1800.00", withdrawal_fee: "340.00", secondary_market_fee: "200.00" },
  },
  {
    period: "2026-05-30",
    amountUsdt: "4500.00",
    count: 35,
    bySource: { primary_purchase_fee: "3600.00", withdrawal_fee: "500.00", secondary_market_fee: "400.00" },
  },
];

export const MOCK_PLATFORM_REVENUE_RELEASES: PlatformRevenueReleaseRow[] = [
  {
    releaseId: "rel-demo-northern-lights",
    releaseTitle: "Northern Lights",
    artistName: "Aurora Wave",
    roundId: "round-demo-001",
    primaryFeeUsdt: "8200.00",
    secondaryFeeUsdt: "640.00",
    withdrawalFeeUsdt: "0",
    totalFeeUsdt: "8840.00",
    purchaseCount: 38,
    tradeCount: 12,
  },
  {
    releaseId: "rel-demo-echo-chamber",
    releaseTitle: "Echo Chamber",
    artistName: "Static Bloom",
    roundId: "round-demo-002",
    primaryFeeUsdt: "4200.00",
    secondaryFeeUsdt: "600.00",
    withdrawalFeeUsdt: "0",
    totalFeeUsdt: "4800.00",
    purchaseCount: 22,
    tradeCount: 9,
  },
];

export const MOCK_PLATFORM_FEE_SETTINGS: PlatformFeeSettings = {
  primaryPurchaseFeePct: "2.5",
  withdrawalFeeUsdt: "5.00",
  withdrawalFeePct: null,
  secondaryMarketFeePct: "1.0",
  premiumMonthlyUsdt: "0",
  effectiveFrom: "2026-05-01T00:00:00Z",
  updatedAt: "2026-05-01T00:00:00Z",
  createdByEmail: "finance@spliton.demo",
  updatedByEmail: "finance@spliton.demo",
};

export const MOCK_PLATFORM_FEE_HISTORY: PlatformFeeHistoryRow[] = [
  {
    id: "pfs-demo-002",
    primaryPurchaseFeePct: "2.5",
    withdrawalFeeUsdt: "5.00",
    secondaryMarketFeePct: "1.0",
    premiumMonthlyUsdt: "0",
    effectiveFrom: "2026-05-01T00:00:00Z",
    isActive: true,
    createdByEmail: "finance@spliton.demo",
    updatedByEmail: "finance@spliton.demo",
    createdAt: "2026-05-01T00:00:00Z",
  },
  {
    id: "pfs-demo-001",
    primaryPurchaseFeePct: "3.0",
    withdrawalFeeUsdt: "5.00",
    secondaryMarketFeePct: "1.5",
    premiumMonthlyUsdt: "0",
    effectiveFrom: "2026-01-01T00:00:00Z",
    isActive: false,
    createdByEmail: "ops@spliton.demo",
    updatedByEmail: "ops@spliton.demo",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

export const MOCK_PLATFORM_REVENUE_TX_DETAIL: AdminPlatformRevenueTransactionDetail = {
  ...MOCK_PLATFORM_REVENUE_TRANSACTIONS[0]!,
  rate: "2.5",
  fixedAmount: null,
  audit: [
    {
      id: "aud-fee-001",
      action: "fee.recorded",
      actorEmail: "system",
      before: null,
      after: { amountUsdt: "62.50" },
      createdAt: "2026-05-30T14:20:00Z",
    },
  ],
};
