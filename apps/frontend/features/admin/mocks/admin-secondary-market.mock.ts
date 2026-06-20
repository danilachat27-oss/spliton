/** Admin secondary market — mock data (mock mode only). */

export type AdminListingStatus = "active" | "completed" | "cancelled" | "frozen";

export type AdminListingListItem = {
  id: string;
  sellerId: string;
  sellerEmail: string;
  sellerStatus: string;
  releaseId: string;
  trackTitle: string;
  artistName: string | null;
  coverUrl: string | null;
  releaseStatus: string;
  units: string;
  unitsTotal: string;
  lockedUnits: string;
  pricePerUnitUsdt: string;
  totalPriceUsdt: string;
  platformFeeEstimateUsdt: string;
  status: AdminListingStatus;
  hasRisk: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
};

export type AdminTradeStatus = "pending" | "completed" | "failed" | "suspicious";

export type AdminTradeListItem = {
  id: string;
  listingId: string | null;
  sellerId: string;
  sellerEmail: string;
  buyerId: string;
  buyerEmail: string;
  releaseId: string;
  trackTitle: string;
  artistName: string | null;
  coverUrl: string | null;
  units: string;
  pricePerUnitUsdt: string;
  priceUsdt: string;
  feeUsdt: string;
  status: AdminTradeStatus;
  settlementStatus: string;
  suspicious: boolean;
  completedAt: string;
  createdAt: string;
};

export type AdminSecondaryMarketSummary = {
  activeListingsCount: number;
  unitsListed: string;
  lockedUnits: string;
  tradeVolumeUsdt: string;
  completedTradesCount: number;
  avgPricePerUnitUsdt: string | null;
  avgTradeSizeUsdt: string | null;
  platformFeesUsdt: string;
  suspiciousCount: number;
  frozenListingsCount: number;
  cancelledListingsCount: number;
  deltaVolumePct: number | null;
  topReleases: Array<{ releaseId: string; releaseTitle: string; tradeCount: number; volumeUsdt: string }>;
};

export type AdminSecondaryMarketLiquidity = {
  volumeByDay: Array<{ period: string; volumeUsdt: string; tradeCount: number }>;
  activeListingsByRelease: Array<{
    releaseId: string;
    releaseTitle: string;
    listingCount: number;
    unitsListed: string;
    totalUnits: string;
    listedPct: number | null;
    avgPricePerUnitUsdt: string | null;
  }>;
  priceChanges: Array<{ releaseId: string; executedAt: string; pricePerUnitUsdt: string; units: string }>;
};

export type AdminSecondaryMarketFees = {
  totalFeesUsdt: string;
  byRelease: Array<{ releaseId: string; releaseTitle: string; feeUsdt: string }>;
  transactions: Array<{
    id: string;
    walletTransactionId: string | null;
    subjectId: string | null;
    amountUsdt: string;
    createdAt: string;
  }>;
};

export type AdminListingTradeRow = {
  id: string;
  buyerEmail: string;
  sellerEmail: string;
  units: string;
  amountUsdt: string;
  feeUsdt: string;
  status: string;
  completedAt: string;
};

export type AdminListingLedgerRow = {
  id: string;
  txType: string;
  direction: string;
  amountUsdt: string;
  status: string;
  createdAt: string;
};

export type AdminListingDetail = AdminListingListItem & {
  trades?: AdminListingTradeRow[];
  ledger?: AdminListingLedgerRow[];
  risk?: {
    score: number | null;
    frozen: boolean;
    flags: Array<{ code: string; severity: string; note: string | null; createdAt: string }>;
  };
  audit?: Array<{
    id: string;
    action: string;
    actorEmail: string | null;
    actorRole: string;
    before: unknown;
    after: unknown;
    createdAt: string;
  }>;
  unitsDetail?: {
    unitsTotal: string;
    unitsAvailable: string;
    lockedUnits: string;
    lockedReason: string;
  };
};

export type AdminTradeDetail = AdminTradeListItem & {
  settlement?: {
    buyerDebit?: unknown;
    sellerCredit?: unknown;
    feeTx?: unknown;
    unitTransfer?: { units: string; releaseId: string };
    settlementStatus: string;
  };
  ledger?: AdminListingLedgerRow[];
  risk?: {
    suspicious: boolean;
    flags: Array<{ code: string; severity: string; note: string | null; createdAt: string }>;
    highValue: boolean;
  };
  audit?: AdminListingDetail["audit"];
};

const RELEASE_1 = {
  releaseId: "rel-demo-neon-pulse",
  trackTitle: "Neon Pulse",
  artistName: "Spliton Demo Artist",
  coverUrl: null,
};

