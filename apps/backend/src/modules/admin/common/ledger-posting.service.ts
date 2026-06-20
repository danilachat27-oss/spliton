import { Injectable } from '@nestjs/common';
import {
  ActorRole,
  LedgerAccount,
  LedgerOperationType,
  LedgerPostingSide,
  Prisma,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import type { LedgerMutationContext } from './ledger-mutation.types';

type TxClient = Prisma.TransactionClient | PrismaService;

type PostingLine = {
  account: LedgerAccount;
  side: LedgerPostingSide;
  amount: Prisma.Decimal;
};

@Injectable()
export class LedgerPostingService {
  async postBalancedEntries(
    tx: TxClient,
    walletId: string,
    lines: PostingLine[],
    ctx: LedgerMutationContext,
  ): Promise<void> {
    if (lines.length < 2) {
      throw new Error('Ledger posting requires at least two lines');
    }

    const debits = lines
      .filter((l) => l.side === LedgerPostingSide.DEBIT)
      .reduce((s, l) => s.plus(l.amount), new Prisma.Decimal(0));
    const credits = lines
      .filter((l) => l.side === LedgerPostingSide.CREDIT)
      .reduce((s, l) => s.plus(l.amount), new Prisma.Decimal(0));

    if (!debits.equals(credits)) {
      throw new Error(
        `Unbalanced ledger posting: debits=${debits.toString()} credits=${credits.toString()}`,
      );
    }

    if (ctx.idempotencyKey) {
      const dup = await tx.ledgerPosting.findFirst({
        where: { walletId, idempotencyKey: ctx.idempotencyKey },
      });
      if (dup) {
        return;
      }
    }

    // One idempotency key per balanced entry (two posting lines); unique index is per wallet+key.
    const entryIdempotencyKey = ctx.idempotencyKey?.trim() ?? null;
    let lineIndex = 0;
    for (const line of lines) {
      if (line.amount.lessThanOrEqualTo(0)) continue;
      await tx.ledgerPosting.create({
        data: {
          walletId,
          ledgerAccount: line.account,
          side: line.side,
          amount: line.amount,
          currency: ctx.currency,
          operationType: ctx.operationType,
          sourceEntityType: ctx.sourceEntityType,
          sourceEntityId: ctx.sourceEntityId,
          walletTransactionId: ctx.walletTransactionId ?? null,
          actorUserId: ctx.actorUserId ?? null,
          actorRole: ctx.actorRole,
          idempotencyKey: lineIndex === 0 ? entryIdempotencyKey : null,
          metadata: ctx.metadata ?? Prisma.JsonNull,
        },
      });
      lineIndex += 1;
    }
  }

  /** User available ↔ locked transfer (balanced). */
  async postAvailableToLocked(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    await this.postBalancedEntries(
      tx,
      walletId,
      [
        {
          account: LedgerAccount.USER_AVAILABLE,
          side: LedgerPostingSide.DEBIT,
          amount,
        },
        {
          account: LedgerAccount.USER_LOCKED,
          side: LedgerPostingSide.CREDIT,
          amount,
        },
      ],
      ctx,
    );
  }

  async postLockedToAvailable(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    await this.postBalancedEntries(
      tx,
      walletId,
      [
        {
          account: LedgerAccount.USER_LOCKED,
          side: LedgerPostingSide.DEBIT,
          amount,
        },
        {
          account: LedgerAccount.USER_AVAILABLE,
          side: LedgerPostingSide.CREDIT,
          amount,
        },
      ],
      ctx,
    );
  }

  /** External inflow → user available (settlement debit, user credit). */
  async postSettlementToAvailable(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    await this.postBalancedEntries(
      tx,
      walletId,
      [
        {
          account: LedgerAccount.PLATFORM_SETTLEMENT,
          side: LedgerPostingSide.DEBIT,
          amount,
        },
        {
          account: LedgerAccount.USER_AVAILABLE,
          side: LedgerPostingSide.CREDIT,
          amount,
        },
      ],
      ctx,
    );
  }

  /** User available outflow → settlement (withdrawal / purchase). */
  async postAvailableToSettlement(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    await this.postBalancedEntries(
      tx,
      walletId,
      [
        {
          account: LedgerAccount.USER_AVAILABLE,
          side: LedgerPostingSide.DEBIT,
          amount,
        },
        {
          account: LedgerAccount.PLATFORM_SETTLEMENT,
          side: LedgerPostingSide.CREDIT,
          amount,
        },
      ],
      ctx,
    );
  }

  /** Locked funds sent on-chain. */
  async postLockedToSettlement(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    await this.postBalancedEntries(
      tx,
      walletId,
      [
        {
          account: LedgerAccount.USER_LOCKED,
          side: LedgerPostingSide.DEBIT,
          amount,
        },
        {
          account: LedgerAccount.PLATFORM_SETTLEMENT,
          side: LedgerPostingSide.CREDIT,
          amount,
        },
      ],
      ctx,
    );
  }

  async postPlatformFee(
    tx: TxClient,
    walletId: string,
    amount: Prisma.Decimal,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    await this.postBalancedEntries(
      tx,
      walletId,
      [
        {
          account: LedgerAccount.PLATFORM_SETTLEMENT,
          side: LedgerPostingSide.DEBIT,
          amount,
        },
        {
          account: LedgerAccount.PLATFORM_FEE,
          side: LedgerPostingSide.CREDIT,
          amount,
        },
      ],
      {
        ...ctx,
        operationType: LedgerOperationType.PLATFORM_FEE,
      },
    );
  }

  async sumAccountBalance(
    tx: TxClient,
    walletId: string,
    account: LedgerAccount,
  ): Promise<Prisma.Decimal> {
    const rows = await tx.ledgerPosting.groupBy({
      by: ['side'],
      where: {
        walletId,
        ledgerAccount: account,
        reversalOfPostingId: null,
      },
      _sum: { amount: true },
    });

    let credits = new Prisma.Decimal(0);
    let debits = new Prisma.Decimal(0);
    for (const row of rows) {
      const sum = row._sum.amount ?? new Prisma.Decimal(0);
      if (row.side === LedgerPostingSide.CREDIT) credits = credits.plus(sum);
      if (row.side === LedgerPostingSide.DEBIT) debits = debits.plus(sum);
    }
    return credits.minus(debits);
  }

  /**
   * Legacy fallback when wallet has no postings yet (pre-migration wallets).
   */
  async sumFromCompletedTransactions(
    tx: TxClient,
    walletId: string,
  ): Promise<{ available: Prisma.Decimal; locked: Prisma.Decimal }> {
    const txs = await tx.walletTransaction.findMany({
      where: { walletId, status: WalletTxStatus.COMPLETED },
      orderBy: { happenedAt: 'asc' },
    });

    let available = new Prisma.Decimal(0);
    let locked = new Prisma.Decimal(0);

    for (const row of txs) {
      const net = row.netAmount;
      if (
        row.txType === WalletTxType.WITHDRAWAL &&
        row.direction === WalletTxDirection.OUT
      ) {
        if (row.status === WalletTxStatus.PENDING) {
          locked = locked.plus(row.amount);
          available = available.minus(row.amount);
        } else {
          locked = locked.minus(row.amount);
        }
        continue;
      }
      if (row.direction === WalletTxDirection.IN) {
        available = available.plus(net);
      } else if (row.direction === WalletTxDirection.OUT) {
        available = available.minus(row.amount);
      }
    }

    return { available, locked };
  }

  static systemCtx(
    operationType: LedgerOperationType,
    sourceEntityType: string,
    sourceEntityId: string,
    currency: string,
  ): LedgerMutationContext {
    return {
      operationType,
      sourceEntityType,
      sourceEntityId,
      actorRole: ActorRole.SYSTEM,
      currency,
    };
  }
}
