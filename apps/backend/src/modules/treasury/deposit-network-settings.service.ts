import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DepositNetworkSettingsStatus, Prisma } from '@prisma/client';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { isValidTrc20Address } from '../wallets/validators/trc20-address.validator';
import {
  formatMinutesLabel,
  pickLocalizedLines,
  pickLocalizedText,
} from './deposit-localized-text.util';

export type DepositNetworkSettingsDto = {
  id: string;
  asset: string;
  network: string;
  networkDisplayName: string | null;
  chain: string;
  tokenContractAddress: string | null;
  tokenDecimals: number;
  minDepositAmount: string;
  maxDepositAmount: string | null;
  minConfirmations: number;
  estimatedCreditTimeMinutes: number;
  withdrawAvailableAfterMinutes: number;
  depositEnabled: boolean;
  withdrawalEnabled: boolean;
  status: DepositNetworkSettingsStatus;
  poolLowThreshold: number;
  providerMode: string;
  providerName: string | null;
  explorerTxUrlTemplate: string | null;
  explorerAddressUrlTemplate: string | null;
  explorerTokenUrlTemplate: string | null;
  userWarningRu: string | null;
  userWarningEn: string | null;
  userWarningEs: string | null;
  userWarningPt: string | null;
  userWarningKa: string | null;
  maintenanceMessageRu: string | null;
  maintenanceMessageEn: string | null;
  maintenanceMessageEs: string | null;
  maintenanceMessagePt: string | null;
  maintenanceMessageKa: string | null;
  instructionsRu: string | null;
  instructionsEn: string | null;
  instructionsEs: string | null;
  instructionsPt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  updatedAt: string;
};

export type DepositProviderStatus = 'healthy' | 'degraded' | 'disabled' | 'misconfigured';

const DEFAULT_WARNINGS_RU = [
  'Отправляйте только USDT в сети TRC20',
  'Другие активы и сети могут быть потеряны',
  'Зачисление после подтверждений в сети',
];

const DEFAULT_WARNINGS_EN = [
  'Send USDT on TRC20 only',
  'Other assets or networks may be lost',
  'Credit after network confirmations',
];

