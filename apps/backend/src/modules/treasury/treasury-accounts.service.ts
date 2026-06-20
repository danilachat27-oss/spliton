import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  Prisma,
  SystemAlertSeverity,
  SystemAlertSource,
  TreasuryAccountStatus,
  TreasuryAccountType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemAlertService } from '../../common/observability/system-alert.service';
import { TREASURY_ACCOUNT_SEED } from './treasury-defaults';

@Injectable()
export class TreasuryAccountsService implements OnModuleInit {
  private readonly logger = new Logger(TreasuryAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alerts: SystemAlertService,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_TREASURY_ACCOUNTS_ON_BOOT !== 'true') return;
    await this.seedAccounts();
  }

  async seedAccounts() {
    for (const spec of TREASURY_ACCOUNT_SEED) {
      const address = spec.addressEnv
        ? process.env[spec.addressEnv]?.trim() || null
        : null;
      const min = spec.minEnv
        ? this.decimalEnv(spec.minEnv)
        : null;
      const max = spec.maxEnv
        ? this.decimalEnv(spec.maxEnv)
        : null;

      await this.prisma.treasuryAccount.upsert({
        where: {
          type_asset_network: {
            type: spec.type,
            asset: 'USDT',
            network: 'TRC20',
          },
        },
        create: {
          type: spec.type,
          asset: 'USDT',
          network: 'TRC20',
          label: spec.label,
          address,
          minBalanceThreshold: min,
          maxBalanceThreshold: max,
          metadata: { seeded: true, noPrivateKeys: true },
        },
        update: {
          label: spec.label,
          address: address ?? undefined,
          minBalanceThreshold: min ?? undefined,
          maxBalanceThreshold: max ?? undefined,
        },
      });
    }
    this.logger.log('Treasury accounts seeded (addresses from env only, no keys)');
  }

  async listAccounts() {
    return this.prisma.treasuryAccount.findMany({
      orderBy: { type: 'asc' },
    });
  }

  async updateObservedBalance(
    accountId: string,
    observed: string,
    actorUserId: string,
  ) {
    const value = new Prisma.Decimal(observed);
    return this.prisma.treasuryAccount.update({
      where: { id: accountId },
      data: {
        balanceObserved: value,
        lastReconciledAt: new Date(),
        metadata: {
          lastManualObservedBy: actorUserId,
          at: new Date().toISOString(),
        },
      },
    });
  }

  async checkHotWalletThresholds() {
    const hot = await this.prisma.treasuryAccount.findFirst({
      where: {
        type: TreasuryAccountType.HOT_WALLET,
        status: TreasuryAccountStatus.ACTIVE,
      },
    });
    if (!hot?.balanceObserved) return { alerts: [] as string[] };

    const observed = hot.balanceObserved;
    const alerts: string[] = [];
    if (
      hot.minBalanceThreshold &&
      observed.lessThan(hot.minBalanceThreshold)
    ) {
      alerts.push('hot_wallet_below_minimum');
      await this.alerts.createIfNotOpen({
        code: 'treasury.hot_wallet.low',
        title: 'Hot wallet ниже минимума',
        message: `Observed ${observed} < min ${hot.minBalanceThreshold}`,
        severity: SystemAlertSeverity.CRITICAL,
        source: SystemAlertSource.FINANCE,
      });
    }
    if (
      hot.maxBalanceThreshold &&
      observed.greaterThan(hot.maxBalanceThreshold)
    ) {
      alerts.push('hot_wallet_above_maximum');
      await this.alerts.createIfNotOpen({
        code: 'treasury.hot_wallet.high',
        title: 'Hot wallet выше максимума',
        message: `Observed ${observed} > max ${hot.maxBalanceThreshold}`,
        severity: SystemAlertSeverity.WARNING,
        source: SystemAlertSource.FINANCE,
      });
    }
    return { alerts };
  }

  private decimalEnv(key: string): Prisma.Decimal | null {
    const raw = process.env[key]?.trim();
    if (!raw) return null;
    try {
      return new Prisma.Decimal(raw);
    } catch {
      return null;
    }
  }
}