export const MOCK_ADMIN_SECONDARY_SUMMARY: AdminSecondaryMarketSummary = {
  activeListingsCount: 2,
  unitsListed: "120",
  lockedUnits: "120",
  tradeVolumeUsdt: "4 640,00",
  completedTradesCount: 8,
  avgPricePerUnitUsdt: "5,80",
  avgTradeSizeUsdt: "580,00",
  platformFeesUsdt: "46,40",
  suspiciousCount: 1,
  frozenListingsCount: 1,
  cancelledListingsCount: 2,
  deltaVolumePct: 12.5,
  topReleases: [
    {
      releaseId: RELEASE_1.releaseId,
      releaseTitle: RELEASE_1.trackTitle,
      tradeCount: 5,
      volumeUsdt: "2 900,00",
    },
    {
      releaseId: "rel-demo-midnight-echo",
      releaseTitle: "Midnight Echo",
      tradeCount: 3,
      volumeUsdt: "1 740,00",
    },
  ],
};

export const MOCK_ADMIN_LISTINGS: AdminListingListItem[] = [
  {
    id: "lst-demo-001",
    sellerId: "usr-demo-seller",
    sellerEmail: "seller@spliton.demo",
    sellerStatus: "active",
    ...RELEASE_1,
    releaseStatus: "active",
    units: "50",
    unitsTotal: "50",
    lockedUnits: "50",
    pricePerUnitUsdt: "5.80",
    totalPriceUsdt: "290.00",
    platformFeeEstimateUsdt: "2.90",
    status: "active",
    hasRisk: false,
    isLocked: true,
    createdAt: "2026-05-29T03:00:00Z",
    updatedAt: "2026-05-29T03:00:00Z",
    expiresAt: null,
  },
  {
    id: "lst-demo-002",
    sellerId: "usr-demo-trader",
    sellerEmail: "trader@spliton.demo",
    sellerStatus: "active",
    releaseId: "rel-demo-midnight-echo",
    trackTitle: "Midnight Echo",
    artistName: "Spliton Demo Artist",
    coverUrl: null,
    releaseStatus: "active",
    units: "70",
    unitsTotal: "70",
    lockedUnits: "70",
    pricePerUnitUsdt: "6.20",
    totalPriceUsdt: "434.00",
    platformFeeEstimateUsdt: "4.34",
    status: "frozen",
    hasRisk: true,
    isLocked: true,
    createdAt: "2026-05-28T10:00:00Z",
    updatedAt: "2026-05-30T08:00:00Z",
    expiresAt: null,
  },
  {
    id: "lst-demo-003",
    sellerId: "usr-demo-seller",
    sellerEmail: "seller@spliton.demo",
    sellerStatus: "active",
    releaseId: "rel-demo-neon-pulse",
    trackTitle: "Neon Pulse",
    artistName: "Spliton Demo Artist",
    coverUrl: null,
    releaseStatus: "active",
    units: "0",
    unitsTotal: "30",
    lockedUnits: "0",
    pricePerUnitUsdt: "5.50",
    totalPriceUsdt: "0.00",
    platformFeeEstimateUsdt: "0.00",
    status: "cancelled",
    hasRisk: false,
    isLocked: false,
    createdAt: "2026-05-20T12:00:00Z",
    updatedAt: "2026-05-21T12:00:00Z",
    expiresAt: null,
  },
];

export const MOCK_ADMIN_TRADES: AdminTradeListItem[] = [
  {
    id: "trd-demo-001",
    listingId: "lst-demo-001",
    sellerId: "usr-demo-seller",
    sellerEmail: "seller@spliton.demo",
    buyerId: "usr-demo-buyer",
    buyerEmail: "buyer@spliton.demo",
    ...RELEASE_1,
    units: "20",
    pricePerUnitUsdt: "5.80",
    priceUsdt: "116.00",
    feeUsdt: "1.16",
    status: "completed",
    settlementStatus: "settled",
    suspicious: false,
    completedAt: "2026-05-28T14:00:00Z",
    createdAt: "2026-05-28T14:00:00Z",
  },
  {
    id: "trd-demo-002",
    listingId: "lst-demo-002",
    sellerId: "usr-demo-trader",
    sellerEmail: "trader@spliton.demo",
    buyerId: "usr-demo-whale",
    buyerEmail: "whale@spliton.demo",
    releaseId: "rel-demo-midnight-echo",
    trackTitle: "Midnight Echo",
    artistName: "Spliton Demo Artist",
    coverUrl: null,
    units: "100",
    pricePerUnitUsdt: "6.20",
    priceUsdt: "620.00",
    feeUsdt: "6.20",
    status: "suspicious",
    settlementStatus: "settled",
    suspicious: true,
    completedAt: "2026-05-27T09:30:00Z",
    createdAt: "2026-05-27T09:30:00Z",
  },
];

