import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '../errors/error-codes';
import { throwAppError } from '../errors/throw-app-error';

export type FeatureFlagKey =
  | 'enableDeposits'
  | 'enableWithdrawals'
  | 'enablePrimaryMarket'
  | 'enableSecondaryMarket'
  | 'enableDocuments'
  | 'enableNotifications'
  | 'enableNews'
  | 'enableDepositIngestionWorker'
  | 'enableReportWorker'
  | 'enableEmailDelivery'
  | 'enableRevenueDistributionRun'
  | 'enableTRONProvider'
  | 'enableMaintenanceMode'
  | 'disableWithdrawalsImmediately'
  | 'disableSecondaryTradingImmediately'
  | 'disablePrimaryPurchasesImmediately'
  | 'disableDepositsCredit'
  | 'disableDepositsImmediately'
  | 'disableRevenueDistributionImmediately'
  | 'disableReportDownloads';

const ENV_MAP: Record<FeatureFlagKey, string> = {
  enableDeposits: 'FEATURE_ENABLE_DEPOSITS',
  enableWithdrawals: 'FEATURE_ENABLE_WITHDRAWALS',
  enablePrimaryMarket: 'FEATURE_ENABLE_PRIMARY_MARKET',
  enableSecondaryMarket: 'FEATURE_ENABLE_SECONDARY_MARKET',
  enableDocuments: 'FEATURE_ENABLE_DOCUMENTS',
  enableNotifications: 'FEATURE_ENABLE_NOTIFICATIONS',
  enableNews: 'FEATURE_ENABLE_NEWS',
  enableDepositIngestionWorker: 'DEPOSIT_INGESTION_ENABLED',
  enableReportWorker: 'REPORT_WORKER_ENABLED',
  enableEmailDelivery: 'FEATURE_ENABLE_EMAIL_DELIVERY',
  enableRevenueDistributionRun: 'FEATURE_ENABLE_REVENUE_DISTRIBUTION',
  enableTRONProvider: 'TRON_PROVIDER_MODE',
  enableMaintenanceMode: 'FEATURE_MAINTENANCE_MODE',
  disableWithdrawalsImmediately: 'KILL_SWITCH_DISABLE_WITHDRAWALS',
  disableSecondaryTradingImmediately: 'KILL_SWITCH_DISABLE_SECONDARY_TRADING',
  disablePrimaryPurchasesImmediately: 'KILL_SWITCH_DISABLE_PRIMARY_PURCHASES',
  disableDepositsCredit: 'KILL_SWITCH_DISABLE_DEPOSIT_CREDIT',
  disableDepositsImmediately: 'KILL_SWITCH_DISABLE_DEPOSITS',
  disableRevenueDistributionImmediately:
    'KILL_SWITCH_DISABLE_REVENUE_DISTRIBUTION',
  disableReportDownloads: 'KILL_SWITCH_DISABLE_REPORT_DOWNLOADS',
};

const USER_MESSAGES: Partial<Record<FeatureFlagKey, string>> = {
  enableWithdrawals: 'Вывод USDT временно отключён оператором платформы.',
  enablePrimaryMarket: 'Покупка на первичном рынке временно недоступна.',
  enableSecondaryMarket: 'Вторичный рынок временно недоступен.',
  enableDeposits: 'Пополнение временно недоступно.',
  enableDocuments: 'Генерация документов временно недоступна.',
  enableMaintenanceMode: 'Платформа на техническом обслуживании. Повторите позже.',
  disableWithdrawalsImmediately: 'Выводы экстренно приостановлены.',
  disableSecondaryTradingImmediately: 'Сделки на вторичном рынке экстренно приостановлены.',
  disablePrimaryPurchasesImmediately: 'Покупки на первичном рынке экстренно приостановлены.',
  disableDepositsCredit: 'Зачисление депозитов временно приостановлено.',
  disableDepositsImmediately: 'Приём депозитов экстренно приостановлен.',
  disableRevenueDistributionImmediately:
    'Распределение выручки экстренно приостановлено.',
  disableReportDownloads: 'Скачивание отчётов временно недоступно.',
};

