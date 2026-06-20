import { Injectable } from '@nestjs/common';
import {
  GeneratedDocumentStatus,
  ListingStatus,
  ReportJobStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type DataQualityFinding = {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  count: number;
  sampleIds?: string[];
};

@Injectable()
export class DataQualityService {
  constructor(private readonly prisma: PrismaService) {}

  async runChecks(): Promise<{
    generatedAt: string;
    passed: boolean;
    findings: DataQualityFinding[];
  }> {
    const findings: DataQualityFinding[] = [];

    const negativeBalances = await this.prisma.walletBalance.count({
      where: {
        OR: [
          { available: { lt: 0 } },
          { locked: { lt: 0 } },
          { pending: { lt: 0 } },
        ],
      },
    });
    if (negativeBalances > 0) {
      findings.push({
        code: 'WALLET_NEGATIVE_BALANCE',
        severity: 'critical',
        message: 'Wallet balances below zero detected',
        count: negativeBalances,
      });
    }

    const stuckWithdrawals = await this.prisma.withdrawal.count({
      where: {
        status: { in: [WithdrawalStatus.PROCESSING, WithdrawalStatus.LOCKED] },
        updatedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (stuckWithdrawals > 0) {
      findings.push({
        code: 'WITHDRAWAL_STUCK',
        severity: 'warning',
        message: 'Withdrawals processing longer than 1 hour',
        count: stuckWithdrawals,
      });
    }

    const expiredDownloadable = await this.prisma.generatedDocument.count({
      where: {
        status: GeneratedDocumentStatus.COMPLETED,
        expiresAt: { lt: new Date() },
      },
    });
    if (expiredDownloadable > 0) {
      findings.push({
        code: 'DOCUMENT_EXPIRED_NOT_MARKED',
        severity: 'warning',
        message: 'Completed documents past expiry still marked COMPLETED',
        count: expiredDownloadable,
      });
    }

    const failedReportsNoError = await this.prisma.reportJob.count({
      where: {
        status: ReportJobStatus.FAILED,
        OR: [{ errorMessage: null }, { errorMessage: '' }],
      },
    });
    if (failedReportsNoError > 0) {
      findings.push({
        code: 'REPORT_FAILED_NO_MESSAGE',
        severity: 'warning',
        message: 'Failed report jobs without error message',
        count: failedReportsNoError,
      });
    }

    const oversoldListings = await this.prisma.$queryRaw<{ cnt: bigint }[]>`
      SELECT COUNT(*)::bigint AS cnt
      FROM market_listings ml
      LEFT JOIN user_positions up
        ON up.user_id = ml.seller_user_id AND up.release_id = ml.release_id
      WHERE ml.status = 'ACTIVE'
        AND ml.deleted_at IS NULL
        AND ml.units_available > COALESCE(up.units_available, 0)
    `;
    const oversell = Number(oversoldListings[0]?.cnt ?? 0);
    if (oversell > 0) {
      findings.push({
        code: 'LISTING_UNITS_EXCEED_POSITION',
        severity: 'critical',
        message: 'Active listings with units exceeding seller position',
        count: oversell,
      });
    }

    const latestRecon = await this.prisma.walletReconciliationRun.findFirst({
      orderBy: { startedAt: 'desc' },
      select: { discrepancyCount: true, status: true },
    });
    if (latestRecon && latestRecon.discrepancyCount > 0) {
      findings.push({
        code: 'LEDGER_RECON_DISCREPANCY',
        severity: 'critical',
        message: 'Latest wallet reconciliation has discrepancies',
        count: latestRecon.discrepancyCount,
      });
    }

    const critical = findings.some((f) => f.severity === 'critical');
    return {
      generatedAt: new Date().toISOString(),
      passed: findings.length === 0,
      findings,
    };
  }
}
