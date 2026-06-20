import { Injectable, Logger } from '@nestjs/common';
import {
  GeneratedDocumentKind,
  GeneratedDocumentStatus,
  ReportFormat,
} from '@prisma/client';
import { ReportRendererService } from '../../common/export/report-renderer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UserWalletService } from '../wallets/user-wallet.service';
import { statementKindLabel } from './statement-kind-labels';

type StatementFilters = {
  fiscalYear?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

@Injectable()
export class StatementDocumentProcessorService {
  private readonly logger = new Logger(StatementDocumentProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: UserWalletService,
    private readonly renderer: ReportRendererService,
  ) {}

  async processById(documentId: string): Promise<void> {
    const doc = await this.prisma.generatedDocument.findUnique({
      where: { id: documentId },
    });
    if (!doc || doc.status !== GeneratedDocumentStatus.QUEUED) {
      return;
    }

    await this.prisma.generatedDocument.update({
      where: { id: documentId },
      data: { status: GeneratedDocumentStatus.RUNNING },
    });

    try {
      const filters = (doc.filtersJson ?? {}) as StatementFilters;
      const rendered = await this.buildPdf(doc.id, doc.ownerUserId, doc.kind, filters);

      await this.prisma.generatedDocument.update({
        where: { id: documentId },
        data: {
          status: GeneratedDocumentStatus.COMPLETED,
          format: ReportFormat.PDF,
          fileContentBase64: rendered.buffer.toString('base64'),
          mimeType: rendered.mimeType,
          fileSizeBytes: rendered.buffer.length,
          fileChecksum: rendered.checksum,
          rowCount: rendered.rowCount,
          completedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          errorMessage: null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Statement ${documentId} failed: ${message}`);
      await this.prisma.generatedDocument.update({
        where: { id: documentId },
        data: {
          status: GeneratedDocumentStatus.FAILED,
          errorMessage: message.slice(0, 500),
          completedAt: new Date(),
        },
      });
    }
  }

  private async buildPdf(
    documentId: string,
    userId: string,
    kind: GeneratedDocumentKind,
    filters: StatementFilters,
  ) {
    const [user, summary, txs] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          profile: {
            select: { displayName: true, firstName: true, lastName: true },
          },
        },
      }),
      this.wallet.getSummary(userId),
      this.wallet.listTransactions(userId, 1, 500),
    ]);

    const period = resolvePeriod(filters);
    const filteredTxs = txs.items.filter((tx) =>
      isWithinPeriod(tx.createdAt, period.dateFrom, period.dateTo),
    );

    let inflow = 0;
    let outflow = 0;
    for (const tx of filteredTxs) {
      const net = Number.parseFloat(tx.netAmount);
      if (Number.isNaN(net)) continue;
      if (net >= 0) inflow += net;
      else outflow += Math.abs(net);
    }

    const holderName = resolveHolderName(user);
    const includeTransactions =
      kind === GeneratedDocumentKind.MONTHLY_WALLET_STATEMENT ||
      kind === GeneratedDocumentKind.DEPOSITS_WITHDRAWALS_SUMMARY;

    return this.renderer.renderStatementPdf({
      kindLabel: statementKindLabel(kind),
      periodLabel: period.label,
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
      holderName,
      reference: `ST-${documentId.slice(0, 8).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      balance: formatUsdtRu(summary.availableBalance),
      opsCount: filteredTxs.length,
      inflow: formatUsdtRu(String(inflow)),
      outflow: formatUsdtRu(String(outflow)),
      asset: summary.asset,
      network: summary.network,
      transactionHeaders: includeTransactions
        ? ['Дата', 'Тип', 'Направление', 'Сумма', 'Комиссия', 'Итого', 'Статус']
        : undefined,
      transactionRows: includeTransactions
        ? filteredTxs.map((tx) => [
            formatRangeDate(tx.createdAt),
            tx.type,
            tx.direction,
            formatUsdtRu(tx.amount),
            formatUsdtRu(tx.fee),
            formatUsdtRu(tx.netAmount),
            tx.status,
          ])
        : undefined,
    });
  }
}

function resolvePeriod(filters: StatementFilters): {
  label: string;
  dateFrom: string;
  dateTo: string;
} {
  if (filters.dateFrom && filters.dateTo) {
    return {
      label: `${formatRangeDate(filters.dateFrom)} — ${formatRangeDate(filters.dateTo)}`,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };
  }
  const year = filters.fiscalYear ?? new Date().getFullYear();
  return {
    label: `${year} год`,
    dateFrom: `${year}-01-01`,
    dateTo: `${year}-12-31`,
  };
}

function isWithinPeriod(iso: string, dateFrom: string, dateTo: string): boolean {
  const date = new Date(iso);
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);
  return date >= from && date <= to;
}

function resolveHolderName(
  user: {
    email: string;
    profile: {
      displayName: string | null;
      firstName: string | null;
      lastName: string | null;
    } | null;
  } | null,
): string {
  if (!user) return '—';
  const profile = user.profile;
  const display =
    profile?.displayName?.trim() ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
  if (display) return display;
  return maskEmail(user.email);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.length <= 2 ? local : `${local.slice(0, 2)}•••`;
  return `${visible}@${domain}`;
}

function formatUsdtRu(value: string): string {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatRangeDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
