import {
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
  type WalletStatus,
  type UserStatus,
} from '@prisma/client';

export type AdminWalletSummaryDto = {
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

export type AdminWalletListItemDto = {
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

export type AdminLedgerEntryDto = {
  id: string;
  walletId: string;
  operationType: string;
  direction: 'credit' | 'debit' | 'lock' | 'unlock';
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

export type AdminWalletDepositItemDto = {
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

export type AdminWalletWithdrawalItemDto = {
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

export type AdminWalletMarketItemDto = {
  id: string;
  kind: 'primary' | 'secondary_buy' | 'secondary_sell';
  releaseTitle: string | null;
  units: string | null;
  amountUsdt: string;
  feeUsdt: string | null;
  status: string;
  happenedAt: string;
};

export type AdminWalletRiskItemDto = {
  id: string;
  flagCode: string;
  severity: string;
  status: string;
  note: string | null;
  createdAt: string;
};

export type AdminWalletAuditItemDto = {
  id: string;
  action: string;
  actorEmail: string | null;
  entityType: string | null;
  entityId: string | null;
  summary: string | null;
  createdAt: string;
};

export type AdminWalletDetailDto = AdminWalletListItemDto & {
  createdAt: string;
  updatedAt: string;
  ledger?: AdminLedgerEntryDto[];
  deposits?: AdminWalletDepositItemDto[];
  withdrawals?: AdminWalletWithdrawalItemDto[];
  market?: AdminWalletMarketItemDto[];
  risk?: AdminWalletRiskItemDto[];
  audit?: AdminWalletAuditItemDto[];
};

const TX_STATUS_TO_API: Record<WalletTxStatus, string> = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REVERSED: 'reversed',
};

function formatAmount(
  value: { toString(): string } | null | undefined,
): string {
  if (!value) return '0';
  return Number(value.toString()).toFixed(2).replace(/\.00$/, '');
}

function mapDirection(
  txType: WalletTxType,
  direction: WalletTxDirection,
): AdminLedgerEntryDto['direction'] {
  if (txType === WalletTxType.TRADE_LOCK) return 'lock';
  if (txType === WalletTxType.REFUND && direction === WalletTxDirection.IN)
    return 'unlock';
  return direction === WalletTxDirection.IN ? 'credit' : 'debit';
}

export function mapTxTypeToOperation(
  txType: WalletTxType,
  status: WalletTxStatus,
  referenceType?: string | null,
): string {
  if (txType === WalletTxType.DEPOSIT) {
    return status === WalletTxStatus.PENDING
      ? 'deposit_pending'
      : 'deposit_completed';
  }
  if (txType === WalletTxType.WITHDRAWAL) {
    if (status === WalletTxStatus.PENDING) return 'withdrawal_created';
    if (status === WalletTxStatus.COMPLETED) return 'withdrawal_completed';
    if (
      status === WalletTxStatus.CANCELLED ||
      status === WalletTxStatus.FAILED
    ) {
      return 'withdrawal_rejected';
    }
    return 'withdrawal_locked';
  }
  if (txType === WalletTxType.TRADE_LOCK) return 'withdrawal_locked';
  if (txType === WalletTxType.TRADE_SETTLEMENT) {
    if (referenceType === 'primary_order') return 'primary_purchase';
    return referenceType === 'trade' ? 'secondary_purchase' : 'secondary_sale';
  }
  if (txType === WalletTxType.FEE) {
    if (referenceType === 'withdrawal') return 'withdrawal_fee';
    if (referenceType === 'trade') return 'secondary_fee';
    return 'primary_purchase_fee';
  }
  if (txType === WalletTxType.PAYOUT) return 'payout_credit';
  if (txType === WalletTxType.ADMIN_ADJUSTMENT) return 'manual_adjustment';
  if (txType === WalletTxType.REFUND) return 'manual_adjustment';
  return String(txType).toLowerCase();
}

export function mapLedgerEntry(
  row: {
    id: string;
    walletId: string;
    txType: WalletTxType;
    direction: WalletTxDirection;
    amount: { toString(): string };
    feeAmount: { toString(): string };
    netAmount: { toString(): string };
    currency: string;
    status: WalletTxStatus;
    referenceType: string | null;
    referenceId: string | null;
    createdAt: Date;
    settledAt: Date | null;
    happenedAt: Date;
  },
  balanceAfter?: string,
): AdminLedgerEntryDto {
  return {
    id: row.id,
    walletId: row.walletId,
    operationType: mapTxTypeToOperation(
      row.txType,
      row.status,
      row.referenceType,
    ),
    direction: mapDirection(row.txType, row.direction),
    amountUsdt: formatAmount(row.amount),
    feeUsdt: formatAmount(row.feeAmount),
    netAmountUsdt: formatAmount(row.netAmount),
    asset: row.currency,
    status: TX_STATUS_TO_API[row.status] ?? row.status.toLowerCase(),
    referenceType: row.referenceType ?? '—',
    referenceId: row.referenceId ?? '—',
    createdAt: row.happenedAt.toISOString(),
    completedAt: row.settledAt?.toISOString() ?? null,
    note: null,
    balanceAfterUsdt: balanceAfter ?? '—',
  };
}

type WalletRow = {
  id: string;
  userId: string;
  assetCode: string;
  network: string;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    email: string;
    status: UserStatus;
    profile: { displayName: string | null } | null;
    userRoles?: { role: { code: string } }[];
  };
  balance: {
    available: { toString(): string };
    locked: { toString(): string };
    pending: { toString(): string };
  } | null;
};

export function mapWalletListItem(
  row: WalletRow,
  ctx: {
    earnedTotalUsdt: string;
    withdrawnTotalUsdt: string;
    depositsTotalUsdt: string;
    lastOperationType: string | null;
    lastOperationStatus: string | null;
    lastTransactionAt: Date | null;
    hasRiskFlag: boolean;
    riskSeverity: string | null;
    hasPendingWithdrawal: boolean;
    hasPendingDeposit: boolean;
  },
): AdminWalletListItemDto {
  const available = Number(row.balance?.available.toString() ?? 0);
  const locked = Number(row.balance?.locked.toString() ?? 0);
  const pending = Number(row.balance?.pending.toString() ?? 0);
  const isAnomalous = available < 0 || locked < 0 || pending < 0;

  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user.email,
    userDisplayName: row.user.profile?.displayName ?? null,
    userStatus: row.user.status.toLowerCase(),
    userRoles: row.user.userRoles?.map((ur) => ur.role.code) ?? [],
    assetCode: row.assetCode,
    network: row.network,
    walletStatus: row.status.toLowerCase(),
    availableUsdt: formatAmount(row.balance?.available),
    lockedUsdt: formatAmount(row.balance?.locked),
    pendingUsdt: formatAmount(row.balance?.pending),
    earnedTotalUsdt: ctx.earnedTotalUsdt,
    withdrawnTotalUsdt: ctx.withdrawnTotalUsdt,
    depositsTotalUsdt: ctx.depositsTotalUsdt,
    lastOperationType: ctx.lastOperationType,
    lastOperationStatus: ctx.lastOperationStatus,
    lastTransactionAt: (ctx.lastTransactionAt ?? row.updatedAt).toISOString(),
    hasRiskFlag: ctx.hasRiskFlag,
    riskSeverity: ctx.riskSeverity,
    hasPendingWithdrawal: ctx.hasPendingWithdrawal,
    hasPendingDeposit: ctx.hasPendingDeposit,
    isAnomalous,
  };
}

export function mapWalletDetail(
  row: WalletRow,
  ctx: Parameters<typeof mapWalletListItem>[1],
  extras?: Partial<
    Pick<
      AdminWalletDetailDto,
      'ledger' | 'deposits' | 'withdrawals' | 'market' | 'risk' | 'audit'
    >
  >,
): AdminWalletDetailDto {
  return {
    ...mapWalletListItem(row, ctx),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...extras,
  };
}
