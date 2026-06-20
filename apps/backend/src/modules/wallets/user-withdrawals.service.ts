import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import {
  ActorRole,
  ConsentSource,
  LedgerOperationType,
  Prisma,
  WalletStatus,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlatformFeeLedgerService } from '../admin/common/platform-fee-ledger.service';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { WithdrawalListQueryDto } from './dto/withdrawal-list-query.dto';
import { mapUserWithdrawal } from './mappers/user-withdrawal.mapper';
import {
  isValidTrc20Address,
  normalizeTrc20Address,
} from './validators/trc20-address.validator';
import { WalletAuditService } from './wallet-audit.service';
import { EligibilityService } from '../compliance/eligibility.service';
import { ComplianceRiskScoringService } from '../compliance/compliance-risk-scoring.service';
import { FeatureFlagsService } from '../../common/platform/feature-flags/feature-flags.service';
import { OperationalLimitsService } from '../treasury/operational-limits.service';
import { NotificationEventsService } from '../notifications/notification-events.service';

@Injectable()
export class UserWithdrawalsService {
  private readonly logger = new Logger(UserWithdrawalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedgerService,
    private readonly feeLedger: PlatformFeeLedgerService,
    private readonly audit: WalletAuditService,
    private readonly config: ConfigService,
    private readonly eligibility: EligibilityService,
    private readonly riskScoring: ComplianceRiskScoringService,
    private readonly notificationEvents: NotificationEventsService,
    private readonly flags: FeatureFlagsService,
    private readonly operationalLimits: OperationalLimitsService,
  ) {}

  private include() {
    return {
      walletTx: true,
    } satisfies Prisma.WithdrawalInclude;
  }

  private walletConfig() {
    return this.config.get<{
      defaultAssetCode: string;
      defaultNetwork: string;
      minWithdrawalUsdt: number;
      defaultWithdrawalFeeUsdt: number;
    }>('wallet')!;
  }

  private async resolveWithdrawalFee(): Promise<Prisma.Decimal> {
    const active = await this.prisma.platformFeeSetting.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (active) {
      return active.withdrawalFeeFixed;
    }
    return new Prisma.Decimal(this.walletConfig().defaultWithdrawalFeeUsdt);
  }

