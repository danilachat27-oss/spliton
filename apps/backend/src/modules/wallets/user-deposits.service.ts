import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DepositStatus } from '@prisma/client';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { DepositAddressProvider } from './deposit-address.provider';
import { DepositNetworkSettingsService } from '../treasury/deposit-network-settings.service';
import { UserWalletService } from './user-wallet.service';

@Injectable()
export class UserDepositsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly wallets: UserWalletService,
    private readonly depositAddress: DepositAddressProvider,
    private readonly networkSettings: DepositNetworkSettingsService,
  ) {}

  private walletConfig() {
    return this.config.get<{
      defaultAssetCode: string;
      defaultNetwork: string;
    }>('wallet')!;
  }

  async getDepositInfo(
    userId: string,
    opts?: { asset?: string; network?: string; lang?: string },
  ) {
    const { defaultAssetCode, defaultNetwork } = this.walletConfig();
    const asset = opts?.asset ?? defaultAssetCode;
    const network = opts?.network ?? defaultNetwork;
    const settings = await this.networkSettings.getForAssetNetwork(asset, network);
    const providerStatus = this.networkSettings.resolveProviderStatus(settings);
    const maintenanceMessage = this.networkSettings.pickMaintenanceMessage(
      settings,
      opts?.lang,
    );

    if (!settings.depositEnabled) {
      throwAdminError(
        'DEPOSIT_DISABLED',
        maintenanceMessage ??
          'Пополнение временно недоступно. Попробуйте позже или обратитесь в поддержку.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (providerStatus === 'misconfigured') {
      this.networkSettings.assertProductionReady(settings);
    }

    const wallet = await this.wallets.getOrCreateWallet(userId);
    const resolved = await this.depositAddress.resolveForUser(
      userId,
      wallet.id,
      wallet.address,
    );

    if (resolved.kind === 'unavailable') {
      throwAdminError(
        'DEPOSIT_ADDRESS_UNAVAILABLE',
        maintenanceMessage ??
          'Адрес для пополнения не настроен. Обратитесь в поддержку Spliton.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const address = resolved.address;
    if (address.startsWith('T_DEV_')) {
      const nodeEnv =
        this.config.get<string>('app.nodeEnv') ?? process.env.NODE_ENV ?? 'development';
      if (nodeEnv === 'production') {
        throwAdminError(
          'DEPOSIT_ADDRESS_UNAVAILABLE',
          'Пополнение временно недоступно',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    const qrPayload = address;
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    const warnings = this.networkSettings.pickUserWarning(settings, opts?.lang);
    const explorerAddressUrl = this.networkSettings.buildExplorerUrl(
      settings.explorerAddressUrlTemplate,
      { address },
    );
    const explorerTokenUrl = settings.tokenContractAddress
      ? this.networkSettings.buildExplorerUrl(settings.explorerTokenUrlTemplate, {
          contract: settings.tokenContractAddress,
        })
      : null;

    const creditMin = settings.estimatedCreditTimeMinutes;
    const withdrawMin = settings.withdrawAvailableAfterMinutes;

    return {
      asset: settings.asset,
      network: settings.network,
      chain: settings.chain,
      address,
      qrPayload,
      qrDataUrl,
      tokenContractAddress: settings.tokenContractAddress,
      tokenDecimals: settings.tokenDecimals,
      minDepositAmount: settings.minDepositAmount,
      minConfirmations: settings.minConfirmations,
      estimatedCreditTimeMinutes: creditMin,
      estimatedCreditTimeLabel: this.formatMinutesLabel(creditMin),
      withdrawAvailableAfterMinutes: withdrawMin,
      withdrawAvailableAfterLabel: this.formatMinutesLabel(withdrawMin),
      depositEnabled: settings.depositEnabled,
      withdrawalEnabled: settings.withdrawalEnabled,
      explorerAddressUrl,
      explorerTokenUrl,
      userWarnings: warnings,
      maintenanceMessage,
      providerStatus,
      addressStatus: 'ACTIVE',
      walletId: wallet.id,
      isDevPlaceholder: address.startsWith('T_DEV_'),
      updatedAt: settings.updatedAt,
    };
  }

  /** @deprecated Use getDepositInfo */
  async getDepositAddress(userId: string) {
    const info = await this.getDepositInfo(userId);
    return {
      walletId: info.walletId,
      asset: info.asset,
      network: info.network,
      address: info.address,
      warnings: info.userWarnings,
      isDevPlaceholder: info.isDevPlaceholder,
    };
  }

  private formatMinutesLabel(minutes: number): string {
    if (minutes <= 1) return '~ 1 минута';
    if (minutes < 5) return `~ ${minutes} минуты`;
    return `~ ${minutes} минут`;
  }

  private mapDeposit(row: {
    id: string;
    status: DepositStatus;
    confirmations: number;
    requiredConfirmations: number;
    blockchainTxid: string | null;
    createdAt: Date;
    walletTx: { amount: { toString(): string }; happenedAt: Date };
  }) {
    const statusMap: Record<DepositStatus, string> = {
      PENDING: 'pending',
      CONFIRMING: 'confirming',
      MANUAL_REVIEW: 'manual_review',
      CONFIRMED: 'completed',
      FAILED: 'failed',
      DETECTED: 'detected',
      PENDING_CONFIRMATIONS: 'pending_confirmations',
      CREDITED: 'completed',
      IGNORED: 'ignored',
    };
    return {
      id: row.id,
      amount: row.walletTx.amount.toString(),
      status: statusMap[row.status] ?? row.status.toLowerCase(),
      confirmations: row.confirmations,
      requiredConfirmations: row.requiredConfirmations,
      txHash: row.blockchainTxid,
      createdAt: row.createdAt.toISOString(),
      receivedAt: row.walletTx.happenedAt.toISOString(),
    };
  }

  async list(userId: string, page = 1, pageSize = 20) {
    const wallet = await this.wallets.getOrCreateWallet(userId);
    const skip = (page - 1) * pageSize;
    const where = { walletTx: { walletId: wallet.id } };
    const [total, rows] = await Promise.all([
      this.prisma.deposit.count({ where }),
      this.prisma.deposit.findMany({
        where,
        include: { walletTx: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);
    return {
      items: rows.map((r) => this.mapDeposit(r)),
      total,
      page,
      pageSize,
      hasMore: skip + rows.length < total,
    };
  }

  async getById(userId: string, depositId: string) {
    const wallet = await this.wallets.getOrCreateWallet(userId);
    const row = await this.prisma.deposit.findFirst({
      where: { id: depositId, walletTx: { walletId: wallet.id } },
      include: { walletTx: true },
    });
    if (!row) {
      throwAdminError(
        'DEPOSIT_NOT_FOUND',
        'Deposit not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.mapDeposit(row);
  }
}