const PREVIEW_ADDRESS = 'TPREVIEW00000000000000000000000001';
const SUPPORTED_NETWORKS = new Set(['TRC20']);

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
        networkDisplayName: `${wallet.defaultAssetCode} · ${wallet.defaultNetwork}`,
        chain: 'TRON',
        tokenContractAddress: tron.usdtContract || null,
        tokenDecimals: 6,
        minDepositAmount: new Prisma.Decimal('0.01'),
        minConfirmations: tron.confirmations,
        estimatedCreditTimeMinutes: 1,
        withdrawAvailableAfterMinutes: 2,
        depositEnabled: true,
        withdrawalEnabled: true,
        status: DepositNetworkSettingsStatus.ACTIVE,
        poolLowThreshold: 5,
        providerMode: tron.mode,
        providerName: tron.mode === 'mock' ? 'Mock TRON' : 'TRON',
        explorerTxUrlTemplate: 'https://tronscan.org/#/transaction/{txid}',
        explorerAddressUrlTemplate: 'https://tronscan.org/#/address/{address}',
        explorerTokenUrlTemplate: 'https://tronscan.org/#/token20/{contract}',
        userWarningRu: DEFAULT_WARNINGS_RU.join('\n'),
        userWarningEn: DEFAULT_WARNINGS_EN.join('\n'),
        instructionsRu:
          'Скопируйте адрес или отсканируйте QR-код и отправьте USDT (TRC20) с внешнего кошелька.',
        instructionsEn:
          'Copy the address or scan the QR code and send USDT (TRC20) from an external wallet.',
      },
      update: {},
    });
  }

  isUserVisible(settings: DepositNetworkSettingsDto): boolean {
    return (
      settings.status === DepositNetworkSettingsStatus.ACTIVE &&
      settings.depositEnabled
    );
  }

  assertPublishReady(settings: DepositNetworkSettingsDto): void {
    if (!settings.asset?.trim() || !settings.network?.trim()) {
      throwAdminError(
        'DEPOSIT_SETTINGS_INCOMPLETE',
        'Asset and network are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!SUPPORTED_NETWORKS.has(settings.network.trim().toUpperCase())) {
      throwAdminError(
        'UNSUPPORTED_NETWORK',
        'Unsupported deposit network',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!settings.tokenContractAddress?.trim()) {
      throwAdminError(
        'DEPOSIT_SETTINGS_INCOMPLETE',
        'Token contract address is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!isValidTrc20Address(settings.tokenContractAddress)) {
      throwAdminError(
        'INVALID_TRC20_CONTRACT',
        'Invalid TRC20 contract address',
        HttpStatus.BAD_REQUEST,
      );
    }
    const min = Number(settings.minDepositAmount);
    if (!Number.isFinite(min) || min <= 0) {
      throwAdminError(
        'DEPOSIT_SETTINGS_INCOMPLETE',
        'Minimum deposit amount must be greater than zero',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (settings.maxDepositAmount != null) {
      const max = Number(settings.maxDepositAmount);
      if (!Number.isFinite(max) || max < min) {
        throwAdminError(
          'INVALID_MAX_DEPOSIT',
          'Maximum deposit must be greater than or equal to minimum',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
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

    if (
      settings.status === DepositNetworkSettingsStatus.ARCHIVED ||
      settings.status === DepositNetworkSettingsStatus.DRAFT
    ) {
      return 'disabled';
    }
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

  pickUserWarning(settings: DepositNetworkSettingsDto, lang?: string): string[] {
    return pickLocalizedLines(
      {
        ru: settings.userWarningRu,
        en: settings.userWarningEn,
        es: settings.userWarningEs,
        pt: settings.userWarningPt,
        ka: settings.userWarningKa,
      },
      lang,
      DEFAULT_WARNINGS_RU,
    );
  }

  pickMaintenanceMessage(
    settings: DepositNetworkSettingsDto,
    lang?: string,
  ): string | null {
    return pickLocalizedText(
      {
        ru: settings.maintenanceMessageRu,
        en: settings.maintenanceMessageEn,
        es: settings.maintenanceMessageEs,
        pt: settings.maintenanceMessagePt,
        ka: settings.maintenanceMessageKa,
      },
      lang,
    );
  }

  pickInstructions(settings: DepositNetworkSettingsDto, lang?: string): string | null {
    return pickLocalizedText(
      {
        ru: settings.instructionsRu,
        en: settings.instructionsEn,
        es: settings.instructionsEs,
        pt: settings.instructionsPt,
      },
      lang,
    );
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

  async buildPreview(lang?: string) {
    const settings = await this.getForAssetNetwork();
    const warnings = this.pickUserWarning(settings, lang);
    const instructions = this.pickInstructions(settings, lang);
    const maintenanceMessage = this.pickMaintenanceMessage(settings, lang);
    const qrDataUrl = await QRCode.toDataURL(PREVIEW_ADDRESS, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    return {
      previewMode: true,
      depositEnabled: this.isUserVisible(settings),
      providerStatus: this.resolveProviderStatus(settings),
      asset: settings.asset,
      network: settings.network,
      networkDisplayName:
        settings.networkDisplayName ?? `${settings.asset} · ${settings.network}`,
      address: PREVIEW_ADDRESS,
      addressNote:
        'Preview only — each user receives a personal address from the pool.',
      qrPayload: PREVIEW_ADDRESS,
      qrDataUrl,
      tokenContractAddress: settings.tokenContractAddress,
      minDepositAmount: settings.minDepositAmount,
      maxDepositAmount: settings.maxDepositAmount,
      minConfirmations: settings.minConfirmations,
      estimatedCreditTimeLabel: formatMinutesLabel(
        settings.estimatedCreditTimeMinutes,
        lang,
      ),
      userWarnings: warnings,
      depositInstructions: instructions,
      maintenanceMessage,
      explorerAddressUrl: this.buildExplorerUrl(
        settings.explorerAddressUrlTemplate,
        { address: PREVIEW_ADDRESS },
      ),
    };
  }

  async updateSettings(
    actorUserId: string,
    patch: Partial<DepositNetworkSettingsDto> & {
      reason?: string;
      status?: DepositNetworkSettingsStatus;
    },
    opts?: { requireReason?: boolean },
  ): Promise<DepositNetworkSettingsDto> {
    if (opts?.requireReason && !patch.reason?.trim()) {
      throwAdminError(
        'REASON_REQUIRED',
        'Укажите причину изменения настроек',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (patch.network != null && !SUPPORTED_NETWORKS.has(patch.network.trim().toUpperCase())) {
      throwAdminError(
        'UNSUPPORTED_NETWORK',
        'Unsupported deposit network',
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

    const current = await this.getForAssetNetwork();
    const next: DepositNetworkSettingsDto = {
      ...current,
      ...patch,
      tokenContractAddress:
        patch.tokenContractAddress !== undefined
          ? patch.tokenContractAddress?.trim() || null
          : current.tokenContractAddress,
    };

    const enabling =
      (patch.depositEnabled === true && !current.depositEnabled) ||
      patch.status === DepositNetworkSettingsStatus.ACTIVE;
    if (enabling) {
      this.assertPublishReady({
        ...next,
        depositEnabled: true,
        status: DepositNetworkSettingsStatus.ACTIVE,
      });
    }

    const data: Prisma.DepositNetworkSettingsUpdateInput = {
      updatedByUserId: actorUserId,
    };
    if (patch.networkDisplayName !== undefined) {
      data.networkDisplayName = patch.networkDisplayName?.trim() || null;
    }
    if (patch.tokenContractAddress !== undefined) {
      data.tokenContractAddress = patch.tokenContractAddress?.trim() || null;
    }
    if (patch.tokenDecimals != null) data.tokenDecimals = patch.tokenDecimals;
    if (patch.minDepositAmount != null) {
      data.minDepositAmount = new Prisma.Decimal(patch.minDepositAmount);
    }
    if (patch.maxDepositAmount !== undefined) {
      data.maxDepositAmount = patch.maxDepositAmount?.trim()
        ? new Prisma.Decimal(patch.maxDepositAmount)
        : null;
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
    if (patch.poolLowThreshold != null) {
      data.poolLowThreshold = patch.poolLowThreshold;
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
    if (patch.userWarningEs !== undefined) data.userWarningEs = patch.userWarningEs;
    if (patch.userWarningPt !== undefined) data.userWarningPt = patch.userWarningPt;
    if (patch.userWarningKa !== undefined) data.userWarningKa = patch.userWarningKa;
    if (patch.maintenanceMessageRu !== undefined) {
      data.maintenanceMessageRu = patch.maintenanceMessageRu;
    }
    if (patch.maintenanceMessageEn !== undefined) {
      data.maintenanceMessageEn = patch.maintenanceMessageEn;
    }
    if (patch.maintenanceMessageEs !== undefined) {
      data.maintenanceMessageEs = patch.maintenanceMessageEs;
    }
    if (patch.maintenanceMessagePt !== undefined) {
      data.maintenanceMessagePt = patch.maintenanceMessagePt;
    }
    if (patch.maintenanceMessageKa !== undefined) {
      data.maintenanceMessageKa = patch.maintenanceMessageKa;
    }
    if (patch.instructionsRu !== undefined) data.instructionsRu = patch.instructionsRu;
    if (patch.instructionsEn !== undefined) data.instructionsEn = patch.instructionsEn;
    if (patch.instructionsEs !== undefined) data.instructionsEs = patch.instructionsEs;
    if (patch.instructionsPt !== undefined) data.instructionsPt = patch.instructionsPt;
    if (patch.status != null) {
      data.status = patch.status;
      if (patch.status === DepositNetworkSettingsStatus.ACTIVE) {
        data.publishedAt = new Date();
        data.publishedByUserId = actorUserId;
        data.archivedAt = null;
        data.archivedByUserId = null;
      }
      if (patch.status === DepositNetworkSettingsStatus.ARCHIVED) {
        data.archivedAt = new Date();
        data.archivedByUserId = actorUserId;
        data.depositEnabled = false;
      }
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
    networkDisplayName: string | null;
    chain: string;
    tokenContractAddress: string | null;
    tokenDecimals: number;
    minDepositAmount: Prisma.Decimal;
    maxDepositAmount: Prisma.Decimal | null;
    minConfirmations: number;
    estimatedCreditTimeMinutes: number;
    withdrawAvailableAfterMinutes: number;
    depositEnabled: boolean;
    withdrawalEnabled: boolean;
    status: DepositNetworkSettingsStatus;
    poolLowThreshold: number;
    providerMode: string;
    providerName: string | null;
    explorerTxUrlTemplate: string | null;
    explorerAddressUrlTemplate: string | null;
    explorerTokenUrlTemplate: string | null;
    userWarningRu: string | null;
    userWarningEn: string | null;
    userWarningEs: string | null;
    userWarningPt: string | null;
    userWarningKa: string | null;
    maintenanceMessageRu: string | null;
    maintenanceMessageEn: string | null;
    maintenanceMessageEs: string | null;
    maintenanceMessagePt: string | null;
    maintenanceMessageKa: string | null;
    instructionsRu: string | null;
    instructionsEn: string | null;
    instructionsEs: string | null;
    instructionsPt: string | null;
    publishedAt: Date | null;
    archivedAt: Date | null;
    updatedAt: Date;
  }): DepositNetworkSettingsDto {
    return {
      id: row.id,
      asset: row.asset,
      network: row.network,
      networkDisplayName: row.networkDisplayName,
      chain: row.chain,
      tokenContractAddress: row.tokenContractAddress,
      tokenDecimals: row.tokenDecimals,
      minDepositAmount: row.minDepositAmount.toString(),
      maxDepositAmount: row.maxDepositAmount?.toString() ?? null,
      minConfirmations: row.minConfirmations,
      estimatedCreditTimeMinutes: row.estimatedCreditTimeMinutes,
      withdrawAvailableAfterMinutes: row.withdrawAvailableAfterMinutes,
      depositEnabled: row.depositEnabled,
      withdrawalEnabled: row.withdrawalEnabled,
      status: row.status,
      poolLowThreshold: row.poolLowThreshold,
      providerMode: row.providerMode,
      providerName: row.providerName,
      explorerTxUrlTemplate: row.explorerTxUrlTemplate,
      explorerAddressUrlTemplate: row.explorerAddressUrlTemplate,
      explorerTokenUrlTemplate: row.explorerTokenUrlTemplate,
      userWarningRu: row.userWarningRu,
      userWarningEn: row.userWarningEn,
      userWarningEs: row.userWarningEs,
      userWarningPt: row.userWarningPt,
      userWarningKa: row.userWarningKa,
      maintenanceMessageRu: row.maintenanceMessageRu,
      maintenanceMessageEn: row.maintenanceMessageEn,
      maintenanceMessageEs: row.maintenanceMessageEs,
      maintenanceMessagePt: row.maintenanceMessagePt,
      maintenanceMessageKa: row.maintenanceMessageKa,
      instructionsRu: row.instructionsRu,
      instructionsEn: row.instructionsEn,
      instructionsEs: row.instructionsEs,
      instructionsPt: row.instructionsPt,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
