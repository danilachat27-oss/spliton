import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, ReportFormat, ReportJobStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { parseCsvToTable } from '../../../common/export/csv.util';
import type { ReportDataset } from '../../../common/export/report-data.types';
import {
  assertFormatAllowed,
  formatToExt,
  parseReportFormat,
} from '../../../common/export/report-format.util';
import { ReportRendererService } from '../../../common/export/report-renderer.service';
import { AdminAuditService } from '../common/admin-audit.service';
import {
  mapReportJobStatus,
  reportExpiresAt,
  reportMaxAttempts,
  reportRunningTimeoutMs,
} from '../common/report-job.util';
import { ReportStorageService } from '../common/report-storage.service';
import { throwAdminError } from '../common/admin-http.util';
import {
  assertReportGenerate,
  assertReportListAccess,
  assertReportViewAccess,
  allowedReportTypesForRoles,
} from '../common/admin-rbac';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminListQueryDto } from '../common/dto/admin-list-query.dto';

import {
  getReportMeta,
  REPORT_TEMPLATE_META,
} from './mappers/admin-reports.mapper';
import { allowedFormatsForReportType } from '../../../common/export/report-format.util';

type ReportJobDto = {
  id: string;
  type: string;
  title: string;
  category: string;
  format: string;
  status: string;
  dateFrom: string | null;
  dateTo: string | null;
  requestedBy: string;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  fileSizeBytes: number | null;
  fileUrl: string | null;
  storageKey: string | null;
  storageMode: string;
  durationMs: number | null;
  sensitive: boolean;
  attemptCount: number;
  maxAttempts: number;
  expiresAt: string | null;
};

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly reportStorage: ReportStorageService,
    private readonly reportRenderer: ReportRendererService,
  ) {}

  private mapJob(
    row: Prisma.ReportJobGetPayload<{ include: { requestedBy: true } }>,
  ): ReportJobDto {
    const meta = getReportMeta(row.type);
    const status = mapReportJobStatus(row.status);
    const storageMode = process.env.REPORT_STORAGE_MODE ?? 'db';
    const durationMs =
      row.completedAt && row.createdAt
        ? row.completedAt.getTime() - row.createdAt.getTime()
        : null;
    return {
      id: row.id,
      type: row.type,
      title: meta.title,
      category: meta.category,
      format: row.format?.toLowerCase() ?? 'csv',
      status,
      dateFrom: row.dateFrom?.toISOString() ?? null,
      dateTo: row.dateTo?.toISOString() ?? null,
      requestedBy: row.requestedBy.email,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      errorMessage: row.errorMessage,
      fileSizeBytes: row.fileSizeBytes ?? null,
      fileUrl: row.fileUrl ?? null,
      storageKey: row.storageKey ?? null,
      storageMode,
      durationMs,
      sensitive: meta.sensitive,
      attemptCount: row.attemptCount,
      maxAttempts: row.maxAttempts,
      expiresAt: row.expiresAt?.toISOString() ?? null,
    };
  }

  async getSummary(roles: string[], query: AdminListQueryDto) {
    assertReportListAccess(roles);
    const allowedTypes = allowedReportTypesForRoles(roles);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const where: Prisma.ReportJobWhereInput = {};
    if (allowedTypes) {
      where.type = { in: allowedTypes };
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [
      total,
      completed,
      queued,
      processing,
      failed24h,
      totalSizeAgg,
      lastCompleted,
      recentCompleted,
    ] = await Promise.all([
      this.prisma.reportJob.count({ where }),
      this.prisma.reportJob.count({
        where: { ...where, status: ReportJobStatus.COMPLETED },
      }),
      this.prisma.reportJob.count({
        where: { ...where, status: ReportJobStatus.QUEUED },
      }),
      this.prisma.reportJob.count({
        where: { ...where, status: ReportJobStatus.RUNNING },
      }),
      this.prisma.reportJob.count({
        where: { status: ReportJobStatus.FAILED, createdAt: { gte: since24h } },
      }),
      this.prisma.reportJob.aggregate({
        where: { ...where, status: ReportJobStatus.COMPLETED },
        _sum: { fileSizeBytes: true },
      }),
      this.prisma.reportJob.findFirst({
        where: { status: ReportJobStatus.COMPLETED },
        orderBy: { completedAt: 'desc' },
        include: { requestedBy: true },
      }),
      this.prisma.reportJob.findMany({
        where: {
          status: ReportJobStatus.COMPLETED,
          completedAt: { not: null },
        },
        select: { createdAt: true, completedAt: true },
        take: 100,
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    let avgGenerationMs: number | null = null;
    if (recentCompleted.length) {
      const totalMs = recentCompleted.reduce((s, j) => {
        if (!j.completedAt) return s;
        return s + (j.completedAt.getTime() - j.createdAt.getTime());
      }, 0);
      avgGenerationMs = Math.round(totalMs / recentCompleted.length);
    }

    const worker = await this.workerStatus(roles);

    return {
      total,
      completed,
      queued,
      processing,
      failed24h,
      avgGenerationMs,
      totalFileSizeBytes: totalSizeAgg._sum.fileSizeBytes ?? 0,
      lastCompleted: lastCompleted ? this.mapJob(lastCompleted) : null,
      workerHealthy: worker.healthy,
      workerEnabled: worker.workerEnabled,
      storageMode: worker.storageMode,
    };
  }

  async list(roles: string[], query: AdminListQueryDto) {
    assertReportListAccess(roles);
    const allowedTypes = allowedReportTypesForRoles(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.ReportJobWhereInput = allowedTypes
      ? { type: { in: allowedTypes } }
      : {};

    const [total, rows] = await Promise.all([
      this.prisma.reportJob.count({ where }),
      this.prisma.reportJob.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { requestedBy: true },
      }),
    ]);

    return buildPaginated(
      rows.map((r) => this.mapJob(r)),
      total,
      page,
      pageSize,
    );
  }

  async getById(roles: string[], id: string, include?: string) {
    assertReportListAccess(roles);
    const row = await this.prisma.reportJob.findUnique({
      where: { id },
      include: { requestedBy: true },
    });
    if (!row) {
      throwAdminError(
        'REPORT_NOT_FOUND',
        'Report not found',
        HttpStatus.NOT_FOUND,
      );
    }
    assertReportViewAccess(roles, row.type);
    const base = this.mapJob(row);
    const parts = new Set(
      (include ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
    const result: Record<string, unknown> = { ...base };
    if (parts.has('audit')) {
      const audits = await this.prisma.auditLog.findMany({
        where: { entityType: 'report_job', entityId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { actorUser: { select: { email: true } } },
      });
      result.audit = audits.map((a) => ({
        id: a.id,
        action: a.action,
        actorEmail: a.actorUser?.email ?? null,
        before: a.beforeJsonb,
        after: a.afterJsonb,
        createdAt: a.createdAt.toISOString(),
      }));
    }
    return result;
  }

  listReportTypes(roles: string[]) {
    assertReportListAccess(roles);
    const allowed = allowedReportTypesForRoles(roles);
    return REPORT_TEMPLATE_META.filter(
      (m) => !allowed || allowed.includes(m.type),
    ).map((m) => ({
      type: m.type,
      title: m.title,
      category: m.category,
      sensitive: m.sensitive,
      formats: allowedFormatsForReportType(m.type).map((f) => f.toLowerCase()),
    }));
  }

  async generate(
    actorId: string,
    actorRoles: string[],
    params: {
      type: string;
      dateFrom?: string;
      dateTo?: string;
      format?: string;
    },
    meta: { ip: string | null; userAgent: string | null },
  ) {
    const type = params.type || 'withdrawals';
    const format = parseReportFormat(params.format);
    assertReportListAccess(actorRoles);
    assertReportGenerate(actorRoles, type);
    assertFormatAllowed(type, format);
    const dateFrom = params.dateFrom ? new Date(params.dateFrom) : undefined;
    const dateTo = params.dateTo ? new Date(params.dateTo) : undefined;

    const job = await this.prisma.reportJob.create({
      data: {
        type,
        format,
        status: ReportJobStatus.QUEUED,
        dateFrom,
        dateTo,
        requestedById: actorId,
        maxAttempts: reportMaxAttempts(),
      },
      include: { requestedBy: true },
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: actorRoles,
      entityType: 'report_job',
      entityId: job.id,
      action: 'report.generate',
      after: {
        type,
        format: format.toLowerCase(),
        status: 'queued',
        phase: 'enqueue',
      },
      ...meta,
    });

    if (process.env.REPORT_WORKER_ENABLED !== 'true') {
      void this.processJobById(job.id, actorId, actorRoles, meta).catch(
        () => undefined,
      );
    }

    return this.mapJob(job);
  }

  async retry(
    roles: string[],
    id: string,
    actorId: string,
    actorRoles: string[],
    meta: { ip: string | null; userAgent: string | null },
  ) {
    assertReportListAccess(roles);
    const row = await this.prisma.reportJob.findUnique({ where: { id } });
    if (!row) {
      throwAdminError(
        'REPORT_NOT_FOUND',
        'Report not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (row.status !== ReportJobStatus.FAILED) {
      throwAdminError(
        'REPORT_NOT_RETRYABLE',
        'Only failed jobs can be retried',
        HttpStatus.CONFLICT,
      );
    }
    assertReportGenerate(roles, row.type);
    await this.prisma.reportJob.update({
      where: { id },
      data: {
        status: ReportJobStatus.QUEUED,
        errorMessage: null,
        completedAt: null,
        expiresAt: null,
        fileContent: null,
        fileUrl: null,
        storageKey: null,
        fileSizeBytes: null,
        lockedAt: null,
        lockedBy: null,
        startedAt: null,
        attemptCount: 0,
      },
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'report_job',
      entityId: id,
      action: 'report.retry',
      after: { type: row.type },
      ...meta,
    });

    if (process.env.REPORT_WORKER_ENABLED !== 'true') {
      void this.processJobById(id, actorId, actorRoles, meta).catch(
        () => undefined,
      );
    }
    const updated = await this.prisma.reportJob.findUnique({
      where: { id },
      include: { requestedBy: true },
    });
    return this.mapJob(updated!);
  }

  /** Called by ReportWorkerService after SKIP LOCKED claim */
  async processJobById(
    jobId: string,
    actorId?: string,
    actorRoles?: string[],
    meta?: { ip: string | null; userAgent: string | null },
  ) {
    const job = await this.prisma.reportJob.findUnique({
      where: { id: jobId },
      include: { requestedBy: true },
    });
    if (!job) return null;
    if (
      job.status !== ReportJobStatus.RUNNING &&
      job.status !== ReportJobStatus.QUEUED
    ) {
      return null;
    }

    if (job.status === ReportJobStatus.QUEUED) {
      await this.prisma.reportJob.update({
        where: { id: jobId },
        data: {
          status: ReportJobStatus.RUNNING,
          startedAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
    }

    const type = job.type;
    const dateFrom = job.dateFrom ?? undefined;
    const dateTo = job.dateTo ?? undefined;
    const auditActorId = actorId ?? job.requestedById;
    const auditRoles = actorRoles ?? ['SYSTEM'];

    const format = job.format ?? ReportFormat.CSV;

    try {
      const dataset = await this.buildDataset(type, dateFrom, dateTo);
      const rendered = await this.reportRenderer.render(dataset, format);
      const stored = await this.reportStorage.persistReportFile(
        jobId,
        type,
        rendered,
      );
      const completedAt = new Date();
      const completed = await this.prisma.reportJob.update({
        where: { id: jobId },
        data: {
          status: ReportJobStatus.COMPLETED,
          fileContent: stored.fileContent,
          fileUrl: stored.fileUrl,
          fileSizeBytes: stored.fileSizeBytes,
          storageKey: stored.storageKey,
          mimeType: stored.mimeType,
          fileChecksum: stored.fileChecksum,
          rowCount: rendered.rowCount,
          completedAt,
          expiresAt: reportExpiresAt(completedAt),
          lockedAt: null,
          lockedBy: null,
          errorMessage: null,
        },
        include: { requestedBy: true },
      });

      await this.audit.logOperatorAction({
        actorUserId: auditActorId,
        actorRoles: auditRoles,
        entityType: 'report_job',
        entityId: jobId,
        action: 'report.generate',
        after: {
          type,
          format: format.toLowerCase(),
          rows: rendered.rowCount,
          phase: 'completed',
          fileSizeBytes: stored.fileSizeBytes,
          checksum: stored.fileChecksum,
        },
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
      });

      return completed;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Report generation failed';
      await this.markJobFailed(jobId, message, auditActorId, auditRoles, meta);
      return null;
    }
  }

  async markJobFailed(
    jobId: string,
    message: string,
    actorId?: string,
    actorRoles: string[] = ['SYSTEM'],
    meta?: { ip: string | null; userAgent: string | null },
  ): Promise<void> {
    const job = await this.prisma.reportJob.findUnique({
      where: { id: jobId },
      select: {
        requestedById: true,
        type: true,
        attemptCount: true,
        maxAttempts: true,
      },
    });
    if (!job) return;

    const limit = job.maxAttempts || reportMaxAttempts();
    const finalStatus =
      job.attemptCount >= limit
        ? ReportJobStatus.FAILED
        : ReportJobStatus.QUEUED;

    await this.prisma.reportJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        errorMessage: message,
        completedAt: finalStatus === ReportJobStatus.FAILED ? new Date() : null,
        lockedAt: null,
        lockedBy: null,
        startedAt: null,
      },
    });

    if (finalStatus === ReportJobStatus.FAILED) {
      await this.audit.logOperatorAction({
        actorUserId: actorId ?? job.requestedById,
        actorRoles,
        entityType: 'report_job',
        entityId: jobId,
        action: 'report.failed',
        after: { type: job.type, errorMessage: message },
        result: 'failure',
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
      });
    }
  }

  async expireJob(jobId: string, storageKey: string | null): Promise<void> {
    if (storageKey) {
      await this.reportStorage.deleteExpiredReport(storageKey);
    }
    await this.prisma.reportJob.update({
      where: { id: jobId },
      data: {
        status: ReportJobStatus.EXPIRED,
        fileContent: null,
        fileUrl: null,
        storageKey: null,
      },
    });
  }

  async download(
    roles: string[],
    id: string,
    actorId?: string,
    actorRoles?: string[],
    meta?: { ip: string | null; userAgent: string | null },
  ) {
    assertReportListAccess(roles);
    const row = await this.prisma.reportJob.findUnique({ where: { id } });
    if (!row) {
      throwAdminError(
        'REPORT_NOT_FOUND',
        'Report not found',
        HttpStatus.NOT_FOUND,
      );
    }
    assertReportGenerate(roles, row.type);
    if (row.status === ReportJobStatus.EXPIRED) {
      throwAdminError(
        'REPORT_EXPIRED',
        'Report file has expired',
        HttpStatus.GONE,
      );
    }
    if (row.status !== ReportJobStatus.COMPLETED) {
      throwAdminError(
        'REPORT_NOT_READY',
        'Report is not ready for download',
        HttpStatus.CONFLICT,
      );
    }
    if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
      await this.expireJob(id, row.storageKey);
      throwAdminError(
        'REPORT_EXPIRED',
        'Report file has expired',
        HttpStatus.GONE,
      );
    }
    if (!row.fileContent && !row.storageKey) {
      throwAdminError(
        'REPORT_NOT_READY',
        'Report file is missing',
        HttpStatus.CONFLICT,
      );
    }
    const content = await this.reportStorage.readReportFile({
      fileContent: row.fileContent,
      storageKey: row.storageKey,
      mimeType: row.mimeType,
    });
    if (actorId && actorRoles && meta) {
      const reportMeta = getReportMeta(row.type);
      await this.audit.logOperatorAction({
        actorUserId: actorId,
        actorRoles,
        entityType: 'report_job',
        entityId: id,
        action: reportMeta.sensitive
          ? 'report.sensitive_export'
          : 'report.download',
        after: {
          type: row.type,
          format: (row.format ?? ReportFormat.CSV).toLowerCase(),
          fileSizeBytes: row.fileSizeBytes,
        },
        ...meta,
      });
    }
    const ext = formatToExt(row.format ?? ReportFormat.CSV);
    const isText =
      ext === 'csv' &&
      typeof content === 'string' &&
      !row.mimeType?.includes('spreadsheet');
    return {
      id: row.id,
      type: row.type,
      format: (row.format ?? ReportFormat.CSV).toLowerCase(),
      filename: `${row.type}-${row.id.slice(0, 8)}.${ext}`,
      mimeType: row.mimeType ?? 'text/csv; charset=utf-8',
      content: isText ? content : undefined,
      contentBase64:
        !isText && Buffer.isBuffer(content)
          ? content.toString('base64')
          : typeof content === 'string'
            ? Buffer.from(content, 'utf8').toString('base64')
            : undefined,
      checksum: row.fileChecksum,
    };
  }

  async buildDataset(
    type: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<ReportDataset> {
    const csv = await this.buildCsvForExport(type, dateFrom, dateTo);
    const { headers, rows } = parseCsvToTable(csv);
    const meta = getReportMeta(type);
    return {
      title: meta.title,
      reportType: type,
      periodFrom: dateFrom?.toISOString(),
      periodTo: dateTo?.toISOString(),
      generatedAt: new Date().toISOString(),
      headers,
      rows,
      summary: [{ label: 'Total rows', value: String(rows.length) }],
      metadata: {
        brand: 'Spliton',
        category: meta.category,
      },
      dataSheetName: meta.title.slice(0, 31),
    };
  }

  /** Public for tests — raw CSV data fetch. */
  async buildCsvForExport(
    type: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<string> {
    const dateFilter = {
      gte: dateFrom,
      lte: dateTo,
    };

    switch (type) {
      case 'withdrawals': {
        const rows = await this.prisma.withdrawal.findMany({
          where: {
            requestedAt: dateFrom || dateTo ? dateFilter : undefined,
          },
          include: {
            walletTx: { include: { wallet: { include: { user: true } } } },
          },
          orderBy: { requestedAt: 'desc' },
          take: 5000,
        });
        const header =
          'id,user_email,amount,fee,net,status,requested_at,to_address';
        const lines = rows.map((r) =>
          [
            r.id,
            r.walletTx.wallet.user.email,
            r.walletTx.amount.toString(),
            r.walletTx.feeAmount.toString(),
            r.walletTx.netAmount.toString(),
            r.status,
            r.requestedAt.toISOString(),
            r.toAddress,
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'deposits': {
        const rows = await this.prisma.deposit.findMany({
          where: {
            createdAt: dateFrom || dateTo ? dateFilter : undefined,
          },
          include: {
            walletTx: { include: { wallet: { include: { user: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        });
        const header =
          'id,user_email,amount,status,received_at,blockchain_txid';
        const lines = rows.map((r) =>
          [
            r.id,
            r.walletTx.wallet.user.email,
            r.walletTx.netAmount.toString(),
            r.status,
            r.receivedAt?.toISOString() ?? '',
            r.blockchainTxid ?? '',
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'platform_revenue':
      case 'platform_revenue_transactions': {
        const rows = await this.prisma.fee.findMany({
          where: {
            createdAt: dateFrom || dateTo ? dateFilter : undefined,
          },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        });
        const header =
          'id,fee_code,amount,currency,subject_type,subject_id,created_at';
        const lines = rows.map((r) =>
          [
            r.id,
            r.feeCode,
            r.amountCharged.toString(),
            r.currency,
            r.subjectType,
            r.subjectId ?? '',
            r.createdAt.toISOString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'risk_flags': {
        const rows = await this.prisma.riskFlag.findMany({
          where: { createdAt: dateFrom || dateTo ? dateFilter : undefined },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        });
        const header = 'id,user_email,severity,flag_code,status,created_at';
        const lines = rows.map((r) =>
          [
            r.id,
            r.user.email,
            r.severity,
            r.flagCode,
            r.status,
            r.createdAt.toISOString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'support_tickets': {
        const rows = await this.prisma.supportTicket.findMany({
          where: { createdAt: dateFrom || dateTo ? dateFilter : undefined },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        });
        const header =
          'id,user_email,subject,category,status,priority,created_at';
        const lines = rows.map((r) =>
          [
            r.id,
            r.user.email,
            `"${r.subject.replace(/"/g, '""')}"`,
            r.category,
            r.status,
            r.priority,
            r.createdAt.toISOString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'finance_cashflow': {
        const depositTxs = await this.prisma.walletTransaction.findMany({
          where: {
            txType: 'DEPOSIT',
            status: 'COMPLETED',
            happenedAt: dateFrom || dateTo ? dateFilter : undefined,
          },
          select: { happenedAt: true, amount: true },
          take: 5000,
        });
        const withdrawalTxs = await this.prisma.walletTransaction.findMany({
          where: {
            txType: 'WITHDRAWAL',
            status: 'COMPLETED',
            happenedAt: dateFrom || dateTo ? dateFilter : undefined,
          },
          select: { happenedAt: true, amount: true },
          take: 5000,
        });
        const header = 'period,deposits_usdt,withdrawals_usdt,net_flow_usdt';
        const buckets = new Map<string, { dep: number; wd: number }>();
        for (const r of depositTxs) {
          const key = r.happenedAt.toISOString().slice(0, 10);
          const b = buckets.get(key) ?? { dep: 0, wd: 0 };
          b.dep += Number(r.amount.toString());
          buckets.set(key, b);
        }
        for (const r of withdrawalTxs) {
          const key = r.happenedAt.toISOString().slice(0, 10);
          const b = buckets.get(key) ?? { dep: 0, wd: 0 };
          b.wd += Number(r.amount.toString());
          buckets.set(key, b);
        }
        const lines = [...buckets.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([period, v]) => `${period},${v.dep},${v.wd},${v.dep - v.wd}`);
        return [header, ...lines].join('\n');
      }
      case 'finance_fees': {
        const grouped = await this.prisma.fee.groupBy({
          by: ['feeCode'],
          where: { createdAt: dateFrom || dateTo ? dateFilter : undefined },
          _sum: { amountCharged: true },
          _count: { id: true },
        });
        const header = 'fee_code,amount_usdt,count';
        const lines = grouped.map(
          (g) =>
            `${g.feeCode},${g._sum.amountCharged?.toString() ?? '0'},${g._count.id}`,
        );
        return [header, ...lines].join('\n');
      }
      case 'revenue_distributions': {
        const rows = await this.prisma.payout.findMany({
          where: { createdAt: dateFrom || dateTo ? dateFilter : undefined },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        });
        const header = 'id,status,amount_net,created_at';
        const lines = rows.map((r) =>
          [
            r.id,
            r.status,
            r.amountNet.toString(),
            r.createdAt.toISOString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'users_funnel': {
        const rows = await this.prisma.user.findMany({
          where: { createdAt: dateFrom || dateTo ? dateFilter : undefined },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        });
        const header = 'id,email,status,email_verified_at,created_at';
        const lines = rows.map((r) =>
          [
            r.id,
            r.email,
            r.status,
            r.emailVerifiedAt?.toISOString() ?? '',
            r.createdAt.toISOString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'users': {
        const rows = await this.prisma.user.findMany({
          where: { createdAt: dateFrom || dateTo ? dateFilter : undefined },
          include: { profile: true },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        });
        const header = 'id,email,display_name,status,created_at';
        const lines = rows.map((r) =>
          [
            r.id,
            r.email,
            `"${(r.profile?.displayName ?? '').replace(/"/g, '""')}"`,
            r.status,
            r.createdAt.toISOString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'wallet_transactions': {
        const rows = await this.prisma.walletTransaction.findMany({
          where: { happenedAt: dateFrom || dateTo ? dateFilter : undefined },
          include: { wallet: { include: { user: true } } },
          orderBy: { happenedAt: 'desc' },
          take: 5000,
        });
        const header =
          'id,user_email,tx_type,direction,amount,fee,net,status,happened_at';
        const lines = rows.map((r) =>
          [
            r.id,
            r.wallet.user.email,
            r.txType,
            r.direction,
            r.amount.toString(),
            r.feeAmount.toString(),
            r.netAmount.toString(),
            r.status,
            r.happenedAt.toISOString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'trades':
      case 'market_volume': {
        const rows = await this.prisma.trade.findMany({
          where: { executedAt: dateFrom || dateTo ? dateFilter : undefined },
          orderBy: { executedAt: 'desc' },
          take: 5000,
        });
        const header = 'id,release_id,gross_amount,executed_at';
        const lines = rows.map((r) =>
          [
            r.id,
            r.releaseId,
            r.grossAmount.toString(),
            r.executedAt.toISOString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'tracks_round_progress': {
        const rounds = await this.prisma.primaryRaiseRound.findMany({
          where: { createdAt: dateFrom || dateTo ? dateFilter : undefined },
          include: { release: true },
          take: 5000,
        });
        const header = 'round_id,track_title,status,raised_usdt,target_usdt';
        const lines = rounds.map((r) =>
          [
            r.id,
            `"${r.release.title.replace(/"/g, '""')}"`,
            r.status,
            r.raisedAmountUsdt.toString(),
            r.raiseTargetUsdt.toString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'audit_logs': {
        const rows = await this.prisma.auditLog.findMany({
          where: { createdAt: dateFrom || dateTo ? dateFilter : undefined },
          include: { actorUser: { select: { email: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5000,
        });
        const header =
          'id,actor_email,actor_role,entity_type,entity_id,action,created_at';
        const lines = rows.map((r) =>
          [
            r.id,
            r.actorUser?.email ?? '',
            r.actorRole,
            r.entityType,
            r.entityId ?? '',
            r.action,
            r.createdAt.toISOString(),
          ].join(','),
        );
        return [header, ...lines].join('\n');
      }
      case 'analytics_summary': {
        const since =
          dateFrom ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const until = dateTo ?? new Date();
        const range = { gte: since, lte: until };
        const [users, deposits, withdrawals, trades] = await Promise.all([
          this.prisma.user.count({ where: { createdAt: range } }),
          this.prisma.deposit.count({ where: { createdAt: range } }),
          this.prisma.withdrawal.count({ where: { requestedAt: range } }),
          this.prisma.trade.count({ where: { executedAt: range } }),
        ]);
        const header = 'metric,value,period_from,period_to';
        const lines = [
          `new_users,${users},${since.toISOString()},${until.toISOString()}`,
          `deposits,${deposits},${since.toISOString()},${until.toISOString()}`,
          `withdrawals,${withdrawals},${since.toISOString()},${until.toISOString()}`,
          `trades,${trades},${since.toISOString()},${until.toISOString()}`,
        ];
        return [header, ...lines].join('\n');
      }
      default:
        throwAdminError(
          'UNKNOWN_REPORT_TYPE',
          `Unknown report type: ${type}`,
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  async workerStatus(roles: string[]) {
    assertReportListAccess(roles);
    const enabled = process.env.REPORT_WORKER_ENABLED === 'true';
    const storageMode = process.env.REPORT_STORAGE_MODE ?? 'db';
    const bucketName =
      process.env.SUPABASE_STORAGE_REPORTS_BUCKET?.trim() || 'reports';
    const stuckThreshold = new Date(Date.now() - reportRunningTimeoutMs());
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      queued,
      processing,
      stuck,
      failedRecent,
      lastCompleted,
      recentCompleted,
    ] = await Promise.all([
      this.prisma.reportJob.count({
        where: { status: ReportJobStatus.QUEUED },
      }),
      this.prisma.reportJob.count({
        where: { status: ReportJobStatus.RUNNING },
      }),
      this.prisma.reportJob.count({
        where: {
          status: ReportJobStatus.RUNNING,
          OR: [
            { startedAt: { lt: stuckThreshold } },
            { startedAt: null, lockedAt: { lt: stuckThreshold } },
          ],
        },
      }),
      this.prisma.reportJob.count({
        where: { status: ReportJobStatus.FAILED, createdAt: { gte: since24h } },
      }),
      this.prisma.reportJob.findFirst({
        where: { status: ReportJobStatus.COMPLETED },
        orderBy: { completedAt: 'desc' },
        select: { id: true, type: true, completedAt: true },
      }),
      this.prisma.reportJob.findMany({
        where: {
          status: ReportJobStatus.COMPLETED,
          completedAt: { not: null },
        },
        select: { createdAt: true, completedAt: true },
        take: 50,
        orderBy: { completedAt: 'desc' },
      }),
    ]);

    let avgProcessingMs: number | null = null;
    if (recentCompleted.length) {
      const total = recentCompleted.reduce((s, j) => {
        if (!j.completedAt) return s;
        return s + (j.completedAt.getTime() - j.createdAt.getTime());
      }, 0);
      avgProcessingMs = Math.round(total / recentCompleted.length);
    }

    return {
      workerEnabled: enabled,
      storageMode,
      bucketName,
      queued,
      processing,
      stuckProcessing: stuck,
      failedLast24h: failedRecent,
      healthy: enabled ? stuck === 0 : processing === 0 && stuck === 0,
      lastProcessedJobId: lastCompleted?.id ?? null,
      lastProcessedAt: lastCompleted?.completedAt?.toISOString() ?? null,
      avgProcessingMs,
    };
  }
}
