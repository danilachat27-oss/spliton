import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLocale, Prisma } from '@prisma/client';
import { normalizeDepositLang } from '../../common/i18n/app-locale';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { isValidTrc20Address } from '../wallets/validators/trc20-address.validator';

export type DepositNetworkSettingsDto = {
  id: string;
  asset: string;
  network: string;
  chain: string;
  tokenContractAddress: string | null;
  tokenDecimals: number;
  minDepositAmount: string;
  minConfirmations: number;
  estimatedCreditTimeMinutes: number;
  withdrawAvailableAfterMinutes: number;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  providerMode: string;
  providerName: string | null;
  explorerTxUrlTemplate: string | null;
  explorerAddressUrlTemplate: string | null;
  explorerTokenUrlTemplate: string | null;
  userWarningRu: string | null;
  userWarningEn: string | null;
  userWarningKa: string | null;
  maintenanceMessageRu: string | null;
  maintenanceMessageEn: string | null;
  maintenanceMessageKa: string | null;
  updatedAt: string;
};

export type DepositProviderStatus = 'healthy' | 'degraded' | 'disabled' | 'misconfigured';

const DEFAULT_WARNINGS_RU = [
  'Отправляйте только USDT в сети TRC20',
  'Другие активы и сети могут быть потеряны',
  'Зачисление после подтверждений в сети',
];

