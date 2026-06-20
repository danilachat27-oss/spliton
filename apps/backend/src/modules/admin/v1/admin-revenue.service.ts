import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ActorRole,
  EarningPeriodStatus,
  LedgerOperationType,
  OwnershipEventType,
  PayoutStatus,
  Prisma,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { WalletLedgerService } from '../common/wallet-ledger.service';
import { throwAdminError } from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminRevenueQueryDto } from './dto/admin-revenue-query.dto';
import {
  apiRevenueStatusToDb,
  mapRevenueListItem,
  payoutStatusToApi,
  splitAmounts,
  walletTxStatusLabel,
  type AdminRevenueDetailDto,
  type AdminRevenuePreviewDto,
  type AdminRevenueSummaryDto,
} from './mappers/admin-revenue.mapper';
import {
  calculateDistribution,
  resolveRevenueShares,
} from './utils/revenue-distribution.calc';
import {
  persistHolderSnapshots,
  resolveDistributionHolders,
} from './utils/earning-period-holder-snapshot.util';
import {
  assertBusinessAnalystReadOnly,
  assertMatrixSection,
} from '../common/admin-role-matrix';
import { FeatureFlagsService } from '../../../common/platform/feature-flags/feature-flags.service';

const APPROVE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

@Injectable()
export class AdminRevenueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly ledger: WalletLedgerService,
    private readonly flags: FeatureFlagsService,
  ) {}

  private listInclude() {
    return {
      release: {
        include: {
          releaseArtists: {
            take: 1,
            include: { artist: true },
          },
        },
      },
      reports: { take: 1, orderBy: { createdAt: 'desc' as const } },
      distributions: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        include: { payouts: { select: { id: true } } },
      },
    } satisfies Prisma.EarningPeriodInclude;
  }

  async summary(
    roles: string[],
    query?: AdminRevenueQueryDto,
  ): Promise<AdminRevenueSummaryDto> {
    this.assertFinance(roles, 'view');
    const dateWhere: Prisma.EarningPeriodWhereInput = {};
    if (query?.dateFrom || query?.dateTo) {
      dateWhere.createdAt = {};
      if (query.dateFrom) dateWhere.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) dateWhere.createdAt.lte = new Date(query.dateTo);
    }

    const periods = await this.prisma.earningPeriod.findMany({
      where: dateWhere,
      include: { reports: { take: 1, orderBy: { createdAt: 'desc' } } },
    });

    let totalGross = 0;
    let distributedHolders = 0;
    let platformTotal = 0;
    let artistTotal = 0;
    let pendingCount = 0;
    let processingCount = 0;
    let activeEvents = 0;

    for (const p of periods) {
      const gross = Number(p.reports[0]?.grossRevenue.toString() ?? 0);
      const split = splitAmounts(gross);
      totalGross += gross;
      platformTotal += split.platform;
      artistTotal += split.artist;
      if (p.status === EarningPeriodStatus.DISTRIBUTED) {
        distributedHolders += split.holders;
      }
      if (p.status === EarningPeriodStatus.OPEN) pendingCount += 1;
      if (
        p.status === EarningPeriodStatus.CALCULATED ||
        p.status === EarningPeriodStatus.REVIEW ||
        p.status === EarningPeriodStatus.APPROVED
      ) {
        processingCount += 1;
      }
      if (p.status !== EarningPeriodStatus.CANCELLED) activeEvents += 1;
    }

    const failedCount = await this.prisma.earningPeriod.count({
      where: { ...dateWhere, status: EarningPeriodStatus.FAILED },
    });

    const payoutAgg = await this.prisma.payout.aggregate({
      _avg: { amountNet: true },
      _count: { id: true },
      where: {
        earningDistribution: {
          earningPeriod: dateWhere.createdAt
            ? { createdAt: dateWhere.createdAt }
            : undefined,
        },
      },
    });

    return {
      totalGrossRevenueUsdt: totalGross.toFixed(2).replace(/\.00$/, ''),
      distributedToHoldersUsdt: distributedHolders
        .toFixed(2)
        .replace(/\.00$/, ''),
      platformShareUsdt: platformTotal.toFixed(2).replace(/\.00$/, ''),
      artistShareUsdt: artistTotal.toFixed(2).replace(/\.00$/, ''),
      pendingCount,
      processingCount,
      failedCount,
      avgPayoutPerHolderUsdt:
        payoutAgg._count.id > 0 && payoutAgg._avg.amountNet
          ? Number(payoutAgg._avg.amountNet.toString()).toFixed(2)
          : null,
      activeEventsCount: activeEvents,
    };
  }

  async listEvents(roles: string[], query: AdminRevenueQueryDto) {
    this.assertFinance(roles, 'view');
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query);

    const [total, rows] = await Promise.all([
      this.prisma.earningPeriod.count({ where }),
      this.prisma.earningPeriod.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: this.listInclude(),
      }),
    ]);

    const creatorEmails = await this.loadCreatorEmails(rows.map((r) => r.id));
    const holderCounts = await this.loadHolderCounts(
      rows.map((r) => r.releaseId),
    );

    const items = rows.map((row) =>
      mapRevenueListItem(
        {
          ...row,
          release: {
            ...row.release,
            artists: row.release.releaseArtists.map((ra) => ({
              artist: ra.artist,
            })),
          },
        },
        {
          holdersCount:
            holderCounts.get(row.releaseId) ??
            row.distributions[0]?.payouts.length ??
            0,
          createdBy: creatorEmails.get(row.id) ?? null,
          errorMessage:
            (row as { lastError?: string | null }).lastError ?? null,
        },
      ),
    );

    return buildPaginated(items, total, page, pageSize);
  }

  async getEventById(
    roles: string[],
    id: string,
    include?: string,
  ): Promise<AdminRevenueDetailDto> {
    this.assertFinance(roles, 'view');
    const period = await this.prisma.earningPeriod.findUnique({
      where: { id },
      include: this.listInclude(),
    });
    if (!period) {
      throwAdminError(
        'REVENUE_NOT_FOUND',
        'Revenue event not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const [creatorEmail] = await Promise.all([
      this.loadCreatorEmails([id]).then((m) => m.get(id) ?? null),
    ]);
    const holdersCount = await this.loadHolderCounts([period.releaseId]).then(
      (m) => m.get(period.releaseId) ?? 0,
    );

    const detail: AdminRevenueDetailDto = {
      ...mapRevenueListItem(
        {
          ...period,
          release: {
            ...period.release,
            artists: period.release.releaseArtists.map((ra) => ({
              artist: ra.artist,
            })),
          },
        },
        {
          holdersCount,
          createdBy: creatorEmail,
          errorMessage: period.lastError,
        },
      ),
      asset: 'USDT',
      note: null,
    };

    const parts = (include ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.includes('preview')) {
      detail.preview = await this.buildPreview(id);
    }
    if (parts.includes('payouts') || parts.includes('items')) {
      detail.payouts = await this.loadPayouts(id);
    }
    if (parts.includes('ledger')) {
      detail.ledger = await this.loadLedger(id);
    }
    if (parts.includes('audit')) {
      detail.audit = await this.loadAudit(id);
    }

    return detail;
  }

  async createEvent(
    actorId: string,
    actorRoles: string[],
    body: {
      trackId: string;
      grossRevenue: string;
      asset?: string;
      source?: string;
      periodFrom: string;
      periodTo: string;
      note?: string;
    },
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertFinance(actorRoles, 'mutate');
    const gross = new Prisma.Decimal(body.grossRevenue);
    if (gross.lessThanOrEqualTo(0)) {
      throwAdminError(
        'INVALID_AMOUNT',
        'Gross revenue must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }

    const release = await this.prisma.release.findUnique({
      where: { id: body.trackId },
    });
    if (!release) {
      throwAdminError(
        'RELEASE_NOT_FOUND',
        'Release not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const duplicate = await this.prisma.earningPeriod.findFirst({
      where: {
        releaseId: body.trackId,
        periodStart: new Date(body.periodFrom),
        periodEnd: new Date(body.periodTo),
        status: { not: EarningPeriodStatus.CANCELLED },
      },
    });
    if (duplicate) {
      throwAdminError(
        'DUPLICATE_PERIOD',
        'Revenue event for this release and period already exists',
        HttpStatus.CONFLICT,
      );
    }

    const period = await this.prisma.earningPeriod.create({
      data: {
        releaseId: body.trackId,
        periodStart: new Date(body.periodFrom),
        periodEnd: new Date(body.periodTo),
        status: EarningPeriodStatus.OPEN,
        reports: {
          create: {
            source: body.source ?? 'streaming',
            grossRevenue: gross,
            netRevenue: gross,
          },
        },
      },
      include: this.listInclude(),
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'revenue_event',
      entityId: period.id,
      action: 'revenue_event.create',
      after: {
        grossRevenue: body.grossRevenue,
        trackId: body.trackId,
        note: body.note,
      },
      ...meta,
    });

    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { email: true },
    });

    return mapRevenueListItem(
      {
        ...period,
        release: {
          ...period.release,
          artists: period.release.releaseArtists.map((ra) => ({
            artist: ra.artist,
          })),
        },
      },
      { createdBy: actor?.email ?? actorId, holdersCount: 0 },
    );
  }

  async previewDistribution(roles: string[], body: { revenueEventId: string }) {
    this.assertFinance(roles, 'view');
    return this.buildPreview(body.revenueEventId);
  }

  async savePreview(
    roles: string[],
    body: { revenueEventId: string },
    meta?: { ip: string | null; userAgent: string | null },
    actorId?: string,
    actorRoles?: string[],
  ) {
    this.assertFinance(roles, 'mutate');
    const preview = await this.buildPreview(body.revenueEventId);
    if (!preview.reconciliationOk) {
      throwAdminError(
        'RECONCILIATION_FAILED',
        'Gross revenue does not reconcile with split totals',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (preview.holdersCount === 0 || Number(preview.totalUnits) <= 0) {
      throwAdminError(
        'NO_ELIGIBLE_HOLDERS',
        'Release has no sold units / eligible holders for distribution',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.earningPeriod.update({
      where: { id: body.revenueEventId },
      data: {
        status: EarningPeriodStatus.CALCULATED,
        calculationSnapshot: preview,
        lastError: null,
      },
    });
    if (actorId && actorRoles && meta) {
      await this.audit.logOperatorAction({
        actorUserId: actorId,
        actorRoles,
        entityType: 'revenue_event',
        entityId: body.revenueEventId,
        action: 'distribution.preview.save',
        after: {
          roundingDelta: preview.roundingDelta,
          holdersAmount: preview.holdersAmount,
        },
        ...meta,
      });
    }
    return preview;
  }

  async submitForReview(
    actorId: string,
    actorRoles: string[],
    revenueEventId: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertFinance(actorRoles, 'mutate');
    const period = await this.requirePeriod(revenueEventId);
    if (period.status !== EarningPeriodStatus.CALCULATED) {
      throwAdminError(
        'INVALID_STATUS',
        'Only calculated events can be submitted for review',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.earningPeriod.update({
      where: { id: revenueEventId },
      data: { status: EarningPeriodStatus.REVIEW },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'revenue_event',
      entityId: revenueEventId,
      action: 'distribution.submit_review',
      ...meta,
    });
    return { ok: true as const, status: 'review' };
  }

  async approveDistribution(
    actorId: string,
    actorRoles: string[],
    revenueEventId: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    if (!actorRoles.some((r) => APPROVE_ROLES.has(r))) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Only SUPER_ADMIN or ADMIN can approve distributions',
        HttpStatus.FORBIDDEN,
      );
    }
    const period = await this.requirePeriod(revenueEventId);
    if (period.status !== EarningPeriodStatus.REVIEW) {
      throwAdminError(
        'INVALID_STATUS',
        'Only events in review can be approved',
        HttpStatus.BAD_REQUEST,
      );
    }
    const preview = await this.buildPreview(revenueEventId);
    if (!preview.reconciliationOk) {
      throwAdminError(
        'RECONCILIATION_FAILED',
        'Cannot approve: reconciliation check failed',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (preview.holdersCount === 0 || Number(preview.totalUnits) <= 0) {
      throwAdminError(
        'NO_ELIGIBLE_HOLDERS',
        'Cannot approve: no eligible holders at period cutoff',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      const period = await tx.earningPeriod.findUniqueOrThrow({
        where: { id: revenueEventId },
      });
      await persistHolderSnapshots(tx, period, 'OWNERSHIP_LEDGER');
      await tx.earningPeriod.update({
        where: { id: revenueEventId },
        data: {
          status: EarningPeriodStatus.APPROVED,
          approvedAt: new Date(),
          approvedByUserId: actorId,
          calculationSnapshot: preview,
        },
      });
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'revenue_event',
      entityId: revenueEventId,
      action: 'distribution.approve',
      ...meta,
    });
    return { ok: true as const, status: 'approved' };
  }

  async cancelEvent(
    actorId: string,
    actorRoles: string[],
    revenueEventId: string,
    meta: { ip: string | null; userAgent: string | null },
    note?: string,
  ) {
    this.assertFinance(actorRoles, 'mutate');
    const period = await this.requirePeriod(revenueEventId);
    if (period.status === EarningPeriodStatus.DISTRIBUTED) {
      throwAdminError(
        'ALREADY_DISTRIBUTED',
        'Cannot cancel a completed distribution',
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.earningPeriod.update({
      where: { id: revenueEventId },
      data: { status: EarningPeriodStatus.CANCELLED, lastError: note ?? null },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'revenue_event',
      entityId: revenueEventId,
      action: 'revenue_event.cancel',
      after: { note },
      ...meta,
    });
    return { ok: true as const, status: 'cancelled' };
  }

  async retryFailed(
    actorId: string,
    actorRoles: string[],
    revenueEventId: string,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertFinance(actorRoles, 'mutate');
    const period = await this.requirePeriod(revenueEventId);
    if (period.status !== EarningPeriodStatus.FAILED) {
      throwAdminError(
        'INVALID_STATUS',
        'Only failed events can be retried',
        HttpStatus.BAD_REQUEST,
      );
    }
    const existing = await this.prisma.earningDistribution.findFirst({
      where: { earningPeriodId: revenueEventId },
    });
    if (existing) {
      throwAdminError(
        'DISTRIBUTION_EXISTS',
        'Partial distribution exists; cannot retry automatically',
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.earningPeriod.update({
      where: { id: revenueEventId },
      data: {
        status: EarningPeriodStatus.APPROVED,
        lastError: null,
        runIdempotencyKey: null,
      },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'revenue_event',
      entityId: revenueEventId,
      action: 'distribution.retry',
      ...meta,
    });
    return { ok: true as const, status: 'approved' };
  }

  async runDistribution(
    actorId: string,
    actorRoles: string[],
    body: {
      revenueEventId: string;
      note?: string;
      idempotencyKey?: string;
    },
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertFinance(actorRoles, 'mutate');
    this.flags.assertEnabled('enableRevenueDistributionRun');
    const idempotencyKey = body.idempotencyKey?.trim();
    if (!idempotencyKey) {
      throwAdminError(
        'IDEMPOTENCY_KEY_REQUIRED',
        'Idempotency-Key is required for distribution run',
        HttpStatus.BAD_REQUEST,
      );
    }

    const preview = await this.buildPreview(body.revenueEventId);
    if (!preview.reconciliationOk) {
      throwAdminError(
        'RECONCILIATION_FAILED',
        'Cannot run: totals do not reconcile',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (preview.holdersCount === 0 || Number(preview.totalUnits) <= 0) {
      throwAdminError(
        'NO_ELIGIBLE_HOLDERS',
        'Cannot run distribution: no eligible holders',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dupKey = await this.prisma.earningPeriod.findFirst({
      where: { runIdempotencyKey: idempotencyKey },
    });
    if (dupKey && dupKey.id !== body.revenueEventId) {
      throwAdminError(
        'IDEMPOTENCY_CONFLICT',
        'Idempotency key already used for another event',
        HttpStatus.CONFLICT,
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const period = await tx.earningPeriod.findUnique({
          where: { id: body.revenueEventId },
          include: {
            release: true,
            reports: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        });
        if (!period) {
          throwAdminError(
            'REVENUE_NOT_FOUND',
            'Revenue event not found',
            HttpStatus.NOT_FOUND,
          );
        }
        if (period.status === EarningPeriodStatus.DISTRIBUTED) {
          if (period.runIdempotencyKey === idempotencyKey) {
            return;
          }
          throwAdminError(
            'ALREADY_DISTRIBUTED',
            'Distribution already run',
            HttpStatus.CONFLICT,
          );
        }
        if (period.status !== EarningPeriodStatus.APPROVED) {
          throwAdminError(
            'INVALID_STATUS',
            'Distribution can only run from approved status',
            HttpStatus.BAD_REQUEST,
          );
        }

        const existing = await tx.earningDistribution.findFirst({
          where: { earningPeriodId: period.id },
        });
        if (existing) {
          throwAdminError(
            'ALREADY_DISTRIBUTED',
            'Distribution already exists',
            HttpStatus.CONFLICT,
          );
        }

        const gross = period.reports[0]?.grossRevenue ?? new Prisma.Decimal(0);
        const shares = resolveRevenueShares(period.release);
        const { holders: eligibleHolders } = await resolveDistributionHolders(
          tx,
          period,
        );

        const calc = calculateDistribution({
          grossRevenue: gross,
          shares,
          positions: eligibleHolders.map((h) => ({
            userId: h.userId,
            unitsTotal: h.eligibleUnits,
          })),
        });

        if (calc.totalUnits.lessThanOrEqualTo(0)) {
          throwAdminError(
            'NO_SOLD_UNITS',
            'Release has no sold units',
            HttpStatus.BAD_REQUEST,
          );
        }

        const amountByUser = new Map(
          calc.holders.map((h) => [h.userId, h.payoutAmount]),
        );

        const distribution = await tx.earningDistribution.create({
          data: {
            earningPeriodId: period.id,
            releaseId: period.releaseId,
            totalDistributable: calc.holdersPool,
            platformShareAmount: calc.platformAmount,
            artistShareAmount: calc.artistAmount,
            holdersTotalPaid: calc.holdersTotalAllocated,
            roundingDelta: calc.roundingDelta,
            perUnitAmount: calc.holdersPool.div(calc.totalUnits),
            snapshotEligibleUnits: calc.totalUnits,
          },
        });

        for (const holder of eligibleHolders) {
          const amount = amountByUser.get(holder.userId);
          if (!amount || amount.lessThanOrEqualTo(0)) continue;
          const holderUser = await tx.user.findUnique({
            where: { id: holder.userId },
            include: { wallets: { take: 1 } },
          });
          const wallet = holderUser?.wallets[0];
          if (!wallet) {
            throwAdminError(
              'WALLET_NOT_FOUND',
              `Wallet not found for user ${holder.userId}`,
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }

          const payoutKey = `${distribution.id}:${holder.userId}`;

          const walletTx = await this.ledger.createWalletTransaction(tx, {
            walletId: wallet.id,
            txType: WalletTxType.PAYOUT,
            direction: WalletTxDirection.IN,
            amount,
            feeAmount: new Prisma.Decimal(0),
            netAmount: amount,
            currency: 'USDT',
            status: WalletTxStatus.COMPLETED,
            referenceType: 'earning_distribution',
            referenceId: distribution.id,
            ctx: {
              operationType: LedgerOperationType.PAYOUT,
              sourceEntityType: 'earning_distribution',
              sourceEntityId: distribution.id,
              actorUserId: actorId,
              actorRole: ActorRole.ADMIN,
              currency: 'USDT',
              idempotencyKey: `payout-tx:${payoutKey}`,
            },
          });

          await this.ledger.creditAvailable(tx, wallet.id, amount, {
            operationType: LedgerOperationType.PAYOUT,
            sourceEntityType: 'earning_distribution',
            sourceEntityId: distribution.id,
            actorUserId: actorId,
            actorRole: ActorRole.ADMIN,
            currency: 'USDT',
            idempotencyKey: `payout-credit:${payoutKey}`,
            walletTransactionId: walletTx.id,
          });

          await tx.payout.create({
            data: {
              userId: holder.userId,
              releaseId: period.releaseId,
              earningDistributionId: distribution.id,
              walletTxId: walletTx.id,
              unitsEligible: holder.eligibleUnits,
              amountGross: amount,
              amountNet: amount,
              status: PayoutStatus.PAID,
            },
          });

          await tx.ownershipLedger.create({
            data: {
              userId: holder.userId,
              releaseId: period.releaseId,
              eventType: OwnershipEventType.PAYOUT_SNAPSHOT,
              unitsDelta: new Prisma.Decimal(0),
              pricePerUnit: calc.holdersPool.div(calc.totalUnits),
              happenedAt: new Date(),
            },
          });
        }

        await tx.earningPeriod.update({
          where: { id: period.id },
          data: {
            status: EarningPeriodStatus.DISTRIBUTED,
            runIdempotencyKey: idempotencyKey,
            lastError: null,
          },
        });
      });
    } catch (err) {
      if (!(err instanceof HttpException)) {
        const message =
          err instanceof Error ? err.message : 'Distribution run failed';
        await this.prisma.earningPeriod.updateMany({
          where: {
            id: body.revenueEventId,
            status: { not: EarningPeriodStatus.DISTRIBUTED },
          },
          data: {
            status: EarningPeriodStatus.FAILED,
            lastError: message.slice(0, 2000),
          },
        });
      }
      throw err;
    }

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'revenue_event',
      entityId: body.revenueEventId,
      action: 'distribution.run',
      after: {
        note: body.note,
        idempotencyKey,
        holdersCount: preview.holders.length,
        roundingDelta: preview.roundingDelta,
      },
      ...meta,
    });

    return {
      ok: true as const,
      revenueEventId: body.revenueEventId,
      status: 'paid',
      idempotencyKey,
    };
  }

  private async buildPreview(
    revenueEventId: string,
  ): Promise<AdminRevenuePreviewDto> {
    const period = await this.prisma.earningPeriod.findUnique({
      where: { id: revenueEventId },
      include: {
        release: true,
        reports: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!period) {
      throwAdminError(
        'REVENUE_NOT_FOUND',
        'Revenue event not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const gross = period.reports[0]?.grossRevenue ?? new Prisma.Decimal(0);
    const shares = resolveRevenueShares(period.release);

    const { holders: eligibleHolders } = await resolveDistributionHolders(
      this.prisma,
      period,
    );

    const users = await this.prisma.user.findMany({
      where: { id: { in: eligibleHolders.map((h) => h.userId) } },
      include: {
        wallets: { take: 1, include: { balance: true } },
      },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    const calc = calculateDistribution({
      grossRevenue: gross,
      shares,
      positions: eligibleHolders.map((h) => ({
        userId: h.userId,
        unitsTotal: h.eligibleUnits,
      })),
    });

    const holders = eligibleHolders.map((h) => {
      const alloc = calc.holders.find((x) => x.userId === h.userId);
      const user = userById.get(h.userId);
      const wallet = user?.wallets[0];
      return {
        userId: h.userId,
        userEmail: user?.email ?? '',
        units: h.eligibleUnits.toString(),
        percentage: alloc?.percentage.toFixed(4) ?? '0',
        payoutAmount: alloc?.payoutAmount.toFixed(8) ?? '0',
        walletId: wallet?.id ?? null,
        availableBalance: wallet?.balance?.available.toString() ?? '0',
      };
    });

    return {
      revenueEventId: period.id,
      trackTitle: period.release.title,
      grossRevenue: gross.toString(),
      platformAmount: calc.platformAmount.toFixed(8),
      artistAmount: calc.artistAmount.toFixed(8),
      holdersAmount: calc.holdersPool.toFixed(8),
      holderSharePct: shares.holderPct.mul(100).toFixed(2),
      platformSharePct: shares.platformPct.mul(100).toFixed(2),
      artistSharePct: shares.artistPct.mul(100).toFixed(2),
      totalUnits: calc.totalUnits.toString(),
      participatingUnits: calc.totalUnits.toString(),
      holdersCount: holders.length,
      holdersTotalAllocated: calc.holdersTotalAllocated.toFixed(8),
      roundingDelta: calc.roundingDelta.toFixed(8),
      reconciliationOk: calc.reconciled,
      holders,
    };
  }

  private async requirePeriod(revenueEventId: string) {
    const period = await this.prisma.earningPeriod.findUnique({
      where: { id: revenueEventId },
    });
    if (!period) {
      throwAdminError(
        'REVENUE_NOT_FOUND',
        'Revenue event not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return period;
  }

  private buildWhere(
    query: AdminRevenueQueryDto,
  ): Prisma.EarningPeriodWhereInput {
    const where: Prisma.EarningPeriodWhereInput = {};
    const andParts: Prisma.EarningPeriodWhereInput[] = [];

    if (query.search?.trim()) {
      const q = query.search.trim();
      andParts.push({
        OR: [
          { id: q },
          { releaseId: q },
          { release: { title: { contains: q, mode: 'insensitive' } } },
          {
            release: {
              releaseArtists: {
                some: {
                  artist: { name: { contains: q, mode: 'insensitive' } },
                },
              },
            },
          },
        ],
      });
    }

    if (query.status && query.status !== 'all') {
      const dbStatus = apiRevenueStatusToDb(query.status);
      if (dbStatus) where.status = dbStatus;
    }

    if (query.source?.trim() && query.source !== 'all') {
      where.reports = { some: { source: query.source.trim() } };
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const minA = this.parseNum(query.minAmount);
    const maxA = this.parseNum(query.maxAmount);
    if (minA !== null || maxA !== null) {
      where.reports = {
        ...(where.reports as object),
        some: {
          grossRevenue: {
            ...(minA !== null ? { gte: new Prisma.Decimal(minA) } : {}),
            ...(maxA !== null ? { lte: new Prisma.Decimal(maxA) } : {}),
          },
        },
      };
    }

    if (query.revenueFilter === 'pending') {
      where.status = EarningPeriodStatus.OPEN;
    }
    if (query.revenueFilter === 'completed') {
      where.status = EarningPeriodStatus.DISTRIBUTED;
    }
    if (query.revenueFilter === 'manual_review') {
      where.status = EarningPeriodStatus.REVIEW;
    }
    if (query.revenueFilter === 'failed') {
      where.status = EarningPeriodStatus.FAILED;
    }

    if (andParts.length) {
      where.AND = andParts;
    }

    return where;
  }

  private buildOrderBy(
    query: AdminRevenueQueryDto,
  ): Prisma.EarningPeriodOrderByWithRelationInput {
    switch (query.sortBy) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'amount':
        return { reports: { _count: 'desc' } };
      case 'track':
        return { release: { title: 'asc' } };
      default:
        return { createdAt: query.sortDir ?? 'desc' };
    }
  }

  private parseNum(v?: string): number | null {
    if (v == null || v.trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private async loadCreatorEmails(ids: string[]) {
    if (!ids.length) return new Map<string, string>();
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'revenue_event',
        entityId: { in: ids },
        action: 'revenue_event.create',
      },
      include: { actorUser: { select: { email: true } } },
    });
    return new Map(
      logs.map((l) => [l.entityId!, l.actorUser?.email ?? 'system']),
    );
  }

  private async loadHolderCounts(releaseIds: string[]) {
    if (!releaseIds.length) return new Map<string, number>();
    const grouped = await this.prisma.userPosition.groupBy({
      by: ['releaseId'],
      where: { releaseId: { in: releaseIds }, unitsTotal: { gt: 0 } },
      _count: { id: true },
    });
    return new Map(grouped.map((g) => [g.releaseId, g._count.id]));
  }

  private async loadPayouts(revenueEventId: string) {
    const distribution = await this.prisma.earningDistribution.findFirst({
      where: { earningPeriodId: revenueEventId },
      include: {
        payouts: {
          include: {
            user: { select: { email: true } },
            walletTransaction: true,
          },
        },
      },
    });
    if (!distribution) return [];

    const totalUnits = distribution.snapshotEligibleUnits;
    return distribution.payouts.map((p) => {
      const pct = totalUnits.greaterThan(0)
        ? p.unitsEligible.div(totalUnits).mul(100)
        : new Prisma.Decimal(0);
      return {
        id: p.id,
        userId: p.userId,
        userEmail: p.user.email,
        units: p.unitsEligible.toString(),
        percentage: pct.toFixed(4),
        amountUsdt: Number(p.amountNet.toString()).toFixed(2),
        walletTxId: p.walletTxId,
        status: payoutStatusToApi(p.status),
        createdAt: p.createdAt.toISOString(),
        completedAt: p.walletTransaction?.settledAt?.toISOString() ?? null,
      };
    });
  }

  private async loadLedger(revenueEventId: string) {
    const distribution = await this.prisma.earningDistribution.findFirst({
      where: { earningPeriodId: revenueEventId },
    });
    if (!distribution) return [];

    const txs = await this.prisma.walletTransaction.findMany({
      where: {
        referenceType: 'earning_distribution',
        referenceId: distribution.id,
      },
      include: {
        wallet: { include: { user: { select: { email: true, id: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return txs.map((tx) => ({
      id: tx.id,
      operationType: 'payout_credit',
      amountUsdt: Number(tx.netAmount.toString()).toFixed(2),
      status: walletTxStatusLabel(tx.status),
      userId: tx.wallet.user.id,
      userEmail: tx.wallet.user.email,
      createdAt: tx.createdAt.toISOString(),
      completedAt: tx.settledAt?.toISOString() ?? null,
    }));
  }

  private async loadAudit(revenueEventId: string) {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType: 'revenue_event', entityId: revenueEventId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actorUser: { select: { email: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      actorEmail: r.actorUser?.email ?? null,
      before: r.beforeJsonb,
      after: r.afterJsonb,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  private assertFinance(roles: string[], mode: 'view' | 'mutate') {
    assertBusinessAnalystReadOnly(roles, mode === 'view' ? 'view' : 'mutate');
    assertMatrixSection(roles, 'revenue', mode === 'view' ? 'view' : 'mutate');
  }
}
