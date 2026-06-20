import { Injectable, Logger } from '@nestjs/common';
import {
  ActorRole,
  DepositIngestionSource,
  DepositStatus,
  DepositWatcherStatus,
  LedgerOperationType,
  Prisma,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import type { IncomingUsdtTransfer } from './types/incoming-transfer.type';
import {
  DEPOSIT_BLOCKCHAIN_PROVIDER,
  type DepositBlockchainProvider,
} from './providers/deposit-blockchain-provider.interface';
import { Inject } from '@nestjs/common';
import { ComplianceRiskScoringService } from '../compliance/compliance-risk-scoring.service';
import { NotificationEventsService } from '../notifications/notification-events.service';
import { ReferralEventsService } from '../referrals/referral-events.service';

@Injectable()
export class DepositIngestionService {
  private readonly logger = new Logger(DepositIngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedgerService,
    @Inject(DEPOSIT_BLOCKCHAIN_PROVIDER)
    private readonly provider: DepositBlockchainProvider,
    private readonly riskScoring: ComplianceRiskScoringService,
    private readonly notificationEvents: NotificationEventsService,
    private readonly referralEvents: ReferralEventsService,
  ) {}

  async providerHealth() {
    return this.provider.health();
  }

  async tick(): Promise<{
    scanned: number;
    credited: number;
    ignored: number;
  }> {
    const watcher = await this.getWatcher();
    const transfers = await this.provider.fetchTransfersSince(
      watcher.lastScannedBlock,
    );
    if (!transfers.length) {
      await this.markWatcher(
        watcher.id,
        watcher.lastScannedBlock,
        DepositWatcherStatus.IDLE,
      );
      return { scanned: 0, credited: 0, ignored: 0 };
    }

    let credited = 0;
    let ignored = 0;
    let maxBlock = watcher.lastScannedBlock;

    for (const transfer of transfers) {
      if (transfer.blockNumber > maxBlock) maxBlock = transfer.blockNumber;
      const result = await this.processTransfer(transfer);
      if (result === 'credited') credited += 1;
      if (result === 'ignored') ignored += 1;
    }

    await this.markWatcher(watcher.id, maxBlock, DepositWatcherStatus.IDLE);
    return { scanned: transfers.length, credited, ignored };
  }

  private async processTransfer(
    transfer: IncomingUsdtTransfer,
  ): Promise<'credited' | 'ignored' | 'pending'> {
    const requiredConfirmations = Number(process.env.TRON_CONFIRMATIONS ?? 20);
    const usdtContract = (process.env.TRON_USDT_CONTRACT ?? '')
      .trim()
      .toLowerCase();
    const normalizedToken = transfer.tokenContract.trim().toLowerCase();
    if (usdtContract && normalizedToken !== usdtContract) {
      await this.log(null, transfer.txHash, 'ignored.wrong_token', {
        transfer: this.serializeTransfer(transfer),
      });
      return 'ignored';
    }
    if (transfer.network !== 'TRC20' || transfer.assetCode !== 'USDT') {
      await this.log(null, transfer.txHash, 'ignored.wrong_network_or_asset', {
        transfer: this.serializeTransfer(transfer),
      });
      return 'ignored';
    }

    const wallet = await this.prisma.wallet.findFirst({
      where: {
        address: transfer.toAddress,
        network: 'TRC20',
        assetCode: 'USDT',
      },
    });
    if (!wallet) {
      await this.log(null, transfer.txHash, 'ignored.unknown_address', {
        transfer: this.serializeTransfer(transfer),
      });
      return 'ignored';
    }

    const existing = await this.prisma.deposit.findFirst({
      where: { blockchainTxid: transfer.txHash },
      include: { walletTx: true },
    });
    if (existing?.status === DepositStatus.CREDITED) {
      await this.log(existing.id, transfer.txHash, 'duplicate.credited', {});
      return 'ignored';
    }

    const amount = new Prisma.Decimal(transfer.amount);
    const suspicious = amount.greaterThanOrEqualTo(new Prisma.Decimal(1000));

    const deposit = existing
      ? await this.prisma.deposit.update({
          where: { id: existing.id },
          data: {
            confirmations: transfer.confirmations,
            providerBlockNumber: transfer.blockNumber,
            tokenContract: transfer.tokenContract,
            status:
              transfer.confirmations >= requiredConfirmations
                ? DepositStatus.CONFIRMED
                : DepositStatus.PENDING_CONFIRMATIONS,
          },
          include: { walletTx: true },
        })
      : await this.prisma.$transaction(async (tx) => {
          const walletTx = await this.ledger.createWalletTransaction(tx, {
            walletId: wallet.id,
            txType: WalletTxType.DEPOSIT,
            direction: WalletTxDirection.IN,
            amount,
            feeAmount: new Prisma.Decimal(0),
            netAmount: amount,
            currency: 'USDT',
            status: WalletTxStatus.PENDING,
            referenceType: 'deposit',
            referenceId: null,
            ctx: {
              operationType: LedgerOperationType.DEPOSIT_SETTLE,
              sourceEntityType: 'deposit_ingestion',
              sourceEntityId: wallet.id,
              actorRole: ActorRole.SYSTEM,
              currency: 'USDT',
              idempotencyKey: `deposit-ingest-tx:${transfer.txHash}`,
            },
          });
          const created = await tx.deposit.create({
            data: {
              walletTxId: walletTx.id,
              blockchainTxid: transfer.txHash,
              fromAddress: transfer.fromAddress,
              toAddress: transfer.toAddress,
              confirmations: transfer.confirmations,
              requiredConfirmations,
              status:
                transfer.confirmations >= requiredConfirmations
                  ? DepositStatus.CONFIRMED
                  : DepositStatus.PENDING_CONFIRMATIONS,
              ingestionSource: DepositIngestionSource.AUTO,
              suspiciousFlag: suspicious,
              providerBlockNumber: transfer.blockNumber,
              tokenContract: transfer.tokenContract,
            },
            include: { walletTx: true },
          });
          await tx.walletTransaction.update({
            where: { id: walletTx.id },
            data: { referenceId: created.id },
          });
          return created;
        });

    await this.log(deposit.id, transfer.txHash, 'detected', {
      confirmations: transfer.confirmations,
      requiredConfirmations,
      suspicious,
    });

    if (transfer.confirmations < requiredConfirmations) {
      return 'pending';
    }

    const creditedPayload = await this.prisma.$transaction(async (tx) => {
      const row = await tx.deposit.findUniqueOrThrow({
        where: { id: deposit.id },
        include: { walletTx: { include: { wallet: true } } },
      });
      if (row.status === DepositStatus.CREDITED) return null;
      await this.ledger.creditAvailable(
        tx,
        row.walletTx.walletId,
        row.walletTx.netAmount,
        {
          operationType: LedgerOperationType.DEPOSIT_SETTLE,
          sourceEntityType: 'deposit',
          sourceEntityId: row.id,
          actorRole: ActorRole.SYSTEM,
          currency: row.walletTx.currency,
          idempotencyKey: `deposit-settle:${row.id}`,
          walletTransactionId: row.walletTxId,
        },
      );
      await tx.walletTransaction.update({
        where: { id: row.walletTxId },
        data: { status: WalletTxStatus.COMPLETED, settledAt: new Date() },
      });
      await tx.deposit.update({
        where: { id: row.id },
        data: {
          status: DepositStatus.CREDITED,
          creditedAt: new Date(),
          receivedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorRole: ActorRole.SYSTEM,
          entityType: 'deposit',
          entityId: row.id,
          action: 'deposit.auto_credited',
          afterJsonb: { source: 'auto', ledgerMutation: true },
        },
      });

      return {
        userId: row.walletTx.wallet.userId,
        depositId: row.id,
        amount: row.walletTx.amount,
        fromAddress: row.fromAddress,
      };
    });

    if (creditedPayload === null) {
      return 'pending';
    }
    const payload = creditedPayload;
    void this.riskScoring.evaluateDeposit(payload);
    void this.notificationEvents.depositCredited({
      userId: payload.userId,
      depositId: payload.depositId,
      amount: payload.amount.toString(),
    });
    void this.referralEvents.onFirstDeposit({
      userId: payload.userId,
      depositId: payload.depositId,
      amount: payload.amount,
    });
    await this.log(deposit.id, transfer.txHash, 'credited', {});
    return 'credited';
  }

  private async getWatcher() {
    return this.prisma.depositWatcherState.upsert({
      where: {
        network_assetCode: { network: 'TRC20', assetCode: 'USDT' },
      },
      create: {
        network: 'TRC20',
        assetCode: 'USDT',
        status: DepositWatcherStatus.IDLE,
      },
      update: {},
    });
  }

  private async markWatcher(
    id: string,
    lastScannedBlock: bigint,
    status: DepositWatcherStatus,
    error?: string,
  ) {
    await this.prisma.depositWatcherState.update({
      where: { id },
      data: {
        status,
        lastRunAt: new Date(),
        lastScannedBlock,
        lastError: error ?? null,
      },
    });
  }

  private serializeTransfer(
    transfer: IncomingUsdtTransfer,
  ): Prisma.InputJsonValue {
    return {
      txHash: transfer.txHash,
      toAddress: transfer.toAddress,
      fromAddress: transfer.fromAddress,
      amount: transfer.amount,
      assetCode: transfer.assetCode,
      network: transfer.network,
      tokenContract: transfer.tokenContract,
      blockNumber: transfer.blockNumber?.toString() ?? null,
      confirmations: transfer.confirmations,
    };
  }

  private async log(
    depositId: string | null,
    blockchainTxid: string,
    action: string,
    payload: Prisma.InputJsonValue,
  ) {
    await this.prisma.depositIngestionLog.create({
      data: { depositId, blockchainTxid, action, payload },
    });
  }
}