export const MOCK_ADMIN_SECONDARY_LIQUIDITY: AdminSecondaryMarketLiquidity = {
  volumeByDay: [
    { period: "2026-05-25", volumeUsdt: "580,00", tradeCount: 1 },
    { period: "2026-05-26", volumeUsdt: "1 160,00", tradeCount: 2 },
    { period: "2026-05-27", volumeUsdt: "620,00", tradeCount: 1 },
    { period: "2026-05-28", volumeUsdt: "1 740,00", tradeCount: 3 },
    { period: "2026-05-29", volumeUsdt: "540,00", tradeCount: 1 },
  ],
  activeListingsByRelease: [
    {
      releaseId: RELEASE_1.releaseId,
      releaseTitle: RELEASE_1.trackTitle,
      listingCount: 1,
      unitsListed: "50",
      totalUnits: "1000",
      listedPct: 5,
      avgPricePerUnitUsdt: "5,80",
    },
    {
      releaseId: "rel-demo-midnight-echo",
      releaseTitle: "Midnight Echo",
      listingCount: 1,
      unitsListed: "70",
      totalUnits: "800",
      listedPct: 8.8,
      avgPricePerUnitUsdt: "6,20",
    },
  ],
  priceChanges: MOCK_ADMIN_TRADES.map((t) => ({
    releaseId: t.releaseId,
    executedAt: t.completedAt,
    pricePerUnitUsdt: t.pricePerUnitUsdt.replace(".", ","),
    units: t.units,
  })),
};

export const MOCK_ADMIN_SECONDARY_FEES: AdminSecondaryMarketFees = {
  totalFeesUsdt: "46,40",
  byRelease: [
    { releaseId: RELEASE_1.releaseId, releaseTitle: RELEASE_1.trackTitle, feeUsdt: "29,00" },
    { releaseId: "rel-demo-midnight-echo", releaseTitle: "Midnight Echo", feeUsdt: "17,40" },
  ],
  transactions: [
    {
      id: "fee-demo-001",
      walletTransactionId: "wtx-demo-fee-001",
      subjectId: "lst-demo-001",
      amountUsdt: "1,16",
      createdAt: "2026-05-28T14:00:00Z",
    },
  ],
};

export function mockListingDetail(id: string): AdminListingDetail | null {
  const base = MOCK_ADMIN_LISTINGS.find((l) => l.id === id);
  if (!base) return null;
  return {
    ...base,
    trades: MOCK_ADMIN_TRADES.filter((t) => t.listingId === id).map((t) => ({
      id: t.id,
      buyerEmail: t.buyerEmail,
      sellerEmail: t.sellerEmail,
      units: t.units,
      amountUsdt: t.priceUsdt,
      feeUsdt: t.feeUsdt,
      status: t.status,
      completedAt: t.completedAt,
    })),
    ledger: [
      {
        id: "wtx-demo-lock-001",
        txType: "HOLD",
        direction: "OUT",
        amountUsdt: base.totalPriceUsdt,
        status: "completed",
        createdAt: base.createdAt,
      },
    ],
    risk: {
      score: base.hasRisk ? 75 : null,
      frozen: base.status === "frozen",
      flags: base.hasRisk
        ? [{ code: "FROZEN_LISTING", severity: "medium", note: "Compliance review", createdAt: base.updatedAt }]
        : [],
    },
    audit: [
      {
        id: "aud-demo-lst-001",
        action: "listing.create",
        actorEmail: base.sellerEmail,
        actorRole: "USER",
        before: null,
        after: { status: "active" },
        createdAt: base.createdAt,
      },
    ],
    unitsDetail: {
      unitsTotal: base.unitsTotal,
      unitsAvailable: base.units,
      lockedUnits: base.lockedUnits,
      lockedReason: base.status === "frozen" ? "frozen_by_operator" : "listed_for_sale",
    },
  };
}

export function mockTradeDetail(id: string): AdminTradeDetail | null {
  const base = MOCK_ADMIN_TRADES.find((t) => t.id === id);
  if (!base) return null;
  return {
    ...base,
    settlement: {
      settlementStatus: base.settlementStatus,
      unitTransfer: { units: base.units, releaseId: base.releaseId },
    },
    ledger: [
      {
        id: "wtx-demo-buy-001",
        txType: "TRADE_SETTLEMENT",
        direction: "OUT",
        amountUsdt: base.priceUsdt,
        status: "completed",
        createdAt: base.completedAt,
      },
      {
        id: "wtx-demo-fee-001",
        txType: "FEE",
        direction: "OUT",
        amountUsdt: base.feeUsdt,
        status: "completed",
        createdAt: base.completedAt,
      },
    ],
    risk: {
      suspicious: base.suspicious,
      highValue: Number(base.priceUsdt) >= 500,
      flags: base.suspicious
        ? [{ code: "SUSPICIOUS_TRADE", severity: "high", note: "Repeated high-value pattern", createdAt: base.completedAt }]
        : [],
    },
    audit: [
      {
        id: "aud-demo-trd-001",
        action: "trade.complete",
        actorEmail: null,
        actorRole: "SYSTEM",
        before: null,
        after: { status: "settled" },
        createdAt: base.completedAt,
      },
    ],
  };
}
