import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DepositStatus,
  LedgerOperationType,
  Prisma,
  WalletTxStatus,
} from '@prisma/client';
import { WalletLedgerService } from '../common/wallet-ledger.service';
import { throwAdminError } from '../common/admin-http.util';
import type { LedgerMutationContext } from '../common/ledger-mutation.types';

type DepositWithTx = Prisma.DepositGetPayload<{
  include: { walletTx: { include: { wallet: true } } };
}>;

@Injectable()
export class AdminDepositSettlementService {
  constructor(private readonly ledger: WalletLedgerService) {}

  async settleConfirmed(
    tx: Prisma.TransactionClient,
    row: DepositWithTx,
    ctx: LedgerMutationContext,
  ): Promise<void> {
    if (
      row.status === DepositStatus.CONFIRMED ||
      row.status === DepositStatus.CREDITED
    ) {
      throwAdminError(
        'DEPOSIT_ALREADY_SETTLED',
        'Deposit already confirmed',
        HttpStatus.CONFLICT,
      );
    }
    const walletId = row.walletTx.walletId;
    const net = row.walletTx.netAmount;
    await this.ledger.creditAvailable(tx, walletId, net, {
      ...ctx,
      operationType: LedgerOperationType.DEPOSIT_SETTLE,
      sourceEntityType: 'deposit',
      sourceEntityId: row.id,
      idempotencyKey: `deposit-settle:${row.id}`,
      walletTransactionId: row.walletTxId,
    });
    await tx.walletTransaction.update({
      where: { id: row.walletTxId },
      data: { status: WalletTxStatus.COMPLETED, settledAt: new Date() },
    });
    await tx.deposit.update({
      where: { id: row.id },
      data: {
        status: DepositStatus.CREDITED,
        receivedAt: new Date(),
        creditedAt: new Date(),
      },
    });
  }

  async markFailed(
    tx: Prisma.TransactionClient,
    row: DepositWithTx,
  ): Promise<void> {
    if (
      row.status === DepositStatus.CONFIRMED ||
      row.status === DepositStatus.CREDITED
    ) {
      throwAdminError(
        'DEPOSIT_ALREADY_SETTLED',
        'Cannot fail confirmed deposit',
        HttpStatus.CONFLICT,
      );
    }
    await tx.walletTransaction.update({
      where: { id: row.walletTxId },
      data: { status: WalletTxStatus.FAILED },
    });
    await tx.deposit.update({
      where: { id: row.id },
      data: { status: DepositStatus.FAILED },
    });
  }
}
