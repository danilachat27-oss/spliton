/** Admin deposits — mock data (mock mode only). */

export type AdminDepositStatus =
  | "pending"
  | "confirming"
  | "completed"
  | "failed"
  | "rejected"
  | "manual_review";

export type AdminDepositSummary = {
  totalDepositedUsdt: string;
  pendingCount: number;
  manualReviewCount: number;
  completedCount: number;
  failedCount: number;
  avgConfirmationMinutes: number | null;
  highValueCount: number;
  depositsWithRiskFlags: number;
};

export type AdminDepositListItem = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  userStatus: string;
  walletId: string;
  amountUsdt: string;
  asset: string;
  network: string;
  depositAddress: string;
  txHash: string | null;
  hasTxHash: boolean;
  confirmations: number;
  requiredConfirmations: number;
  status: AdminDepositStatus;
  hasRiskFlag: boolean;
  riskSeverity: string | null;
  isHighValue: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type AdminDepositLedger = {
  id: string;
  operationType: string;
  amountUsdt: string;
  feeUsdt: string;
  netAmountUsdt: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type AdminDepositAuditItem = {
  id: string;
  action: string;
  actorEmail: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
};

export type AdminDepositUserContext = {
  userEmail: string;
  userStatus: string;
  availableUsdt: string;
  lockedUsdt: string;
  previousDepositsCount: number;
  previousWithdrawalsCount: number;
  riskFlags: Array<{ id: string; flagCode: string; severity: string }>;
};

export type AdminDepositDetail = AdminDepositListItem & {
  fromAddress: string | null;
  receivedAt: string | null;
  ledger?: AdminDepositLedger;
  audit?: AdminDepositAuditItem[];
  userContext?: AdminDepositUserContext;
};

export const MOCK_ADMIN_DEPOSITS_SUMMARY: AdminDepositSummary = {
  totalDepositedUsdt: "18500.00",
  pendingCount: 2,
  manualReviewCount: 1,
  completedCount: 12,
  failedCount: 1,
  avgConfirmationMinutes: 18,
  highValueCount: 3,
  depositsWithRiskFlags: 1,
};

export const MOCK_ADMIN_DEPOSITS: AdminDepositListItem[] = [
  {
    id: "dep-demo-001",
    userId: "usr-demo-001",
    userEmail: "investor@spliton.demo",
    userDisplayName: "Demo Investor",
    userStatus: "active",
    walletId: "wal-demo-001",
    amountUsdt: "500.00",
    asset: "USDT",
    network: "TRC20",
    depositAddress: "TXyzDemoDepositAddr",
    txHash: "abc123demo456789",
    hasTxHash: true,
    confirmations: 8,
    requiredConfirmations: 12,
    status: "confirming",
    hasRiskFlag: false,
    riskSeverity: null,
    isHighValue: false,
    createdAt: "2026-05-30T08:00:00Z",
    updatedAt: "2026-05-30T08:15:00Z",
    completedAt: null,
  },
  {
    id: "dep-demo-002",
    userId: "usr-demo-002",
    userEmail: "trader@spliton.demo",
    userDisplayName: "Demo Trader",
    userStatus: "active",
    walletId: "wal-demo-002",
    amountUsdt: "2500.00",
    asset: "USDT",
    network: "TRC20",
    depositAddress: "TXyzHighValueAddr",
    txHash: null,
    hasTxHash: false,
    confirmations: 0,
    requiredConfirmations: 12,
    status: "manual_review",
    hasRiskFlag: true,
    riskSeverity: "medium",
    isHighValue: true,
    createdAt: "2026-05-29T10:00:00Z",
    updatedAt: "2026-05-29T11:00:00Z",
    completedAt: null,
  },
];

export const MOCK_ADMIN_DEPOSIT_DETAIL: AdminDepositDetail = {
  ...MOCK_ADMIN_DEPOSITS[0]!,
  fromAddress: "TSenderDemoAddr",
  receivedAt: null,
  ledger: {
    id: "wtx-dep-001",
    operationType: "deposit_pending",
    amountUsdt: "500.00",
    feeUsdt: "0.00",
    netAmountUsdt: "500.00",
    status: "pending",
    createdAt: "2026-05-30T08:00:00Z",
    completedAt: null,
  },
  audit: [],
  userContext: {
    userEmail: "investor@spliton.demo",
    userStatus: "active",
    availableUsdt: "1240.00",
    lockedUsdt: "200.00",
    previousDepositsCount: 3,
    previousWithdrawalsCount: 1,
    riskFlags: [],
  },
};
