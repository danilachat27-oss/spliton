export type HoldingLockReason =
  | "active_listing"
  | "pending_trade"
  | "compliance_freeze"
  | "settlement"
  | "unknown"
  | null;

export type AdminHoldingListItem = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  userStatus: string;
  trackId: string;
  trackTitle: string;
  trackArtist: string;
  trackCoverUrl: string | null;
  trackStatus: string;
  totalUnits: string;
  availableUnits: string;
  lockedUnits: string;
  lockReason: HoldingLockReason;
  averagePriceUsdt: string;
  currentValueUsdt: string;
  earnedTotalUsdt: string;
  ownershipPct: string;
  activeListingsCount: number;
  hasRiskFlag: boolean;
  riskSeverity: string | null;
  lastActivityAt: string;
};

export type AdminHoldingSummary = {
  totalHolders: number;
  totalUnits: string;
  availableUnits: string;
  lockedUnits: string;
  totalCurrentValueUsdt: string;
  totalEarnedUsdt: string;
  activeListingsCount: number;
  holdingsWithRiskFlags: number;
};

export type AdminHoldingHistoryItem = {
  id: string;
  happenedAt: string;
  eventType: string;
  unitsDelta: string;
  pricePerUnit: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  status: string;
};

export type AdminHoldingDistributionItem = {
  id: string;
  distributionId: string;
  amountNet: string;
  amountGross: string;
  status: string;
  walletTxId: string | null;
  createdAt: string;
};

export type AdminHoldingMarketItem = {
  id: string;
  kind: "listing" | "trade";
  side: string | null;
  pricePerUnit: string;
  units: string;
  feeUsdt: string | null;
  counterpartyEmail: string | null;
  status: string;
  happenedAt: string;
};

export type AdminHoldingWalletItem = {
  id: string;
  txType: string;
  direction: string;
  amount: string;
  netAmount: string;
  status: string;
  happenedAt: string;
  referenceType: string | null;
  referenceId: string | null;
};

export type AdminHoldingRiskItem = {
  id: string;
  flagCode: string;
  severity: string;
  status: string;
  note: string | null;
  createdAt: string;
};

export type AdminHoldingDetail = AdminHoldingListItem & {
  history?: AdminHoldingHistoryItem[];
  distributions?: AdminHoldingDistributionItem[];
  market?: AdminHoldingMarketItem[];
  wallet?: AdminHoldingWalletItem[];
  risk?: AdminHoldingRiskItem[];
};

export const MOCK_ADMIN_HOLDINGS_SUMMARY: AdminHoldingSummary = {
  totalHolders: 3,
  totalUnits: "1520",
  availableUnits: "1310",
  lockedUnits: "210",
  totalCurrentValueUsdt: "7904.00",
  totalEarnedUsdt: "420.50",
  activeListingsCount: 2,
  holdingsWithRiskFlags: 1,
};

export const MOCK_ADMIN_HOLDINGS: AdminHoldingListItem[] = [
  {
    id: "hld-001",
    userId: "usr-101",
    userEmail: "nova.holder@spliton.demo",
    userDisplayName: "Nova Holder",
    userStatus: "active",
    trackId: "trk-001",
    trackTitle: "Midnight Run",
    trackArtist: "Nova Pulse",
    trackCoverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    trackStatus: "active",
    totalUnits: "450",
    availableUnits: "400",
    lockedUnits: "50",
    lockReason: "active_listing",
    averagePriceUsdt: "5.20",
    currentValueUsdt: "2340.00",
    earnedTotalUsdt: "180.00",
    ownershipPct: "4.50",
    activeListingsCount: 1,
    hasRiskFlag: false,
    riskSeverity: null,
    lastActivityAt: "2026-05-28T14:22:00.000Z",
  },
  {
    id: "hld-002",
    userId: "usr-102",
    userEmail: "lumen@spliton.demo",
    userDisplayName: "Lumen",
    userStatus: "active",
    trackId: "trk-002",
    trackTitle: "Glass Horizon",
    trackArtist: "Lumen",
    trackCoverUrl: null,
    trackStatus: "active",
    totalUnits: "820",
    availableUnits: "720",
    lockedUnits: "100",
    lockReason: "settlement",
    averagePriceUsdt: "4.80",
    currentValueUsdt: "3936.00",
    earnedTotalUsdt: "210.50",
    ownershipPct: "10.25",
    activeListingsCount: 0,
    hasRiskFlag: false,
    riskSeverity: null,
    lastActivityAt: "2026-05-27T09:15:00.000Z",
  },
  {
    id: "hld-003",
    userId: "usr-103",
    userEmail: "risk.watch@spliton.demo",
    userDisplayName: null,
    userStatus: "active",
    trackId: "trk-001",
    trackTitle: "Midnight Run",
    trackArtist: "Nova Pulse",
    trackCoverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    trackStatus: "active",
    totalUnits: "250",
    availableUnits: "190",
    lockedUnits: "60",
    lockReason: "compliance_freeze",
    averagePriceUsdt: "6.10",
    currentValueUsdt: "1525.00",
    earnedTotalUsdt: "30.00",
    ownershipPct: "2.50",
    activeListingsCount: 0,
    hasRiskFlag: true,
    riskSeverity: "high",
    lastActivityAt: "2026-05-20T18:42:00.000Z",
  },
];

export const MOCK_ADMIN_HOLDING_DETAIL: AdminHoldingDetail = {
  ...MOCK_ADMIN_HOLDINGS[0]!,
  history: [
    {
      id: "ol-1",
      happenedAt: "2026-05-28T14:22:00.000Z",
      eventType: "listing_lock",
      unitsDelta: "-50",
      pricePerUnit: "5.20",
      relatedEntityType: "trade",
      relatedEntityId: "lst-001",
      status: "completed",
    },
    {
      id: "ol-2",
      happenedAt: "2026-03-01T10:00:00.000Z",
      eventType: "primary_purchase",
      unitsDelta: "450",
      pricePerUnit: "5.20",
      relatedEntityType: "wallet_tx",
      relatedEntityId: "wtx-001",
      status: "completed",
    },
  ],
  distributions: [
    {
      id: "pay-1",
      distributionId: "dist-001",
      amountNet: "90.00",
      amountGross: "100.00",
      status: "paid",
      walletTxId: "wtx-payout-1",
      createdAt: "2026-04-15T12:00:00.000Z",
    },
  ],
  market: [
    {
      id: "lst-001",
      kind: "listing",
      side: "sell",
      pricePerUnit: "5.80",
      units: "50",
      feeUsdt: null,
      counterpartyEmail: null,
      status: "active",
      happenedAt: "2026-05-28T14:22:00.000Z",
    },
  ],
  wallet: [
    {
      id: "wtx-001",
      txType: "trade_settlement",
      direction: "out",
      amount: "2340.00",
      netAmount: "2340.00",
      status: "completed",
      happenedAt: "2026-03-01T10:00:00.000Z",
      referenceType: "order",
      referenceId: "ord-001",
    },
  ],
  risk: [],
};
