import { HttpStatus, Injectable } from '@nestjs/common';
import {
  LedgerAccount,
  Prisma,
  SystemAlertSeverity,
  SystemAlertSource,
  WalletReconciliationStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SystemAlertService } from '../../../common/observability/system-alert.service';
import { AdminAuditService } from './admin-audit.service';
import { throwAdminError } from './admin-http.util';
import { WalletLedgerService } from './wallet-ledger.service';

const USER_ACCOUNTS: LedgerAccount[] = [
  LedgerAccount.USER_AVAILABLE,
  LedgerAccount.USER_LOCKED,
  LedgerAccount.USER_PENDING,
];

@Injectable()
export class WalletReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedgerService,
    private readonly audit: AdminAuditService,
    private readonly alerts: SystemAlertService,
  ) {}

  async getLatestRun() {
    return this.prisma.walletReconciliationRun.findFirst({
      orderBy: { startedAt: 'desc' },
      include: {
        discrepancies: { take: 20, orderBy: { deltaAmount: 'desc' } },
      },
    });
  }

  async getRun(id: string) {
    const run = await this.prisma.walletReconciliationRun.findUnique({
      where: { id },
      include: {
        discrepancies: { orderBy: { deltaAmount: 'desc' } },
      },
    });
    if (!run) {
      throwAdminError(
        'RECONCILIATION_RUN_NOT_FOUND',
        'Reconciliation run not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return run;
  }

  async buildReportCsv(runId: string): Promise<string> {
    const run = await this.getRun(runId);
    const lines = [
      'wallet_id,ledger_account,expected,actual,delta,currency,source',
    ];
    for (const d of run.discrepancies) {
      lines.push(
        [
          d.walletId,
          d.ledgerAccount,
          d.expectedAmount.toString(),
          d.actualAmount.toString(),
          d.deltaAmount.toString(),
          d.currency,
          d.source,
        ].join(','),
      );
    }
    return lines.join('\n');
  }

  async run(params: {
    dryRun: boolean;
    actorUserId: string;
    actorRoles: string[];
    ip: string | null;
    userAgent: string | null;
    walletIds?: string[];
  }) {
    const wallets = await this.prisma.wallet.findMany({
      where: {
        balance: { isNot: null },
        ...(params.walletIds?.length ? { id: { in: params.walletIds } } : {}),
      },
      include: { balance: true },
    });

    const discrepancies: Array<{
      walletId: string;
      ledgerAccount: LedgerAccount;
      expectedAmount: Prisma.Decimal;
      actualAmount: Prisma.Decimal;
      deltaAmount: Prisma.Decimal;
      currency: string;
      source: string;
    }> = [];

    for (const wallet of wallets) {
      if (!wallet.balance) continue;

      const expected = await this.ledger.expectedBalances(
        this.prisma,
        wallet.id,
      );

      const actualMap: Record<LedgerAccount, Prisma.Decimal> = {
        [LedgerAccount.USER_AVAILABLE]: wallet.balance.available,
        [LedgerAccount.USER_LOCKED]: wallet.balance.locked,
        [LedgerAccount.USER_PENDING]: wallet.balance.pending,
        [LedgerAccount.PLATFORM_FEE]: new Prisma.Decimal(0),
        [LedgerAccount.PLATFORM_SETTLEMENT]: new Prisma.Decimal(0),
      };

      const expectedMap: Record<LedgerAccount, Prisma.Decimal> = {
        [LedgerAccount.USER_AVAILABLE]: expected.available,
        [LedgerAccount.USER_LOCKED]: expected.locked,
        [LedgerAccount.USER_PENDING]: expected.pending,
        [LedgerAccount.PLATFORM_FEE]: new Prisma.Decimal(0),
        [LedgerAccount.PLATFORM_SETTLEMENT]: new Prisma.Decimal(0),
      };

      for (const account of USER_ACCOUNTS) {
        const actual = actualMap[account];
        const exp = expectedMap[account];
        const delta = actual.minus(exp);
        if (!delta.isZero()) {
          discrepancies.push({
            walletId: wallet.id,
            ledgerAccount: account,
            expectedAmount: exp,
            actualAmount: actual,
            deltaAmount: delta,
            currency: wallet.assetCode,
            source: expected.source,
          });
        }
      }
    }

    const summary = {
      walletsChecked: wallets.length,
      discrepancyCount: discrepancies.length,
      generatedAt: new Date().toISOString(),
    };

    let runId: string | null = null;

    if (!params.dryRun) {
      const run = await this.prisma.walletReconciliationRun.create({
        data: {
          dryRun: false,
          status: WalletReconciliationStatus.COMPLETED,
          walletsChecked: wallets.length,
          discrepancyCount: discrepancies.length,
          reportSummary: summary,
          startedByUserId: params.actorUserId,
          completedAt: new Date(),
          discrepancies: {
            create: discrepancies.map((d) => ({
              walletId: d.walletId,
              ledgerAccount: d.ledgerAccount,
              expectedAmount: d.expectedAmount,
              actualAmount: d.actualAmount,
              deltaAmount: d.deltaAmount,
              currency: d.currency,
              source: d.source,
            })),
          },
        },
      });
      runId = run.id;
    }

    await this.audit.logOperatorAction({
      actorUserId: params.actorUserId,
      actorRoles: params.actorRoles,
      entityType: 'wallet_reconciliation',
      entityId: runId,
      action: params.dryRun
        ? 'reconciliation.dry_run'
        : 'reconciliation.completed',
      after: {
        ...summary,
        sampleDiscrepancies: discrepancies.slice(0, 5).map((d) => ({
          walletId: d.walletId,
          account: d.ledgerAccount,
          delta: d.deltaAmount.toString(),
        })),
        ledgerMutation: false,
      },
      ip: params.ip,
      userAgent: params.userAgent,
    });

    if (discrepancies.length > 0) {
      void this.alerts.createIfNotOpen({
        code: 'WALLET_RECONCILIATION_DISCREPANCY',
        title: 'Wallet reconciliation discrepancy detected',
        message: `${discrepancies.length} ledger discrepancy(ies) found`,
        severity: SystemAlertSeverity.CRITICAL,
        source: SystemAlertSource.FINANCE,
        entityType: 'wallet_reconciliation_run',
        entityId: runId ?? undefined,
        metadata: {
          discrepancyCount: discrepancies.length,
          dryRun: params.dryRun,
        },
        runbookKey: 'wallet-reconciliation-discrepancy',
      });
    }

    return {
      dryRun: params.dryRun,
      runId,
      ...summary,
      discrepancies: discrepancies.map((d) => ({
        walletId: d.walletId,
        ledgerAccount: d.ledgerAccount,
        expectedAmount: d.expectedAmount.toString(),
        actualAmount: d.actualAmount.toString(),
        deltaAmount: d.deltaAmount.toString(),
        currency: d.currency,
        source: d.source,
      })),
    };
  }
}
