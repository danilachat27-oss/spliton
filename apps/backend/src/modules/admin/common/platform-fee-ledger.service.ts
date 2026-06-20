import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class PlatformFeeLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async recordFee(
    tx: TxClient,
    params: {
      walletTransactionId: string;
      feeCode:
        | 'primary_purchase_fee'
        | 'secondary_market_fee'
        | 'withdrawal_fee';
      subjectType: string;
      subjectId: string;
      amount: Prisma.Decimal;
      currency: string;
      rate?: Prisma.Decimal | null;
      fixedAmount?: Prisma.Decimal | null;
    },
  ): Promise<void> {
    await tx.fee.create({
      data: {
        walletTransactionId: params.walletTransactionId,
        feeCode: params.feeCode,
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        rate: params.rate ?? null,
        fixedAmount: params.fixedAmount ?? null,
        amountCharged: params.amount,
        currency: params.currency,
      },
    });
  }
}
