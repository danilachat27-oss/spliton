/** Admin wallets — mock data (mock mode only). */

export type AdminWalletSummary = {
  totalAvailableUsdt: string;
  totalLockedUsdt: string;
  totalPendingUsdt: string;
  totalEarnedUsdt: string;
  totalWithdrawnUsdt: string;
  pendingWithdrawalsUsdt: string;
  pendingDepositsUsdt: string;
  activeWalletsCount: number;
  walletsWithRiskFlags: number;
  anomalousWalletsCount: number;
};

export type AdminWalletListItem = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string | null;
  userStatus: string;
  userRoles: string[];
  assetCode: string;
  network: string;
  walletStatus: string;
  availableUsdt: string;
  lockedUsdt: string;
  pendingUsdt: string;
  earnedTotalUsdt: string;
  withdrawnTotalUsdt: string;
  depositsTotalUsdt: string;
  lastOperationType: string | null;
  lastOperationStatus: string | null;
  lastTransactionAt: string;
  hasRiskFlag: boolean;
  riskSeverity: string | null;
  hasPendingWithdrawal: boolean;
  hasPendingDeposit: boolean;
  isAnomalous: boolean;
};

export type AdminWalletLedgerEntry = {
  id: string;
  walletId: string;
  operationType: string;
  direction: "credit" | "debit" | "lock" | "unlock";
  amountUsdt: string;
  feeUsdt: string;
  netAmountUsdt: string;
  asset: string;
  status: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  completedAt: string | null;
  note: string | null;
  balanceAfterUsdt: string;
};

export type AdminWalletDepositItem = {
  id: string;
  amountUsdt: string;
  network: string;
  address: string;
  txHash: string;
  status: string;
  confirmations: number;
  createdAt: string;
  completedAt: string | null;
};

export type AdminWalletWithdrawalItem = {
  id: string;
  amountGrossUsdt: string;
  feeUsdt: string;
  netAmountUsdt: string;
  address: string;
  status: string;
  requestedAt: string;
  reviewedBy: string | null;
  completedAt: string | null;
  blockchainTxId: string | null;
};

export type AdminWalletMarketItem = {
  id: string;
  kind: "primary" | "secondary_buy" | "secondary_sell";
  releaseTitle: string | null;
  units: string | null;
  amountUsdt: string;
  feeUsdt: string | null;
  status: string;
  happenedAt: string;
};

export type AdminWalletRiskItem = {
  id: string;
  flagCode: string;
  severity: string;
  status: string;
  note: string | null;
  createdAt: string;
};

export type AdminWalletAuditItem = {
  id: string;
  action: string;
  actorEmail: string | null;
  entityType: string | null;
  entityId: string | null;
  summary: string | null;
  createdAt: string;
};

export type AdminWalletDetail = AdminWalletListItem & {
  createdAt: string;
  updatedAt: string;
  ledger?: AdminWalletLedgerEntry[];
  deposits?: AdminWalletDepositItem[];
  withdrawals?: AdminWalletWithdrawalItem[];
  market?: AdminWalletMarketItem[];
  risk?: AdminWalletRiskItem[];
  audit?: AdminWalletAuditItem[];
};

export const MOCK_ADMIN_WALLETS_SUMMARY: AdminWalletSummary = {
  totalAvailableUsdt: "24850.00",
  totalLockedUsdt: "1200.00",
  totalPendingUsdt: "500.00",
  totalEarnedUsdt: "18600.00",
  totalWithdrawnUsdt: "9200.00",
  pendingWithdrawalsUsdt: "995.00",
  pendingDepositsUsdt: "500.00",
  activeWalletsCount: 3,
  walletsWithRiskFlags: 1,
  anomalousWalletsCount: 0,
};