@Injectable()
export class DepositNetworkSettingsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (process.env.SKIP_SCHEMA_BOOTSTRAP === 'true') return;
    await this.ensureDefaults();
  }

  async ensureDefaults() {
    const tron = this.config.get<{
      mode: string;
      usdtContract: string;
      confirmations: number;
    }>('tron')!;
    const wallet = this.config.get<{ defaultAssetCode: string; defaultNetwork: string }>(
      'wallet',
    )!;

    await this.prisma.depositNetworkSettings.upsert({
      where: { id: 'usdt-trc20' },
      create: {
        id: 'usdt-trc20',
        asset: wallet.defaultAssetCode,
        network: wallet.defaultNetwork,
        chain: 'TRON',
        tokenContractAddress: tron.usdtContract || null,
        tokenDecimals: 6,
        minDepositAmount: new Prisma.Decimal('0.01'),
        minConfirmations: tron.confirmations,
        estimatedCreditTimeMinutes: 1,
        withdrawAvailableAfterMinutes: 2,
        depositEnabled: true,
        withdrawalEnabled: true,
        providerMode: tron.mode,
        providerName: tron.mode === 'mock' ? 'Mock TRON' : 'TRON',
        explorerTxUrlTemplate:
          'https://tronscan.org/#/transaction/{txid}',
        explorerAddressUrlTemplate:
          'https://tronscan.org/#/address/{address}',
        explorerTokenUrlTemplate:
          'https://tronscan.org/#/token20/{contract}',
        userWarningRu: DEFAULT_WARNINGS_RU.join('\n'),
        userWarningEn:
          'Send USDT on TRC20 only. Other assets/networks may be lost. Credit after confirmations.',
        userWarningKa: null,
      },
      update: {},
    });
  }

  async getForAssetNetwork(
    asset = 'USDT',
    network = 'TRC20',
  ): Promise<DepositNetworkSettingsDto> {
    const row = await this.prisma.depositNetworkSettings.findFirst({
      where: { asset, network },
    });
    if (!row) {
      await this.ensureDefaults();
      const again = await this.prisma.depositNetworkSettings.findFirst({
        where: { asset, network },
      });
      if (!again) {
        throwAdminError(
          'DEPOSIT_SETTINGS_NOT_FOUND',
          'Deposit network settings not configured',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      return this.map(again!);
    }
    return this.map(row);
  }

  resolveProviderStatus(
    settings: DepositNetworkSettingsDto,
  ): DepositProviderStatus {
    const nodeEnv =
      this.config.get<string>('app.nodeEnv') ?? process.env.NODE_ENV ?? 'development';
    const isProd = nodeEnv === 'production';

    if (!settings.tokenContractAddress?.trim()) {
      return isProd ? 'misconfigured' : 'degraded';
    }
    if (!settings.depositEnabled) return 'disabled';
    if (settings.providerMode === 'mock' && isProd) return 'degraded';
    if (settings.providerMode === 'mock') return 'degraded';
    return 'healthy';
  }

  assertProductionReady(settings: DepositNetworkSettingsDto): void {
    const nodeEnv =
      this.config.get<string>('app.nodeEnv') ?? process.env.NODE_ENV ?? 'development';
    if (nodeEnv !== 'production') return;
    if (!settings.tokenContractAddress?.trim()) {
      throwAdminError(
        'DEPOSIT_MISCONFIGURED',
        'Token contract is not configured for production deposits',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  pickUserWarning(
    settings: DepositNetworkSettingsDto,
    lang?: string,
  ): string[] {
    const locale = normalizeDepositLang(lang);
    const text =
      locale === AppLocale.en ||
      locale === AppLocale.es ||
      locale === AppLocale.pt
        ? (settings.userWarningEn ??
          settings.userWarningRu ??
          settings.userWarningKa)
        : (settings.userWarningRu ?? settings.userWarningKa);
    const raw = text?.trim() || settings.userWarningRu?.trim() || DEFAULT_WARNINGS_RU.join('\n');
    return raw.split('\n').map((s) => s.trim()).filter(Boolean);
  }

  pickMaintenanceMessage(
    settings: DepositNetworkSettingsDto,
    lang?: string,
  ): string | null {
    const locale = normalizeDepositLang(lang);
    if (
      locale === AppLocale.en ||
      locale === AppLocale.es ||
      locale === AppLocale.pt
    ) {
      return (
        settings.maintenanceMessageEn ??
        settings.maintenanceMessageRu ??
        settings.maintenanceMessageKa
      );
    }
    return settings.maintenanceMessageRu ?? settings.maintenanceMessageKa;
  }

  buildExplorerUrl(
    template: string | null,
    vars: Record<string, string>,
  ): string | null {
    if (!template?.trim()) return null;
    let url = template;
    for (const [k, v] of Object.entries(vars)) {
      url = url.replace(`{${k}}`, encodeURIComponent(v));
    }
    return url;
  }

  async updateSettings(
    actorUserId: string,
    patch: Partial<DepositNetworkSettingsDto> & { reason?: string },
    opts?: { requireReason?: boolean },
  ): Promise<DepositNetworkSettingsDto> {
    if (opts?.requireReason && !patch.reason?.trim()) {
      throwAdminError(
        'REASON_REQUIRED',
        'Укажите причину изменения настроек',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      patch.tokenContractAddress != null &&
      patch.tokenContractAddress.trim() &&
      !isValidTrc20Address(patch.tokenContractAddress)
    ) {
      throwAdminError(
        'INVALID_TRC20_CONTRACT',
        'Некорректный адрес контракта TRC20',
        HttpStatus.BAD_REQUEST,
      );
    }

    const data: Prisma.DepositNetworkSettingsUpdateInput = {
      updatedByUserId: actorUserId,
    };
    if (patch.tokenContractAddress !== undefined) {
      data.tokenContractAddress = patch.tokenContractAddress?.trim() || null;
    }
    if (patch.tokenDecimals != null) data.tokenDecimals = patch.tokenDecimals;
    if (patch.minDepositAmount != null) {
      data.minDepositAmount = new Prisma.Decimal(patch.minDepositAmount);
    }
    if (patch.minConfirmations != null) {
      data.minConfirmations = patch.minConfirmations;
    }
    if (patch.estimatedCreditTimeMinutes != null) {
      data.estimatedCreditTimeMinutes = patch.estimatedCreditTimeMinutes;
    }
    if (patch.withdrawAvailableAfterMinutes != null) {
      data.withdrawAvailableAfterMinutes = patch.withdrawAvailableAfterMinutes;
    }
    if (patch.depositEnabled != null) data.depositEnabled = patch.depositEnabled;
    if (patch.withdrawalEnabled != null) {
      data.withdrawalEnabled = patch.withdrawalEnabled;
    }
    if (patch.providerMode != null) data.providerMode = patch.providerMode;
    if (patch.providerName !== undefined) data.providerName = patch.providerName;
    if (patch.explorerTxUrlTemplate !== undefined) {
      data.explorerTxUrlTemplate = patch.explorerTxUrlTemplate;
    }
    if (patch.explorerAddressUrlTemplate !== undefined) {
      data.explorerAddressUrlTemplate = patch.explorerAddressUrlTemplate;
    }
    if (patch.explorerTokenUrlTemplate !== undefined) {
      data.explorerTokenUrlTemplate = patch.explorerTokenUrlTemplate;
    }
    if (patch.userWarningRu !== undefined) data.userWarningRu = patch.userWarningRu;
    if (patch.userWarningEn !== undefined) data.userWarningEn = patch.userWarningEn;
    if (patch.userWarningKa !== undefined) data.userWarningKa = patch.userWarningKa;
    if (patch.maintenanceMessageRu !== undefined) {
      data.maintenanceMessageRu = patch.maintenanceMessageRu;
    }
    if (patch.maintenanceMessageEn !== undefined) {
      data.maintenanceMessageEn = patch.maintenanceMessageEn;
    }
    if (patch.maintenanceMessageKa !== undefined) {
      data.maintenanceMessageKa = patch.maintenanceMessageKa;
    }

    const row = await this.prisma.depositNetworkSettings.update({
      where: { id: 'usdt-trc20' },
      data,
    });
    return this.map(row);
  }

  private map(row: {
    id: string;
    asset: string;
    network: string;
    chain: string;
    tokenContractAddress: string | null;
    tokenDecimals: number;
    minDepositAmount: Prisma.Decimal;
    minConfirmations: number;
    estimatedCreditTimeMinutes: number;
    withdrawAvailableAfterMinutes: number;
    depositEnabled: boolean;
    withdrawalEnabled: boolean;
    providerMode: string;
    providerName: string | null;
    explorerTxUrlTemplate: string | null;
    explorerAddressUrlTemplate: string | null;
    explorerTokenUrlTemplate: string | null;
    userWarningRu: string | null;
    userWarningEn: string | null;
    userWarningKa: string | null;
    maintenanceMessageRu: string | null;
    maintenanceMessageEn: string | null;
    maintenanceMessageKa: string | null;
    updatedAt: Date;
  }): DepositNetworkSettingsDto {
    return {
      id: row.id,
      asset: row.asset,
      network: row.network,
      chain: row.chain,
      tokenContractAddress: row.tokenContractAddress,
      tokenDecimals: row.tokenDecimals,
      minDepositAmount: row.minDepositAmount.toString(),
      minConfirmations: row.minConfirmations,
      estimatedCreditTimeMinutes: row.estimatedCreditTimeMinutes,
      withdrawAvailableAfterMinutes: row.withdrawAvailableAfterMinutes,
      depositEnabled: row.depositEnabled,
      withdrawalEnabled: row.withdrawalEnabled,
      providerMode: row.providerMode,
      providerName: row.providerName,
      explorerTxUrlTemplate: row.explorerTxUrlTemplate,
      explorerAddressUrlTemplate: row.explorerAddressUrlTemplate,
      explorerTokenUrlTemplate: row.explorerTokenUrlTemplate,
      userWarningRu: row.userWarningRu,
      userWarningEn: row.userWarningEn,
      userWarningKa: row.userWarningKa,
      maintenanceMessageRu: row.maintenanceMessageRu,
      maintenanceMessageEn: row.maintenanceMessageEn,
      maintenanceMessageKa: row.maintenanceMessageKa,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
