import { DepositStatus, WalletTxStatus, type UserStatus } from '@prisma/client';

export const HIGH_VALUE_DEPOSIT_USDT = 1000;

export type AdminDepositSummaryDto = {
  totalDepositedUsdt: string;
  pendingCount: number;
  manualReviewCount: number;
  completedCount: number;
  failedCount: number;
  avgConfirmationMinutes: number | null;
  highValueCount: number;
  depositsWithRiskFlags: number;
};

export type AdminDepositListItemDto = {
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
  status: string;
  hasRiskFlag: boolean;
  riskSeverity: string | null;
  isHighValue: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type AdminDepositLedgerDto = {
  id: string;
  operationType: string;
  amountUsdt: string;
  feeUsdt: string;
  netAmountUsdt: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type AdminDepositAuditItemDto = {
  id: string;
  action: string;
  actorEmail: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
};

export type AdminDepositUserContextDto = {
  userEmail: string;
  userStatus: string;
  availableUsdt: string;
  lockedUsdt: string;
  previousDepositsCount: number;
  previousWithdrawalsCount: number;
  riskFlags: Array<{ id: string; flagCode: string; severity: string }>;
};

export type AdminDepositDetailDto = AdminDepositListItemDto & {
  fromAddress: string | null;
  receivedAt: string | null;
  ledger?: AdminDepositLedgerDto;
  audit?: AdminDepositAuditItemDto[];
  userContext?: AdminDepositUserContextDto;
};

const STATUS_TO_API: Record<DepositStatus, string> = {
  DETECTED: 'detected',
  PENDING_CONFIRMATIONS: 'confirming',
  PENDING: 'pending',
  CONFIRMING: 'confirming',
  MANUAL_REVIEW: 'manual_review',
  CREDITED: 'completed',
  CONFIRMED: 'completed',
  IGNORED: 'ignored',
  FAILED: 'failed',
};

const API_TO_STATUS: Record<string, DepositStatus> = {
  pending: DepositStatus.PENDING,
  detected: DepositStatus.DETECTED,
  confirming: DepositStatus.CONFIRMING,
  manual_review: DepositStatus.MANUAL_REVIEW,
  completed: DepositStatus.CREDITED,
  ignored: DepositStatus.IGNORED,
  failed: DepositStatus.FAILED,
  rejected: DepositStatus.FAILED,
};

type DepositRow = {
  id: string;
  blockchainTxid: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  confirmations: number;
  requiredConfirmations: number;
  status: DepositStatus;
  receivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  walletTxId: string;
  walletTx: {
    id: string;
    amount: { toString(): string };
    feeAmount: { toString(): string };
    netAmount: { toString(): string };
    currency: string;
    status: WalletTxStatus;
    settledAt: Date | null;
    createdAt: Date;
    txType: string;
    direction: string;
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

export function depositStatusToApi(status: DepositStatus): string {
  return STATUS_TO_API[status] ?? 'pending';
}

export function apiDepositStatusToDb(status: string): DepositStatus {
  return API_TO_STATUS[status] ?? DepositStatus.PENDING;
}

export function mapDepositListItem(
  row: DepositRow,
  ctx?: { hasRiskFlag?: boolean; riskSeverity?: string | null },
): AdminDepositListItemDto {
  const amount = Number(row.walletTx.amount.toString());
  return {
    id: row.id,
    userId: row.walletTx.wallet.userId,
    userEmail: row.walletTx.wallet.user.email,
    userDisplayName: row.walletTx.wallet.user.profile?.displayName ?? null,
    userStatus: row.walletTx.wallet.user.status.toLowerCase(),
    walletId: row.walletTx.walletId,
    amountUsdt: amount.toFixed(2).replace(/\.00$/, ''),
    asset: row.walletTx.currency,
    network: row.walletTx.wallet.network,
    depositAddress: row.toAddress ?? '—',
    txHash: row.blockchainTxid,
    hasTxHash: Boolean(row.blockchainTxid?.trim()),
    confirmations: row.confirmations,
    requiredConfirmations: row.requiredConfirmations,
    status: depositStatusToApi(row.status),
    hasRiskFlag: ctx?.hasRiskFlag ?? false,
    riskSeverity: ctx?.riskSeverity ?? null,
    isHighValue: amount >= HIGH_VALUE_DEPOSIT_USDT,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt:
      row.walletTx.settledAt?.toISOString() ??
      row.receivedAt?.toISOString() ??
      null,
  };
}

/** @deprecated use mapDepositListItem */
export function mapDeposit(row: DepositRow): AdminDepositListItemDto {
  return mapDepositListItem(row);
}

export function mapDepositLedger(row: DepositRow): AdminDepositLedgerDto {
  const statusMap: Record<string, string> = {
    PENDING: 'pending',
    DETECTED: 'detected',
    PENDING_CONFIRMATIONS: 'confirming',
    COMPLETED: 'completed',
    CREDITED: 'completed',
    FAILED: 'failed',
    IGNORED: 'ignored',
    CANCELLED: 'cancelled',
    REVERSED: 'reversed',
  };
  const op =
    row.status === DepositStatus.CONFIRMED ||
    row.status === DepositStatus.CREDITED
      ? 'deposit_completed'
      : 'deposit_pending';
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

export function mapDepositDetail(
  row: DepositRow,
  ctx?: { hasRiskFlag?: boolean; riskSeverity?: string | null },
  extras?: Partial<
    Pick<AdminDepositDetailDto, 'ledger' | 'audit' | 'userContext'>
  >,
): AdminDepositDetailDto {
  return {
    ...mapDepositListItem(row, ctx),
    fromAddress: row.fromAddress,
    receivedAt: row.receivedAt?.toISOString() ?? null,
    ...extras,
  };
}
