import {
  ActorRole,
  LedgerOperationType,
  Prisma,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';

/** Required context for any balance mutation — audit + reconciliation traceability. */
export type LedgerMutationContext = {
  operationType: LedgerOperationType;
  sourceEntityType: string;
  sourceEntityId: string;
  actorUserId?: string | null;
  actorRole: ActorRole;
  currency: string;
  idempotencyKey?: string | null;
  metadata?: Prisma.InputJsonValue;
  walletTransactionId?: string;
};

export type CreateWalletTransactionParams = {
  walletId: string;
  txType: WalletTxType;
  direction: WalletTxDirection;
  amount: Prisma.Decimal;
  feeAmount: Prisma.Decimal;
  netAmount: Prisma.Decimal;
  currency: string;
  status: WalletTxStatus;
  referenceType: string;
  referenceId?: string | null;
  happenedAt?: Date;
  ctx: LedgerMutationContext;
  reversalOfTxId?: string;
};
