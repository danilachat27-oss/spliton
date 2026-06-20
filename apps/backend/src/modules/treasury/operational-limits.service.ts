import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, WithdrawalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { TREASURY_LIMIT_DEFAULTS } from './treasury-defaults';

export type OperationalLimitsDto = {
  userDailyWithdrawalUsdt: string;
  userMonthlyWithdrawalUsdt: string;
  userDailyTradeUsdt: string;
  maxOpenListingUsdt: string;
  maxFailedWithdrawalAttempts: number;
  maxAutoCreditDepositUsdt: string;
  maxAutoCompleteWithdrawalUsdt: string;
  mediumWithdrawalUsdt: string;
  largeWithdrawalUsdt: string;
  hotWalletMaxDailyOutflowUsdt: string;
  reportExportMaxRows: number;
};

@Injectable()
export class OperationalLimitsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (process.env.SKIP_SCHEMA_BOOTSTRAP === 'true') return;
    await this.ensureDefaults();
  }

  async ensureDefaults() {
    await this.prisma.treasuryOperationalLimits.upsert({
      where: { id: 'platform' },
      create: {
        id: 'platform',
        userDailyWithdrawalUsdt: new Prisma.Decimal(
          TREASURY_LIMIT_DEFAULTS.userDailyWithdrawalUsdt,
        ),
        userMonthlyWithdrawalUsdt: new Prisma.Decimal(
          TREASURY_LIMIT_DEFAULTS.userMonthlyWithdrawalUsdt,
        ),
        userDailyTradeUsdt: new Prisma.Decimal(
          TREASURY_LIMIT_DEFAULTS.userDailyTradeUsdt,
        ),
        maxOpenListingUsdt: new Prisma.Decimal(
          TREASURY_LIMIT_DEFAULTS.maxOpenListingUsdt,
        ),
        maxFailedWithdrawalAttempts:
          TREASURY_LIMIT_DEFAULTS.maxFailedWithdrawalAttempts,
        maxAutoCreditDepositUsdt: new Prisma.Decimal(
          TREASURY_LIMIT_DEFAULTS.maxAutoCreditDepositUsdt,
        ),
        maxAutoCompleteWithdrawalUsdt: new Prisma.Decimal(
          TREASURY_LIMIT_DEFAULTS.maxAutoCompleteWithdrawalUsdt,
        ),
        mediumWithdrawalUsdt: new Prisma.Decimal(
          TREASURY_LIMIT_DEFAULTS.mediumWithdrawalUsdt,
        ),
        largeWithdrawalUsdt: new Prisma.Decimal(
          TREASURY_LIMIT_DEFAULTS.largeWithdrawalUsdt,
        ),
        hotWalletMaxDailyOutflowUsdt: new Prisma.Decimal(
          TREASURY_LIMIT_DEFAULTS.hotWalletMaxDailyOutflowUsdt,
        ),
        reportExportMaxRows: TREASURY_LIMIT_DEFAULTS.reportExportMaxRows,
      },
      update: {},
    });
  }

  async getLimits(): Promise<OperationalLimitsDto> {
    const row = await this.prisma.treasuryOperationalLimits.findUnique({
      where: { id: 'platform' },
    });
    if (!row) {
      return {
        userDailyWithdrawalUsdt: TREASURY_LIMIT_DEFAULTS.userDailyWithdrawalUsdt,
        userMonthlyWithdrawalUsdt:
          TREASURY_LIMIT_DEFAULTS.userMonthlyWithdrawalUsdt,
        userDailyTradeUsdt: TREASURY_LIMIT_DEFAULTS.userDailyTradeUsdt,
        maxOpenListingUsdt: TREASURY_LIMIT_DEFAULTS.maxOpenListingUsdt,
        maxFailedWithdrawalAttempts:
          TREASURY_LIMIT_DEFAULTS.maxFailedWithdrawalAttempts,
        maxAutoCreditDepositUsdt: TREASURY_LIMIT_DEFAULTS.maxAutoCreditDepositUsdt,
        maxAutoCompleteWithdrawalUsdt:
          TREASURY_LIMIT_DEFAULTS.maxAutoCompleteWithdrawalUsdt,
        mediumWithdrawalUsdt: TREASURY_LIMIT_DEFAULTS.mediumWithdrawalUsdt,
        largeWithdrawalUsdt: TREASURY_LIMIT_DEFAULTS.largeWithdrawalUsdt,
        hotWalletMaxDailyOutflowUsdt:
          TREASURY_LIMIT_DEFAULTS.hotWalletMaxDailyOutflowUsdt,
        reportExportMaxRows: TREASURY_LIMIT_DEFAULTS.reportExportMaxRows,
      };
    }
    return this.map(row);
  }

  async updateLimits(
    actorUserId: string,
    patch: Partial<OperationalLimitsDto>,
  ): Promise<OperationalLimitsDto> {
    const data: Prisma.TreasuryOperationalLimitsUpdateInput = {
      updatedByUserId: actorUserId,
    };
    if (patch.userDailyWithdrawalUsdt != null) {
      data.userDailyWithdrawalUsdt = new Prisma.Decimal(patch.userDailyWithdrawalUsdt);
    }
    if (patch.userMonthlyWithdrawalUsdt != null) {
      data.userMonthlyWithdrawalUsdt = new Prisma.Decimal(patch.userMonthlyWithdrawalUsdt);
    }
    if (patch.userDailyTradeUsdt != null) {
      data.userDailyTradeUsdt = new Prisma.Decimal(patch.userDailyTradeUsdt);
    }
    if (patch.maxOpenListingUsdt != null) {
      data.maxOpenListingUsdt = new Prisma.Decimal(patch.maxOpenListingUsdt);
    }
    if (patch.maxFailedWithdrawalAttempts != null) {
      data.maxFailedWithdrawalAttempts = patch.maxFailedWithdrawalAttempts;
    }
    if (patch.maxAutoCreditDepositUsdt != null) {
      data.maxAutoCreditDepositUsdt = new Prisma.Decimal(patch.maxAutoCreditDepositUsdt);
    }
    if (patch.maxAutoCompleteWithdrawalUsdt != null) {
      data.maxAutoCompleteWithdrawalUsdt = new Prisma.Decimal(
        patch.maxAutoCompleteWithdrawalUsdt,
      );
    }
    if (patch.mediumWithdrawalUsdt != null) {
      data.mediumWithdrawalUsdt = new Prisma.Decimal(patch.mediumWithdrawalUsdt);
    }
    if (patch.largeWithdrawalUsdt != null) {
      data.largeWithdrawalUsdt = new Prisma.Decimal(patch.largeWithdrawalUsdt);
    }
    if (patch.hotWalletMaxDailyOutflowUsdt != null) {
      data.hotWalletMaxDailyOutflowUsdt = new Prisma.Decimal(
        patch.hotWalletMaxDailyOutflowUsdt,
      );
    }
    if (patch.reportExportMaxRows != null) {
      data.reportExportMaxRows = patch.reportExportMaxRows;
    }

    const row = await this.prisma.treasuryOperationalLimits.update({
      where: { id: 'platform' },
      data,
    });
    return this.map(row);
  }

  async assertUserWithdrawalWithinLimits(
    userId: string,
    amount: Prisma.Decimal,
  ): Promise<void> {
    const limits = await this.getLimits();
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const monthStart = new Date(Date.UTC(dayStart.getUTCFullYear(), dayStart.getUTCMonth(), 1));

    const [dailySum, monthlySum, failedCount] = await Promise.all([
      this.sumWithdrawalsSince(userId, dayStart),
      this.sumWithdrawalsSince(userId, monthStart),
      this.prisma.withdrawal.count({
        where: {
          status: { in: [WithdrawalStatus.FAILED, WithdrawalStatus.REJECTED, WithdrawalStatus.CANCELLED] },
          walletTx: { wallet: { userId } },
        },
      }),
    ]);

    const dailyMax = new Prisma.Decimal(limits.userDailyWithdrawalUsdt);
    const monthlyMax = new Prisma.Decimal(limits.userMonthlyWithdrawalUsdt);

    if (dailySum.add(amount).greaterThan(dailyMax)) {
      throwAdminError(
        'WITHDRAWAL_DAILY_LIMIT',
        'Превышен дневной лимит вывода USDT',
        HttpStatus.FORBIDDEN,
      );
    }
    if (monthlySum.add(amount).greaterThan(monthlyMax)) {
      throwAdminError(
        'WITHDRAWAL_MONTHLY_LIMIT',
        'Превышен месячный лимит вывода USDT',
        HttpStatus.FORBIDDEN,
      );
    }
    if (failedCount >= limits.maxFailedWithdrawalAttempts) {
      throwAdminError(
        'WITHDRAWAL_ATTEMPTS_EXCEEDED',
        'Слишком много неуспешных попыток вывода. Обратитесь в поддержку Spliton.',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async sumWithdrawalsSince(userId: string, since: Date) {
    const rows = await this.prisma.withdrawal.findMany({
      where: {
        requestedAt: { gte: since },
        status: {
          notIn: [
            WithdrawalStatus.CANCELLED,
            WithdrawalStatus.REJECTED,
            WithdrawalStatus.FAILED,
          ],
        },
        walletTx: { wallet: { userId } },
      },
      select: { walletTx: { select: { amount: true } } },
    });
    return rows.reduce(
      (s, r) => s.add(r.walletTx.amount),
      new Prisma.Decimal(0),
    );
  }

  private map(row: {
    userDailyWithdrawalUsdt: Prisma.Decimal;
    userMonthlyWithdrawalUsdt: Prisma.Decimal;
    userDailyTradeUsdt: Prisma.Decimal;
    maxOpenListingUsdt: Prisma.Decimal;
    maxFailedWithdrawalAttempts: number;
    maxAutoCreditDepositUsdt: Prisma.Decimal;
    maxAutoCompleteWithdrawalUsdt: Prisma.Decimal;
    mediumWithdrawalUsdt: Prisma.Decimal;
    largeWithdrawalUsdt: Prisma.Decimal;
    hotWalletMaxDailyOutflowUsdt: Prisma.Decimal;
    reportExportMaxRows: number;
  }): OperationalLimitsDto {
    return {
      userDailyWithdrawalUsdt: row.userDailyWithdrawalUsdt.toString(),
      userMonthlyWithdrawalUsdt: row.userMonthlyWithdrawalUsdt.toString(),
      userDailyTradeUsdt: row.userDailyTradeUsdt.toString(),
      maxOpenListingUsdt: row.maxOpenListingUsdt.toString(),
      maxFailedWithdrawalAttempts: row.maxFailedWithdrawalAttempts,
      maxAutoCreditDepositUsdt: row.maxAutoCreditDepositUsdt.toString(),
      maxAutoCompleteWithdrawalUsdt: row.maxAutoCompleteWithdrawalUsdt.toString(),
      mediumWithdrawalUsdt: row.mediumWithdrawalUsdt.toString(),
      largeWithdrawalUsdt: row.largeWithdrawalUsdt.toString(),
      hotWalletMaxDailyOutflowUsdt: row.hotWalletMaxDailyOutflowUsdt.toString(),
      reportExportMaxRows: row.reportExportMaxRows,
    };
  }
}
