export type AdminWalletListItem = {
  id: string;
  userId: string;
  userEmail: string;
  availableUsdt: string;
  lockedUsdt: string;
  earnedTotalUsdt: string;
  withdrawnTotalUsdt: string;
  depositsTotalUsdt: string;
  withdrawalsTotalUsdt: string;
  lastTransactionAt: string;
};

export const MOCK_ADMIN_WALLETS: AdminWalletListItem[] = [
  {
    id: "wal-501",
    userId: "usr-1001",
    userEmail: "holder@example.com",
    availableUsdt: "1 240.00",
    lockedUsdt: "200.00",
    earnedTotalUsdt: "4 800.00",
    withdrawnTotalUsdt: "2 100.00",
    depositsTotalUsdt: "6 000.00",
    withdrawalsTotalUsdt: "2 100.00",
    lastTransactionAt: "2026-05-29",
  },
];

export type AdminDepositStatus =
  | "pending"
  | "confirming"
  | "completed"
  | "failed"
  | "rejected"
  | "manual_review";

export type AdminDepositListItem = {
  id: string;
  userEmail: string;
  amountUsdt: string;
  asset: string;
  network: string;
  txHash: string;
  walletAddress: string;
  status: AdminDepositStatus;
  confirmations: number;
  createdAt: string;
  completedAt: string | null;
};

export const MOCK_ADMIN_DEPOSITS: AdminDepositListItem[] = [
  {
    id: "dep-9001",
    userEmail: "holder@example.com",
    amountUsdt: "500.00",
    asset: "USDT",
    network: "TRC20",
    txHash: "0xabc123…",
    walletAddress: "TXyz…wallet",
    status: "confirming",
    confirmations: 8,
    createdAt: "2026-05-30T08:00:00Z",
    completedAt: null,
  },
];

export type { AdminWithdrawalListItem, AdminWithdrawalStatus } from "./admin-withdrawals.mock";
export { MOCK_ADMIN_WITHDRAWALS } from "./admin-withdrawals.mock";
