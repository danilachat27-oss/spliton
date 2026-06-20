import { HttpStatus, Injectable } from '@nestjs/common';
import { LedgerAccount, Prisma, WalletTxStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { throwAdminError } from './admin-http.util';
import { LedgerPostingService } from './ledger-posting.service';
import type {
  CreateWalletTransactionParams,
  LedgerMutationContext,
} from './ledger-mutation.types';

/** Read/write client inside or outside an interactive transaction. */
type TxClient = Prisma.TransactionClient | PrismaService;

/**
 * Sole entry point for mutating `wallet_balances`.
 * Every mutation writes balanced `ledger_postings` first, then updates the cache row.
 */
@Injectable()
export class WalletLedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postings: LedgerPostingService,
  ) {}

  async getBalanceOrThrow(tx: TxClient, walletId: string) {
    const balance = await tx.walletBalance.findUnique({ where: { walletId } });
    if (!balance) {
      throwAdminError(
        'WALLET_BALANCE_NOT_FOUND',
        'Wallet balance not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return balance;
  }

  assertNonNegative(value: Prisma.Decimal, label: string): void {
    if (value.lessThan(0)) {
      throwAdminError(
        'NEGATIVE_BALANCE',
        `${label} would become negative`,
        HttpStatus.CONFLICT,
      );
    }
  }

  private async assertIdempotentTx(
    tx: TxClient,
    walletId: string,
    idempotencyKey: string | null | undefined,
  ): Promise<boolean> {
    if (!idempotencyKey?.trim()) return false;
    const existing = await tx.walletTransaction.findFirst({
      where: { walletId, idempotencyKey: idempotencyKey.trim() },
    });
    return Boolean(existing);
  }

  async creditAvailable(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    if (amount.lessThanOrEqualTo(0)) return;

    if (ctx.idempotencyKey?.trim()) {
      const settled = await tx.ledgerPosting.findFirst({
        where: { walletId, idempotencyKey: ctx.idempotencyKey.trim() },
      });
      if (settled) return;
    }

    await this.postings.postSettlementToAvailable(tx, walletId, amount, ctx);

    const balance = await this.getBalanceOrThrow(tx, walletId);
    const next = balance.available.plus(amount);
    this.assertNonNegative(next, 'available');
    await tx.walletBalance.update({
      where: { walletId },
      data: { available: next },
    });
  }

  async debitAvailable(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    if (await this.assertIdempotentTx(tx, walletId, ctx.idempotencyKey)) return;

    const balance = await this.getBalanceOrThrow(tx, walletId);
    if (balance.available.lessThan(amount)) {
      throwAdminError(
        'INSUFFICIENT_AVAILABLE',
        'Insufficient available balance',
        HttpStatus.CONFLICT,
      );
    }

    await this.postings.postAvailableToSettlement(tx, walletId, amount, ctx);

    const next = balance.available.minus(amount);
    this.assertNonNegative(next, 'available');
    await tx.walletBalance.update({
      where: { walletId },
      data: { available: next },
    });
  }

  async lockFromAvailable(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    if (await this.assertIdempotentTx(tx, walletId, ctx.idempotencyKey)) return;

    const balance = await this.getBalanceOrThrow(tx, walletId);
    if (balance.available.lessThan(amount)) {
      throwAdminError(
        'INSUFFICIENT_AVAILABLE',
        'Insufficient available balance to lock',
        HttpStatus.CONFLICT,
      );
    }

    await this.postings.postAvailableToLocked(tx, walletId, amount, ctx);

    await tx.walletBalance.update({
      where: { walletId },
      data: {
        available: balance.available.minus(amount),
        locked: balance.locked.plus(amount),
      },
    });
  }

  async unlockToAvailable(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    if (await this.assertIdempotentTx(tx, walletId, ctx.idempotencyKey)) return;

    const balance = await this.getBalanceOrThrow(tx, walletId);
    if (balance.locked.lessThan(amount)) {
      throwAdminError(
        'INSUFFICIENT_LOCKED',
        'Insufficient locked balance to unlock',
        HttpStatus.CONFLICT,
      );
    }

    await this.postings.postLockedToAvailable(tx, walletId, amount, ctx);

    await tx.walletBalance.update({
      where: { walletId },
      data: {
        available: balance.available.plus(amount),
        locked: balance.locked.minus(amount),
      },
    });
  }

  async debitLocked(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    if (await this.assertIdempotentTx(tx, walletId, ctx.idempotencyKey)) return;

    const balance = await this.getBalanceOrThrow(tx, walletId);
    if (balance.locked.lessThan(amount)) {
      throwAdminError(
        'INSUFFICIENT_LOCKED',
        'Insufficient locked balance',
        HttpStatus.CONFLICT,
      );
    }

    await this.postings.postLockedToSettlement(tx, walletId, amount, ctx);

    const next = balance.locked.minus(amount);
    this.assertNonNegative(next, 'locked');
    await tx.walletBalance.update({
      where: { walletId },
      data: { locked: next },
    });
  }

  async recordPlatformFee(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    if (amount.lessThanOrEqualTo(0)) return;
    await this.postings.postPlatformFee(tx, walletId, amount, ctx);
  }

  async createWalletTransaction(
    tx: TxClient,
    params: CreateWalletTransactionParams,
  ) {
    const { ctx } = params;
    if (
      await this.assertIdempotentTx(tx, params.walletId, ctx.idempotencyKey)
    ) {
      return tx.walletTransaction.findFirstOrThrow({
        where: {
          walletId: params.walletId,
          idempotencyKey: ctx.idempotencyKey!.trim(),
        },
      });
    }

    return tx.walletTransaction.create({
      data: {
        walletId: params.walletId,
        txType: params.txType,
        direction: params.direction,
        amount: params.amount,
        feeAmount: params.feeAmount,
        netAmount: params.netAmount,
        currency: params.currency,
        status: params.status,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        operationType: ctx.operationType,
        idempotencyKey: ctx.idempotencyKey?.trim() ?? null,
        actorUserId: ctx.actorUserId ?? null,
        actorRole: ctx.actorRole,
        reversalOfTxId: params.reversalOfTxId ?? null,
        metadata: ctx.metadata ?? Prisma.JsonNull,
        happenedAt: params.happenedAt ?? new Date(),
        settledAt:
          params.status === WalletTxStatus.COMPLETED ? new Date() : null,
      },
    });
  }

  /** Expected balances from ledger postings (falls back to legacy tx sum if no postings). */
  async expectedBalances(
    tx: TxClient,
    walletId: string,
  ): Promise<{
    available: Prisma.Decimal;
    locked: Prisma.Decimal;
    pending: Prisma.Decimal;
    source: 'ledger_postings' | 'legacy_transactions';
  }> {
    const postingCount = await tx.ledgerPosting.count({ where: { walletId } });
    if (postingCount === 0) {
      const legacy = await this.postings.sumFromCompletedTransactions(
        tx,
        walletId,
      );
      return {
        available: legacy.available,
        locked: legacy.locked,
        pending: new Prisma.Decimal(0),
        source: 'legacy_transactions',
      };
    }

    const [available, locked, pending] = await Promise.all([
      this.postings.sumAccountBalance(
        tx,
        walletId,
        LedgerAccount.USER_AVAILABLE,
      ),
      this.postings.sumAccountBalance(tx, walletId, LedgerAccount.USER_LOCKED),
      this.postings.sumAccountBalance(tx, walletId, LedgerAccount.USER_PENDING),
    ]);

    return { available, locked, pending, source: 'ledger_postings' };
  }
}
