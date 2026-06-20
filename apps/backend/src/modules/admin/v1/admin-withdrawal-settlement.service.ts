import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ActorRole,
  LedgerOperationType,
  Prisma,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { WalletLedgerService } from '../common/wallet-ledger.service';
import { throwAdminError } from '../common/admin-http.util';
import type { LedgerMutationContext } from '../common/ledger-mutation.types';

type WithdrawalWithTx = Prisma.WithdrawalGetPayload<{
  include: { walletTx: { include: { wallet: true } } };
}>;

@Injectable()
export class AdminWithdrawalSettlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedgerService,
  ) {}

  private terminal(status: WithdrawalStatus): boolean {
    return (
      status === WithdrawalStatus.COMPLETED ||
      status === WithdrawalStatus.CANCELLED ||
      status === WithdrawalStatus.REJECTED ||
      status === WithdrawalStatus.FAILED
    );
  }

  private lockAmount(row: WithdrawalWithTx): Prisma.Decimal {
    return row.walletTx.amount;
  }

  private baseCtx(
    row: WithdrawalWithTx,
    actorUserId: string | null,
    actorRole: ActorRole,
  ): Omit<LedgerMutationContext, 'operationType' | 'idempotencyKey'> {
    return {
      sourceEntityType: 'withdrawal',
      sourceEntityId: row.id,
      actorUserId,
      actorRole,
      currency: row.walletTx.currency,
      walletTransactionId: row.walletTxId,
    };
  }

  async ensureLocked(
    tx: Prisma.TransactionClient,
    row: WithdrawalWithTx,
    actorUserId: string,
  ): Promise<void> {
    if (
      row.status !== WithdrawalStatus.REQUESTED &&
      row.status !== WithdrawalStatus.LOCKED
    ) {
      return;
    }
    const walletId = row.walletTx.walletId;
    const amount = this.lockAmount(row);
    const balance = await this.ledger.getBalanceOrThrow(tx, walletId);
    const alreadyLocked =
      row.walletTx.status === WalletTxStatus.PENDING &&
      row.walletTx.direction === WalletTxDirection.OUT &&
      balance.locked.greaterThanOrEqualTo(amount);

    if (alreadyLocked) return;

    await this.ledger.lockFromAvailable(tx, walletId, amount, {
      ...this.baseCtx(row, actorUserId, ActorRole.ADMIN),
      operationType: LedgerOperationType.WITHDRAWAL_LOCK,
      idempotencyKey: `withdrawal-admin-lock:${row.id}`,
    });
    await tx.walletTransaction.update({
      where: { id: row.walletTxId },
      data: { status: WalletTxStatus.PENDING },
    });
  }

  async approve(
    tx: Prisma.TransactionClient,
    row: WithdrawalWithTx,
    actorUserId: string,
  ): Promise<WithdrawalStatus> {
    if (this.terminal(row.status)) {
      throwAdminError(
        'WITHDRAWAL_TERMINAL',
        'Withdrawal already finalized',
        HttpStatus.CONFLICT,
      );
    }
    if (
      row.status !== WithdrawalStatus.LOCKED &&
      row.status !== WithdrawalStatus.REVIEW &&
      row.status !== WithdrawalStatus.ON_HOLD
    ) {
      throwAdminError(
        'INVALID_STATUS',
        'Can only approve locked/review withdrawals',
        HttpStatus.CONFLICT,
      );
    }
    await this.ensureLocked(tx, row, actorUserId);
    return WithdrawalStatus.APPROVED;
  }

  async hold(
    tx: Prisma.TransactionClient,
    row: WithdrawalWithTx,
    actorUserId: string,
  ): Promise<WithdrawalStatus> {
    if (this.terminal(row.status)) {
      throwAdminError(
        'WITHDRAWAL_TERMINAL',
        'Withdrawal already finalized',
        HttpStatus.CONFLICT,
      );
    }
    if (
      row.status !== WithdrawalStatus.LOCKED &&
      row.status !== WithdrawalStatus.APPROVED &&
      row.status !== WithdrawalStatus.PROCESSING
    ) {
      throwAdminError(
        'INVALID_STATUS',
        'Cannot send withdrawal to review in current status',
        HttpStatus.CONFLICT,
      );
    }
    await this.ensureLocked(tx, row, actorUserId);
    return WithdrawalStatus.REVIEW;
  }

  async reject(
    tx: Prisma.TransactionClient,
    row: WithdrawalWithTx,
    actorUserId: string,
    rejectionReason?: string,
  ): Promise<WithdrawalStatus> {
    if (!rejectionReason?.trim()) {
      throwAdminError(
        'REJECTION_REASON_REQUIRED',
        'Rejection reason is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (this.terminal(row.status)) {
      throwAdminError(
        'WITHDRAWAL_TERMINAL',
        'Withdrawal already finalized',
        HttpStatus.CONFLICT,
      );
    }

    const walletId = row.walletTx.walletId;
    const amount = this.lockAmount(row);
    const balance = await this.ledger.getBalanceOrThrow(tx, walletId);
    if (balance.locked.greaterThanOrEqualTo(amount)) {
      await this.ledger.unlockToAvailable(tx, walletId, amount, {
        ...this.baseCtx(row, actorUserId, ActorRole.ADMIN),
        operationType: LedgerOperationType.WITHDRAWAL_UNLOCK,
        idempotencyKey: `withdrawal-unlock:${row.id}`,
      });
    }

    await this.ledger.createWalletTransaction(tx, {
      walletId,
      txType: WalletTxType.WITHDRAWAL,
      direction: WalletTxDirection.IN,
      amount: row.walletTx.amount,
      feeAmount: row.walletTx.feeAmount,
      netAmount: amount,
      currency: row.walletTx.currency,
      status: WalletTxStatus.COMPLETED,
      referenceType: 'withdrawal',
      referenceId: row.id,
      reversalOfTxId: row.walletTxId,
      ctx: {
        ...this.baseCtx(row, actorUserId, ActorRole.ADMIN),
        operationType: LedgerOperationType.WITHDRAWAL_REJECT,
        idempotencyKey: `withdrawal-reject-tx:${row.id}`,
      },
    });

    await tx.walletTransaction.update({
      where: { id: row.walletTxId },
      data: { status: WalletTxStatus.CANCELLED },
    });
    return WithdrawalStatus.REJECTED;
  }

  async complete(
    tx: Prisma.TransactionClient,
    row: WithdrawalWithTx,
    actorUserId: string,
    blockchainTxid?: string,
  ): Promise<WithdrawalStatus> {
    if (
      row.status !== WithdrawalStatus.APPROVED &&
      row.status !== WithdrawalStatus.PROCESSING
    ) {
      throwAdminError(
        'INVALID_STATUS',
        'Can only complete approved withdrawals',
        HttpStatus.CONFLICT,
      );
    }
    const walletId = row.walletTx.walletId;
    const amount = this.lockAmount(row);

    await this.ledger.debitLocked(tx, walletId, amount, {
      ...this.baseCtx(row, actorUserId, ActorRole.ADMIN),
      operationType: LedgerOperationType.WITHDRAWAL_COMPLETE,
      idempotencyKey: `withdrawal-complete:${row.id}`,
    });

    await tx.walletTransaction.update({
      where: { id: row.walletTxId },
      data: { status: WalletTxStatus.COMPLETED, settledAt: new Date() },
    });

    if (blockchainTxid?.trim()) {
      await tx.withdrawal.update({
        where: { id: row.id },
        data: { blockchainTxid: blockchainTxid.trim() },
      });
    }

    return WithdrawalStatus.COMPLETED;
  }
}