export const MOCK_ADMIN_WALLETS: AdminWalletListItem[] = [
  {
    id: "wal-demo-001",
    userId: "usr-demo-001",
    userEmail: "investor@spliton.demo",
    userDisplayName: "Demo Investor",
    userStatus: "active",
    userRoles: ["INVESTOR"],
    assetCode: "USDT",
    network: "TRC20",
    walletStatus: "active",
    availableUsdt: "1240.00",
    lockedUsdt: "200.00",
    pendingUsdt: "0.00",
    earnedTotalUsdt: "4800.00",
    withdrawnTotalUsdt: "2100.00",
    depositsTotalUsdt: "6000.00",
    lastOperationType: "payout_credit",
    lastOperationStatus: "completed",
    lastTransactionAt: "2026-05-29T12:00:00Z",
    hasRiskFlag: false,
    riskSeverity: null,
    hasPendingWithdrawal: false,
    hasPendingDeposit: false,
    isAnomalous: false,
  },
  {
    id: "wal-demo-002",
    userId: "usr-demo-002",
    userEmail: "trader@spliton.demo",
    userDisplayName: "Demo Trader",
    userStatus: "active",
    userRoles: ["INVESTOR"],
    assetCode: "USDT",
    network: "TRC20",
    walletStatus: "active",
    availableUsdt: "8600.00",
    lockedUsdt: "1000.00",
    pendingUsdt: "500.00",
    earnedTotalUsdt: "9200.00",
    withdrawnTotalUsdt: "4100.00",
    depositsTotalUsdt: "12000.00",
    lastOperationType: "secondary_purchase",
    lastOperationStatus: "completed",
    lastTransactionAt: "2026-05-30T08:30:00Z",
    hasRiskFlag: true,
    riskSeverity: "medium",
    hasPendingWithdrawal: true,
    hasPendingDeposit: true,
    isAnomalous: false,
  },
];

export const MOCK_ADMIN_WALLET_DETAIL: AdminWalletDetail = {
  ...MOCK_ADMIN_WALLETS[0]!,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-05-29T12:00:00Z",
  ledger: [
    {
      id: "wtx-1",
      walletId: "wal-demo-001",
      operationType: "deposit_completed",
      direction: "credit",
      amountUsdt: "500.00",
      feeUsdt: "0.00",
      netAmountUsdt: "500.00",
      asset: "USDT",
      status: "completed",
      referenceType: "deposit",
      referenceId: "dep-demo-001",
      createdAt: "2026-05-28T10:00:00Z",
      completedAt: "2026-05-28T10:15:00Z",
      note: null,
      balanceAfterUsdt: "500.00",
    },
    {
      id: "wtx-2",
      walletId: "wal-demo-001",
      operationType: "primary_purchase",
      direction: "debit",
      amountUsdt: "200.00",
      feeUsdt: "2.00",
      netAmountUsdt: "202.00",
      asset: "USDT",
      status: "completed",
      referenceType: "order",
      referenceId: "ord-demo-001",
      createdAt: "2026-05-28T14:00:00Z",
      completedAt: "2026-05-28T14:00:01Z",
      note: null,
      balanceAfterUsdt: "298.00",
    },
    {
      id: "wtx-3",
      walletId: "wal-demo-001",
      operationType: "payout_credit",
      direction: "credit",
      amountUsdt: "45.00",
      feeUsdt: "0.00",
      netAmountUsdt: "45.00",
      asset: "USDT",
      status: "completed",
      referenceType: "payout",
      referenceId: "pay-demo-001",
      createdAt: "2026-05-29T09:00:00Z",
      completedAt: "2026-05-29T09:00:00Z",
      note: "Revenue distribution",
      balanceAfterUsdt: "343.00",
    },
  ],
  deposits: [
    {
      id: "dep-demo-001",
      amountUsdt: "500.00",
      network: "TRC20",
      address: "TXyzDemoDeposit",
      txHash: "abc123demo",
      status: "completed",
      confirmations: 20,
      createdAt: "2026-05-28T10:00:00Z",
      completedAt: "2026-05-28T10:15:00Z",
    },
  ],
  withdrawals: [
    {
      id: "wd-demo-001",
      amountGrossUsdt: "1000.00",
      feeUsdt: "5.00",
      netAmountUsdt: "995.00",
      address: "TXyzDemoWithdraw",
      status: "pending",
      requestedAt: "2026-05-30T07:30:00Z",
      reviewedBy: null,
      completedAt: null,
      blockchainTxId: null,
    },
  ],
  market: [
    {
      id: "ord-demo-001",
      kind: "primary",
      releaseTitle: "Midnight Run",
      units: "100",
      amountUsdt: "200.00",
      feeUsdt: "2.00",
      status: "filled",
      happenedAt: "2026-05-28T14:00:00Z",
    },
  ],
  risk: [],
  audit: [],
};
