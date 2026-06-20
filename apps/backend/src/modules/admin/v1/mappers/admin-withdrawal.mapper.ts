import { UserStatus, WalletTxStatus, WithdrawalStatus } from '@prisma/client';

export const HIGH_VALUE_WITHDRAWAL_USDT = 1000;

export type AdminWithdrawalSummaryDto = {
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

export type AdminWithdrawalListItemDto = {
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
  status: string;
  hasRiskFlag: boolean;
  riskSeverity: string | null;
  isHighValue: boolean;
  requestedAt: string;
  updatedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  reviewedBy: string | null;
};

export type AdminWithdrawalLedgerDto = {
  id: string;
  operationType: string;
  amountUsdt: string;
  feeUsdt: string;
  netAmountUsdt: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type AdminWithdrawalAuditItemDto = {
  id: string;
  action: string;
  actorEmail: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
};

export type AdminWithdrawalUserContextDto = {
  userEmail: string;
  userStatus: string;
  availableUsdt: string;
  lockedUsdt: string;
  previousDepositsCount: number;
  previousWithdrawalsCount: number;
  riskFlags: Array<{ id: string; flagCode: string; severity: string }>;
};

export type AdminWithdrawalDetailDto = AdminWithdrawalListItemDto & {
  ledger?: AdminWithdrawalLedgerDto;
  audit?: AdminWithdrawalAuditItemDto[];
  userContext?: AdminWithdrawalUserContextDto;
};

const STATUS_TO_API: Record<WithdrawalStatus, string> = {
  REQUESTED: 'pending',
  LOCKED: 'pending',
  REVIEW: 'on_hold',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

const API_TO_STATUS: Record<string, WithdrawalStatus> = {
  pending: WithdrawalStatus.REQUESTED,
  requested: WithdrawalStatus.REQUESTED,
  locked: WithdrawalStatus.LOCKED,
  review: WithdrawalStatus.REVIEW,
  approved: WithdrawalStatus.APPROVED,
  processing: WithdrawalStatus.PROCESSING,
  on_hold: WithdrawalStatus.ON_HOLD,
  completed: WithdrawalStatus.COMPLETED,
  rejected: WithdrawalStatus.REJECTED,
  cancelled: WithdrawalStatus.CANCELLED,
  failed: WithdrawalStatus.FAILED,
};

type WithdrawalRow = {
  id: string;
  toAddress: string;
  blockchainTxid: string | null;
  status: WithdrawalStatus;
  requestedAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
  walletTxId: string;
  walletTx: {
    id: string;
    amount: { toString(): string };
    feeAmount: { toString(): string };
    netAmount: { toString(): string };
    status: WalletTxStatus;
    settledAt: Date | null;
    createdAt: Date;
    txType: string;
    walletId: string;
    wallet: {
      network: string;
      userId: string;
      user: {
        email: string;
        status: UserStatus;
        profile?: { displayName: string | null } | null;
      };
    };
  };
};

export function withdrawalStatusToApi(status: WithdrawalStatus): string {
  return STATUS_TO_API[status] ?? 'pending';
}

export function apiWithdrawalStatusToDb(status: string): WithdrawalStatus {
  return API_TO_STATUS[status] ?? WithdrawalStatus.REQUESTED;
}

export function mapWithdrawalListItem(
  row: WithdrawalRow,
  ctx?: { hasRiskFlag?: boolean; riskSeverity?: string | null },
  meta?: { reviewedBy?: string | null },
): AdminWithdrawalListItemDto {
  const amount = Number(row.walletTx.amount.toString());
  return {
    id: row.id,
    userId: row.walletTx.wallet.userId,
    userEmail: row.walletTx.wallet.user.email,
    userDisplayName: row.walletTx.wallet.user.profile?.displayName ?? null,
    userStatus: row.walletTx.wallet.user.status.toLowerCase(),
    walletId: row.walletTx.walletId,
    amountUsdt: amount.toFixed(2).replace(/\.00$/, ''),
    feeUsdt: Number(row.walletTx.feeAmount.toString()).toFixed(2),
    finalAmountUsdt: Number(row.walletTx.netAmount.toString()).toFixed(2),
    trc20Address: row.toAddress,
    txHash: row.blockchainTxid,
    hasTxHash: Boolean(row.blockchainTxid?.trim()),
    status: withdrawalStatusToApi(row.status),
    hasRiskFlag: ctx?.hasRiskFlag ?? false,
    riskSeverity: ctx?.riskSeverity ?? null,
    isHighValue: amount >= HIGH_VALUE_WITHDRAWAL_USDT,
    requestedAt: row.requestedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    reviewedBy: meta?.reviewedBy ?? null,
  };
}

/** @deprecated use mapWithdrawalListItem */
export function mapWithdrawal(
  row: WithdrawalRow,
  meta?: { reviewedBy?: string | null },
): AdminWithdrawalListItemDto {
  return mapWithdrawalListItem(row, undefined, meta);
}

export function mapWithdrawalLedger(
  row: WithdrawalRow,
): AdminWithdrawalLedgerDto {
  const statusMap: Record<string, string> = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    REVERSED: 'reversed',
  };
  const op =
    row.status === WithdrawalStatus.COMPLETED
      ? 'withdrawal_completed'
      : row.status === WithdrawalStatus.CANCELLED
        ? 'withdrawal_reversed'
        : 'withdrawal_pending';
  return {
    id: row.walletTx.id,
    operationType: op,
    amountUsdt: Number(row.walletTx.amount.toString()).toFixed(2),
    feeUsdt: Number(row.walletTx.feeAmount.toString()).toFixed(2),
    netAmountUsdt: Number(row.walletTx.netAmount.toString()).toFixed(2),
    status: statusMap[row.walletTx.status] ?? row.walletTx.status.toLowerCase(),
    createdAt: row.walletTx.createdAt.toISOString(),
    completedAt: row.walletTx.settledAt?.toISOString() ?? null,
  };
}

export function mapWithdrawalDetail(
  row: WithdrawalRow,
  ctx?: { hasRiskFlag?: boolean; riskSeverity?: string | null },
  extras?: Partial<
    Pick<AdminWithdrawalDetailDto, 'ledger' | 'audit' | 'userContext'>
  >,
): AdminWithdrawalDetailDto {
  return {
    ...mapWithdrawalListItem(row, ctx),
    ...extras,
  };
}
