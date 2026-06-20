/** Admin withdrawals — mock data (mock mode only). */

export type AdminWithdrawalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "on_hold"
  | "failed";

export type AdminWithdrawalSummary = {
  totalWithdrawnUsdt: string;
  pendingCount: number;
  onHoldCount: number;
  approvedCount: number;
  completedCount: number;
  failedCount: number;
  avgProcessingMinutes: number | null;
  highValueCount: number;
  withdrawalsWithRiskFlags: number;
};

export type AdminWithdrawalListItem = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  userStatus: string;
  walletId: string;
  amountUsdt: string;
  feeUsdt: string;
  finalAmountUsdt: string;
  trc20Address: string;
  txHash: string | null;
  hasTxHash: boolean;
  status: AdminWithdrawalStatus;
  hasRiskFlag: boolean;
  riskSeverity: string | null;
  isHighValue: boolean;
  requestedAt: string;
  updatedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  reviewedBy: string | null;
};

export type AdminWithdrawalLedger = {
  id: string;
  operationType: string;
  amountUsdt: string;
  feeUsdt: string;
  netAmountUsdt: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type AdminWithdrawalAuditItem = {
  id: string;
  action: string;
  actorEmail: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
};

export type AdminWithdrawalUserContext = {
  userEmail: string;
  userStatus: string;
  availableUsdt: string;
  lockedUsdt: string;
  previousDepositsCount: number;
  previousWithdrawalsCount: number;
  riskFlags: Array<{ id: string; flagCode: string; severity: string }>;
};

export type AdminWithdrawalApprovalStatus = {
  tier: "small" | "medium" | "large";
  satisfied: boolean;
  required: Array<{ role: string; label: string }>;
  approved: Array<{ role: string; approverUserId: string; at: string }>;
};

export type AdminWithdrawalDetail = AdminWithdrawalListItem & {
  ledger?: AdminWithdrawalLedger;
  audit?: AdminWithdrawalAuditItem[];
  userContext?: AdminWithdrawalUserContext;
  approvalStatus?: AdminWithdrawalApprovalStatus;
};

export const MOCK_ADMIN_WITHDRAWALS_SUMMARY: AdminWithdrawalSummary = {
  totalWithdrawnUsdt: "42000.00",
  pendingCount: 3,
  onHoldCount: 1,
  approvedCount: 2,
  completedCount: 48,
  failedCount: 2,
  avgProcessingMinutes: 45,
  highValueCount: 4,
  withdrawalsWithRiskFlags: 1,
};

export const MOCK_ADMIN_WITHDRAWALS: AdminWithdrawalListItem[] = [
  {
    id: "wd-demo-001",
    userId: "usr-demo-003",
    userEmail: "trader@spliton.demo",
    userDisplayName: "Demo Trader",
    userStatus: "active",
    walletId: "wal-demo-003",
    amountUsdt: "1000.00",
    feeUsdt: "5.00",
    finalAmountUsdt: "995.00",
    trc20Address: "TXyzDemoWithdrawAddr",
    txHash: null,
    hasTxHash: false,
    status: "pending",
    hasRiskFlag: false,
    riskSeverity: null,
    isHighValue: true,
    requestedAt: "2026-05-30T07:30:00Z",
    updatedAt: "2026-05-30T07:30:00Z",
    processedAt: null,
    completedAt: null,
    reviewedBy: null,
  },
  {
    id: "wd-demo-002",
    userId: "usr-demo-004",
    userEmail: "investor@spliton.demo",
    userDisplayName: "Demo Investor",
    userStatus: "active",
    walletId: "wal-demo-004",
    amountUsdt: "250.00",
    feeUsdt: "5.00",
    finalAmountUsdt: "245.00",
    trc20Address: "TApprovedDemoAddr",
    txHash: "wdtxdemo789abc",
    hasTxHash: true,
    status: "approved",
    hasRiskFlag: false,
    riskSeverity: null,
    isHighValue: false,
    requestedAt: "2026-05-29T14:00:00Z",
    updatedAt: "2026-05-29T15:00:00Z",
    processedAt: "2026-05-29T15:00:00Z",
    completedAt: null,
    reviewedBy: "admin-demo",
  },
];

export const MOCK_ADMIN_WITHDRAWAL_DETAIL: AdminWithdrawalDetail = {
  ...MOCK_ADMIN_WITHDRAWALS[0]!,
  ledger: {
    id: "wtx-wd-001",
    operationType: "withdrawal_pending",
    amountUsdt: "1000.00",
    feeUsdt: "5.00",
    netAmountUsdt: "995.00",
    status: "pending",
    createdAt: "2026-05-30T07:30:00Z",
    completedAt: null,
  },
  audit: [],
  userContext: {
    userEmail: "trader@spliton.demo",
    userStatus: "active",
    availableUsdt: "3200.00",
    lockedUsdt: "1000.00",
    previousDepositsCount: 5,
    previousWithdrawalsCount: 2,
    riskFlags: [],
  },
};
