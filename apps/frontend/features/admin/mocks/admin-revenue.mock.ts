/** Admin revenue events — mock data (mock mode only). */

export type AdminRevenueEventStatus =
  | "draft"
  | "calculated"
  | "preview"
  | "review"
  | "approved"
  | "paid"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "manual_review";

export type AdminRevenueSource =
  | "streaming"
  | "distributor"
  | "license"
  | "manual"
  | "import"
  | "other";

export type AdminRevenueSummary = {
  totalGrossRevenueUsdt: string;
  distributedToHoldersUsdt: string;
  platformShareUsdt: string;
  artistShareUsdt: string;
  pendingCount: number;
  processingCount: number;
  failedCount: number;
  avgPayoutPerHolderUsdt: string | null;
  activeEventsCount: number;
};

export type AdminRevenueListItem = {
  id: string;
  trackId: string;
  trackTitle: string;
  artistName: string | null;
  coverUrl: string | null;
  releaseStatus: string;
  periodFrom: string;
  periodTo: string;
  source: string;
  grossRevenueUsdt: string;
  holdersShareUsdt: string;
  artistShareUsdt: string;
  platformShareUsdt: string;
  distributedAmountUsdt: string;
  holdersCount: number;
  status: AdminRevenueEventStatus;
  distributionId: string | null;
  errorMessage: string | null;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type AdminRevenuePreviewHolder = {
  userId: string;
  userEmail: string;
  units: string;
  percentage: string;
  payoutAmount: string;
  walletId: string | null;
  availableBalance: string;
};

export type AdminRevenuePreview = {
  revenueEventId: string;
  trackTitle: string;
  grossRevenue: string;
  platformAmount: string;
  artistAmount: string;
  holdersAmount: string;
  holderSharePct?: string;
  platformSharePct?: string;
  artistSharePct?: string;
  totalUnits: string;
  participatingUnits: string;
  holdersCount: number;
  holdersTotalAllocated?: string;
  roundingDelta?: string;
  reconciliationOk?: boolean;
  holders: AdminRevenuePreviewHolder[];
};

export type AdminRevenuePayoutItem = {
  id: string;
  userId: string;
  userEmail: string;
  units: string;
  percentage: string;
  amountUsdt: string;
  walletTxId: string | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type AdminRevenueLedgerItem = {
  id: string;
  operationType: string;
  amountUsdt: string;
  status: string;
  userId: string | null;
  userEmail: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type AdminRevenueAuditItem = {
  id: string;
  action: string;
  actorEmail: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
};

export type AdminRevenueDetail = AdminRevenueListItem & {
  asset: string;
  note: string | null;
  preview?: AdminRevenuePreview;
  payouts?: AdminRevenuePayoutItem[];
  ledger?: AdminRevenueLedgerItem[];
  audit?: AdminRevenueAuditItem[];
};

export const MOCK_ADMIN_REVENUE_SUMMARY: AdminRevenueSummary = {
  totalGrossRevenueUsdt: "28450.00",
  distributedToHoldersUsdt: "14210.00",
  platformShareUsdt: "4267.50",
  artistShareUsdt: "4267.50",
  pendingCount: 1,
  processingCount: 1,
  failedCount: 1,
  avgPayoutPerHolderUsdt: "118.42",
  activeEventsCount: 4,
};

export const MOCK_ADMIN_REVENUE_EVENTS: AdminRevenueListItem[] = [
  {
    id: "rev-demo-001",
    trackId: "rel-demo-northern-lights",
    trackTitle: "Northern Lights",
    artistName: "Aurora Wave",
    coverUrl: null,
    releaseStatus: "active",
    periodFrom: "2026-04-01",
    periodTo: "2026-04-30",
    source: "streaming",
    grossRevenueUsdt: "12400.00",
    holdersShareUsdt: "8680.00",
    artistShareUsdt: "1860.00",
    platformShareUsdt: "1860.00",
    distributedAmountUsdt: "8680.00",
    holdersCount: 42,
    status: "completed",
    distributionId: "dist-demo-001",
    errorMessage: null,
    createdBy: "finance@spliton.demo",
    createdAt: "2026-05-01T03:00:00Z",
    completedAt: "2026-05-01T03:15:00Z",
  },
  {
    id: "rev-demo-002",
    trackId: "rel-demo-echo-chamber",
    trackTitle: "Echo Chamber",
    artistName: "Static Bloom",
    coverUrl: null,
    releaseStatus: "active",
    periodFrom: "2026-04-01",
    periodTo: "2026-04-30",
    source: "distributor",
    grossRevenueUsdt: "8200.00",
    holdersShareUsdt: "5740.00",
    artistShareUsdt: "1230.00",
    platformShareUsdt: "1230.00",
    distributedAmountUsdt: "0",
    holdersCount: 28,
    status: "preview",
    distributionId: null,
    errorMessage: null,
    createdBy: "finance@spliton.demo",
    createdAt: "2026-05-28T10:00:00Z",
    completedAt: null,
  },
  {
    id: "rev-demo-003",
    trackId: "rel-demo-signal-loss",
    trackTitle: "Signal Loss",
    artistName: "Nova Relay",
    coverUrl: null,
    releaseStatus: "active",
    periodFrom: "2026-03-01",
    periodTo: "2026-03-31",
    source: "license",
    grossRevenueUsdt: "4850.00",
    holdersShareUsdt: "3395.00",
    artistShareUsdt: "727.50",
    platformShareUsdt: "727.50",
    distributedAmountUsdt: "0",
    holdersCount: 0,
    status: "failed",
    distributionId: "dist-demo-failed",
    errorMessage: "NO_ELIGIBLE_HOLDERS: release has no sold units for this period",
    createdBy: "finance@spliton.demo",
    createdAt: "2026-05-20T14:30:00Z",
    completedAt: null,
  },
  {
    id: "rev-demo-004",
    trackId: "rel-demo-pulse-code",
    trackTitle: "Pulse Code",
    artistName: "Binary Drift",
    coverUrl: null,
    releaseStatus: "active",
    periodFrom: "2026-05-01",
    periodTo: "2026-05-31",
    source: "manual",
    grossRevenueUsdt: "3000.00",
    holdersShareUsdt: "2100.00",
    artistShareUsdt: "450.00",
    platformShareUsdt: "450.00",
    distributedAmountUsdt: "0",
    holdersCount: 15,
    status: "draft",
    distributionId: null,
    errorMessage: null,
    createdBy: "ops@spliton.demo",
    createdAt: "2026-05-30T09:00:00Z",
    completedAt: null,
  },
];

export const MOCK_ADMIN_REVENUE_DETAIL: AdminRevenueDetail = {
  ...MOCK_ADMIN_REVENUE_EVENTS[0]!,
  asset: "USDT",
  note: "Q2 streaming report — Spotify, Apple Music",
  preview: {
    revenueEventId: "rev-demo-001",
    trackTitle: "Northern Lights",
    grossRevenue: "12400.00",
    platformAmount: "1860.00",
    artistAmount: "1860.00",
    holdersAmount: "8680.00",
    totalUnits: "1000",
    participatingUnits: "1000",
    holdersCount: 3,
    holders: [
      {
        userId: "usr-demo-001",
        userEmail: "investor@spliton.demo",
        units: "400",
        percentage: "40.0000",
        payoutAmount: "3472.00",
        walletId: "wal-demo-001",
        availableBalance: "1250.00",
      },
      {
        userId: "usr-demo-002",
        userEmail: "holder@spliton.demo",
        units: "350",
        percentage: "35.0000",
        payoutAmount: "3038.00",
        walletId: "wal-demo-002",
        availableBalance: "890.00",
      },
      {
        userId: "usr-demo-003",
        userEmail: "collector@spliton.demo",
        units: "250",
        percentage: "25.0000",
        payoutAmount: "2170.00",
        walletId: "wal-demo-003",
        availableBalance: "420.00",
      },
    ],
  },
  payouts: [
    {
      id: "pay-demo-001",
      userId: "usr-demo-001",
      userEmail: "investor@spliton.demo",
      units: "400",
      percentage: "40.0000",
      amountUsdt: "3472.00",
      walletTxId: "wtx-demo-001",
      status: "completed",
      createdAt: "2026-05-01T03:15:00Z",
      completedAt: "2026-05-01T03:15:01Z",
    },
  ],
  ledger: [
    {
      id: "wtx-demo-001",
      operationType: "payout_credit",
      amountUsdt: "3472.00",
      status: "settled",
      userId: "usr-demo-001",
      userEmail: "investor@spliton.demo",
      createdAt: "2026-05-01T03:15:00Z",
      completedAt: "2026-05-01T03:15:01Z",
    },
  ],
  audit: [
    {
      id: "aud-rev-001",
      action: "revenue_event.create",
      actorEmail: "finance@spliton.demo",
      before: null,
      after: { grossRevenue: "12400.00" },
      createdAt: "2026-05-01T03:00:00Z",
    },
    {
      id: "aud-rev-002",
      action: "distribution.run",
      actorEmail: "finance@spliton.demo",
      before: { status: "preview" },
      after: { status: "completed" },
      createdAt: "2026-05-01T03:15:00Z",
    },
  ],
};