  private async getUserWallet(userId: string) {
    const { defaultAssetCode, defaultNetwork } = this.walletConfig();
    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId_assetCode_network: {
          userId,
          assetCode: defaultAssetCode,
          network: defaultNetwork,
        },
      },
      include: { balance: true },
    });
    if (!wallet?.balance || wallet.status !== WalletStatus.ACTIVE) {
      throwAdminError(
        'WALLET_NOT_FOUND',
        'Active USDT wallet not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return wallet;
  }

  async create(
    userId: string,
    dto: CreateWithdrawalDto,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.flags.assertEnabled('enableWithdrawals');
    const reqIdempotency = dto.idempotencyKey?.trim();
    if (reqIdempotency) {
      const existing = await this.prisma.withdrawal.findFirst({
        where: { idempotencyKey: reqIdempotency },
        include: this.include(),
      });
      if (existing) return mapUserWithdrawal(existing);
    }
    const toAddress = normalizeTrc20Address(dto.toAddress);
    if (!isValidTrc20Address(toAddress)) {
      throwAdminError(
        'INVALID_TRC20_ADDRESS',
        'Invalid TRC20 withdrawal address',
        HttpStatus.BAD_REQUEST,
      );
    }

    const amount = new Prisma.Decimal(dto.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throwAdminError(
        'INVALID_AMOUNT',
        'Withdrawal amount must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }

    const minWithdrawal = new Prisma.Decimal(
      this.walletConfig().minWithdrawalUsdt,
    );
    if (amount.lessThan(minWithdrawal)) {
      throwAdminError(
        'MIN_WITHDRAWAL',
        `Minimum withdrawal is ${minWithdrawal.toString()} USDT`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const feeAmount = await this.resolveWithdrawalFee();
    const netAmount = amount.minus(feeAmount);
    if (netAmount.lessThanOrEqualTo(0)) {
      throwAdminError(
        'AMOUNT_TOO_SMALL',
        'Amount must exceed withdrawal fee',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.eligibility.assertAllowed(userId, ConsentSource.WITHDRAWAL);
    await this.operationalLimits.assertUserWithdrawalWithinLimits(userId, amount);

    const wallet = await this.getUserWallet(userId);
    if (wallet.balance!.available.lessThan(amount)) {
      throwAdminError(
        'INSUFFICIENT_BALANCE',
        'Insufficient available balance',
        HttpStatus.CONFLICT,
      );
    }

    const { defaultAssetCode } = this.walletConfig();

    const withdrawalId = randomUUID();
    const ledgerIdempotencySuffix = reqIdempotency ?? withdrawalId;

    const created = await this.prisma.$transaction(async (tx) => {
      await this.ledger.lockFromAvailable(tx, wallet.id, amount, {
        operationType: LedgerOperationType.WITHDRAWAL_LOCK,
        sourceEntityType: 'withdrawal',
        sourceEntityId: withdrawalId,
        actorUserId: userId,
        actorRole: ActorRole.USER,
        currency: defaultAssetCode,
        idempotencyKey: `withdrawal-lock:${ledgerIdempotencySuffix}`,
      });

      const walletTx = await this.ledger.createWalletTransaction(tx, {
        walletId: wallet.id,
        txType: WalletTxType.WITHDRAWAL,
        direction: WalletTxDirection.OUT,
        amount,
        feeAmount,
        netAmount,
        currency: defaultAssetCode,
        status: WalletTxStatus.PENDING,
        referenceType: 'withdrawal',
        referenceId: withdrawalId,
        ctx: {
          operationType: LedgerOperationType.WITHDRAWAL_LOCK,
          sourceEntityType: 'withdrawal',
          sourceEntityId: withdrawalId,
          actorUserId: userId,
          actorRole: ActorRole.USER,
          currency: defaultAssetCode,
          idempotencyKey: `withdrawal-tx:${ledgerIdempotencySuffix}`,
        },
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          id: withdrawalId,
          walletTxId: walletTx.id,
          toAddress,
          status: WithdrawalStatus.LOCKED,
          idempotencyKey: reqIdempotency ?? null,
          suspiciousFlag: amount.greaterThanOrEqualTo(new Prisma.Decimal(1000)),
          requestedAt: new Date(),
        },
        include: this.include(),
      });

      if (feeAmount.greaterThan(0)) {
        await this.feeLedger.recordFee(tx, {
          walletTransactionId: walletTx.id,
          feeCode: 'withdrawal_fee',
          subjectType: 'withdrawal',
          subjectId: withdrawal.id,
          amount: feeAmount,
          currency: defaultAssetCode,
          fixedAmount: feeAmount,
        });
        await this.ledger.recordPlatformFee(tx, wallet.id, feeAmount, {
          operationType: LedgerOperationType.PLATFORM_FEE,
          sourceEntityType: 'withdrawal',
          sourceEntityId: withdrawal.id,
          actorUserId: userId,
          actorRole: ActorRole.USER,
          currency: defaultAssetCode,
          walletTransactionId: walletTx.id,
          idempotencyKey: `withdrawal-fee-ledger:${withdrawal.id}`,
        });
      }

      return tx.withdrawal.findUniqueOrThrow({
        where: { id: withdrawal.id },
        include: this.include(),
      });
    });

    void this.riskScoring
      .evaluateWithdrawal({
        userId,
        withdrawalId: created.id,
        amount,
        toAddress,
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `Withdrawal risk scoring failed for ${created.id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });

    await this.audit.logUserAction({
      actorUserId: userId,
      entityType: 'withdrawal',
      entityId: created.id,
      action: 'withdrawal.requested',
      after: {
        amount: amount.toString(),
        fee: feeAmount.toString(),
        netAmount: netAmount.toString(),
        toAddress,
        ledgerMutation: true,
      },
      ...meta,
    });

    void this.notificationEvents
      .withdrawalRequested({
        userId,
        withdrawalId: created.id,
        amount: amount.toString(),
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `Withdrawal notification failed for ${created.id}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });

    return mapUserWithdrawal(created);
  }

  async list(userId: string, query: WithdrawalListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const wallet = await this.getUserWallet(userId);

    const where: Prisma.WithdrawalWhereInput = {
      walletTx: { walletId: wallet.id },
    };

    const [total, rows] = await Promise.all([
      this.prisma.withdrawal.count({ where }),
      this.prisma.withdrawal.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { requestedAt: 'desc' },
        include: this.include(),
      }),
    ]);

    return {
      items: rows.map(mapUserWithdrawal),
      total,
      page,
      pageSize,
      hasMore: skip + rows.length < total,
    };
  }

  async getById(userId: string, id: string) {
    const wallet = await this.getUserWallet(userId);
    const row = await this.prisma.withdrawal.findFirst({
      where: { id, walletTx: { walletId: wallet.id } },
      include: this.include(),
    });
    if (!row) {
      throwAdminError(
        'WITHDRAWAL_NOT_FOUND',
        'Withdrawal not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return mapUserWithdrawal(row);
  }

  async cancel(
    userId: string,
    id: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    const wallet = await this.getUserWallet(userId);
    const row = await this.prisma.withdrawal.findFirst({
      where: { id, walletTx: { walletId: wallet.id } },
      include: this.include(),
    });
    if (!row) {
      throwAdminError(
        'WITHDRAWAL_NOT_FOUND',
        'Withdrawal not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      row.status !== WithdrawalStatus.REQUESTED &&
      row.status !== WithdrawalStatus.LOCKED &&
      row.status !== WithdrawalStatus.REVIEW
    ) {
      throwAdminError(
        'WITHDRAWAL_NOT_CANCELLABLE',
        'Cannot cancel withdrawal in current status',
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.ledger.unlockToAvailable(
        tx,
        row.walletTx.walletId,
        row.walletTx.amount,
        {
          operationType: LedgerOperationType.WITHDRAWAL_UNLOCK,
          sourceEntityType: 'withdrawal',
          sourceEntityId: row.id,
          actorUserId: userId,
          actorRole: ActorRole.USER,
          currency: row.walletTx.currency,
          walletTransactionId: row.walletTxId,
          idempotencyKey: `withdrawal-user-cancel-unlock:${row.id}`,
        },
      );
      await tx.walletTransaction.update({
        where: { id: row.walletTxId },
        data: { status: WalletTxStatus.CANCELLED },
      });
      await tx.withdrawal.update({
        where: { id: row.id },
        data: {
          status: WithdrawalStatus.CANCELLED,
          rejectionReason: 'user_cancelled',
        },
      });
    });

    await this.audit.logUserAction({
      actorUserId: userId,
      entityType: 'withdrawal',
      entityId: row.id,
      action: 'withdrawal.cancelled',
      after: { ledgerMutation: true },
      ...meta,
    });

    const updated = await this.prisma.withdrawal.findUniqueOrThrow({
      where: { id: row.id },
      include: this.include(),
    });
    return mapUserWithdrawal(updated);
  }
}