const FLAG_ERROR_CODES: Partial<Record<FeatureFlagKey, string>> = {
  enableMaintenanceMode: ErrorCodes.SYSTEM_MAINTENANCE,
  enableWithdrawals: ErrorCodes.WITHDRAWAL_DISABLED,
  disableWithdrawalsImmediately: ErrorCodes.WITHDRAWAL_DISABLED,
  enableSecondaryMarket: ErrorCodes.MARKET_DISABLED,
  disableSecondaryTradingImmediately: ErrorCodes.MARKET_DISABLED,
  enablePrimaryMarket: ErrorCodes.PURCHASE_DISABLED,
  disablePrimaryPurchasesImmediately: ErrorCodes.PURCHASE_DISABLED,
  enableDeposits: ErrorCodes.DEPOSIT_DISABLED,
  disableDepositsCredit: ErrorCodes.DEPOSIT_DISABLED,
  disableDepositsImmediately: ErrorCodes.DEPOSIT_DISABLED,
  disableReportDownloads: ErrorCodes.REPORT_FORBIDDEN,
  enableDocuments: ErrorCodes.DOCUMENT_NOT_READY,
};

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly config: ConfigService) {}

  isEnabled(key: FeatureFlagKey): boolean {
    const envKey = ENV_MAP[key];
    const raw = process.env[envKey] ?? this.config.get<string>(envKey);
    if (key.startsWith('disable') || key.startsWith('KILL')) {
      return raw === 'true' || raw === '1';
    }
    if (key === 'enableTRONProvider') {
      return (raw ?? 'mock') !== 'mock';
    }
    if (key === 'enableDepositIngestionWorker' || key === 'enableReportWorker') {
      return raw === 'true';
    }
    if (raw === 'false' || raw === '0') return false;
    return true;
  }

  isEffectivelyEnabled(key: FeatureFlagKey): boolean {
    if (key === 'enableWithdrawals') {
      return (
        this.isEnabled('enableWithdrawals') &&
        !this.isEnabled('disableWithdrawalsImmediately')
      );
    }
    if (key === 'enablePrimaryMarket') {
      return (
        this.isEnabled('enablePrimaryMarket') &&
        !this.isEnabled('disablePrimaryPurchasesImmediately')
      );
    }
    if (key === 'enableSecondaryMarket') {
      return (
        this.isEnabled('enableSecondaryMarket') &&
        !this.isEnabled('disableSecondaryTradingImmediately')
      );
    }
    if (key === 'enableDeposits') {
      return (
        this.isEnabled('enableDeposits') &&
        !this.isEnabled('disableDepositsCredit') &&
        !this.isEnabled('disableDepositsImmediately')
      );
    }
    if (key === 'enableRevenueDistributionRun') {
      return (
        this.isEnabled('enableRevenueDistributionRun') &&
        !this.isEnabled('disableRevenueDistributionImmediately')
      );
    }
    if (key.startsWith('disable')) {
      return !this.isEnabled(key);
    }
    return this.isEnabled(key);
  }

  assertEnabled(key: FeatureFlagKey): void {
    if (!this.isEffectivelyEnabled(key)) {
      throwAppError(
        FLAG_ERROR_CODES[key] ?? ErrorCodes.FEATURE_DISABLED,
        USER_MESSAGES[key] ?? 'Операция временно недоступна',
        key === 'enableMaintenanceMode'
          ? HttpStatus.SERVICE_UNAVAILABLE
          : HttpStatus.SERVICE_UNAVAILABLE,
        { flag: key },
      );
    }
  }

  snapshot(): Record<string, boolean> {
    const keys = Object.keys(ENV_MAP) as FeatureFlagKey[];
    const out: Record<string, boolean> = {};
    for (const k of keys) {
      out[k] = k.startsWith('enable')
        ? this.isEffectivelyEnabled(k)
        : this.isEnabled(k);
    }
    return out;
  }
}
