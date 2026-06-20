import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import {
  formatMoneyRu,
  pctChange,
  resolveAnalyticsPeriod,
} from '../common/admin-analytics.util';
import {
  coerceUnknownString,
  throwAdminError,
} from '../common/admin-http.util';
import { assertSuperAdminPlatformFees } from '../common/admin-rbac';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminPlatformRevenueQueryDto } from './dto/admin-platform-revenue-query.dto';
import {
  buildSourceBreakdown,
  mapFeeTransaction,
  periodBucketKey,
  sumFees,
  type AdminPlatformFeeHistoryRowDto,
  type AdminPlatformRevenuePeriodPointDto,
  type AdminPlatformRevenueReleaseRowDto,
  type AdminPlatformRevenueSummaryDto,
} from './mappers/admin-platform-revenue.mapper';

@Injectable()
export class AdminPlatformRevenueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async summary(
    roles: string[],
    query?: AdminPlatformRevenueQueryDto,
  ): Promise<AdminPlatformRevenueSummaryDto> {
    this.assertView(roles);
    const { from, to, previousFrom, previousTo } = resolveAnalyticsPeriod(
      query?.period,
      query?.dateFrom,
      query?.dateTo,
    );
    const where = this.buildFeeWhere(query, from, to);
    const prevWhere = this.buildFeeWhere(query, previousFrom, previousTo);

    const [currentGrouped, previousGrouped, totalAgg, count, lastFee] =
      await Promise.all([
        this.prisma.fee.groupBy({
          by: ['feeCode'],
          where,
          _sum: { amountCharged: true },
          _count: { id: true },
        }),
        this.prisma.fee.groupBy({
          by: ['feeCode'],
          where: prevWhere,
          _sum: { amountCharged: true },
        }),
        this.prisma.fee.aggregate({ where, _sum: { amountCharged: true } }),
        this.prisma.fee.count({ where }),
        this.prisma.fee.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

    const allTime = await this.prisma.fee.aggregate({
      _sum: { amountCharged: true },
    });
    const periodTotal = Number((totalAgg._sum.amountCharged ?? 0).toString());
    const prevTotal = sumFees(
      previousGrouped.map((g) => ({
        amountCharged: g._sum.amountCharged ?? new Prisma.Decimal(0),
      })),
    );

    return {
      totalUsdt: formatMoneyRu(allTime._sum.amountCharged ?? 0),
      periodUsdt: formatMoneyRu(periodTotal),
      previousPeriodUsdt: formatMoneyRu(prevTotal),
      deltaPct: pctChange(periodTotal, prevTotal),
      transactionCount: count,
      avgFeeUsdt: count > 0 ? formatMoneyRu(periodTotal / count) : null,
      pendingCount: 0,
      failedCount: 0,
      bySource: buildSourceBreakdown(
        currentGrouped,
        previousGrouped,
        periodTotal,
      ),
      lastUpdatedAt: lastFee?.createdAt.toISOString() ?? null,
    };
  }

  async bySource(roles: string[], query?: AdminPlatformRevenueQueryDto) {
    const summary = await this.summary(roles, query);
    return { items: summary.bySource };
  }

  async byPeriod(roles: string[], query?: AdminPlatformRevenueQueryDto) {
    this.assertView(roles);
    const { from, to } = resolveAnalyticsPeriod(
      query?.period,
      query?.dateFrom,
      query?.dateTo,
    );
    const groupBy = query?.groupBy ?? 'day';
    const where = this.buildFeeWhere(query, from, to);

    const fees = await this.prisma.fee.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 5000,
      select: { feeCode: true, amountCharged: true, createdAt: true },
    });

    const buckets = new Map<
      string,
      { sum: number; count: number; bySource: Map<string, number> }
    >();
    for (const f of fees) {
      const key = periodBucketKey(f.createdAt, groupBy);
      const prev = buckets.get(key) ?? {
        sum: 0,
        count: 0,
        bySource: new Map(),
      };
      const amt = Number(f.amountCharged.toString());
      prev.sum += amt;
      prev.count += 1;
      prev.bySource.set(f.feeCode, (prev.bySource.get(f.feeCode) ?? 0) + amt);
      buckets.set(key, prev);
    }

    const items: AdminPlatformRevenuePeriodPointDto[] = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, v]) => ({
        period,
        amountUsdt: formatMoneyRu(v.sum),
        count: v.count,
        bySource: Object.fromEntries(
          [...v.bySource.entries()].map(([k, val]) => [k, formatMoneyRu(val)]),
        ),
      }));

    return { items, groupBy };
  }

  async byRelease(roles: string[], query?: AdminPlatformRevenueQueryDto) {
    this.assertView(roles);
    const { from, to } = resolveAnalyticsPeriod(
      query?.period,
      query?.dateFrom,
      query?.dateTo,
    );
    const where = this.buildFeeWhere(query, from, to);

    const fees = await this.prisma.fee.findMany({
      where,
      take: 2000,
      select: {
        feeCode: true,
        amountCharged: true,
        subjectType: true,
        subjectId: true,
      },
    });

    const roundIds = fees
      .filter((f) => f.subjectType === 'primary_order' && f.subjectId)
      .map((f) => f.subjectId!);
    const listingIds = fees
      .filter((f) => f.subjectType === 'secondary_trade' && f.subjectId)
      .map((f) => f.subjectId!);

    const [rounds, listings] = await Promise.all([
      roundIds.length
        ? this.prisma.primaryRaiseRound.findMany({
            where: { id: { in: roundIds } },
            include: {
              release: {
                include: {
                  releaseArtists: { take: 1, include: { artist: true } },
                },
              },
            },
          })
        : [],
      listingIds.length
        ? this.prisma.marketListing.findMany({
            where: { id: { in: listingIds } },
            include: {
              release: {
                include: {
                  releaseArtists: { take: 1, include: { artist: true } },
                },
              },
            },
          })
        : [],
    ]);

    const roundMap = new Map(rounds.map((r) => [r.id, r]));
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const releaseAgg = new Map<
      string,
      AdminPlatformRevenueReleaseRowDto & {
        _primary: number;
        _secondary: number;
        _withdrawal: number;
      }
    >();

    for (const f of fees) {
      let releaseId: string | null = null;
      let releaseTitle = '—';
      let artistName: string | null = null;
      let roundId: string | null = null;

      if (f.subjectType === 'primary_order' && f.subjectId) {
        const round = roundMap.get(f.subjectId);
        if (round) {
          releaseId = round.releaseId;
          releaseTitle = round.release.title;
          artistName = round.release.releaseArtists[0]?.artist.name ?? null;
          roundId = round.id;
        }
      } else if (f.subjectType === 'secondary_trade' && f.subjectId) {
        const listing = listingMap.get(f.subjectId);
        if (listing) {
          releaseId = listing.releaseId;
          releaseTitle = listing.release.title;
          artistName = listing.release.releaseArtists[0]?.artist.name ?? null;
        }
      } else if (f.subjectType === 'withdrawal') {
        releaseId = '__withdrawal__';
        releaseTitle = 'Комиссии выводов';
      }

      if (!releaseId) continue;

      const amt = Number(f.amountCharged.toString());
      const row = releaseAgg.get(releaseId) ?? {
        releaseId:
          releaseId === '__withdrawal__' ? 'withdrawal-fees' : releaseId,
        releaseTitle,
        artistName,
        roundId,
        primaryFeeUsdt: '0',
        secondaryFeeUsdt: '0',
        withdrawalFeeUsdt: '0',
        totalFeeUsdt: '0',
        purchaseCount: 0,
        tradeCount: 0,
        _primary: 0,
        _secondary: 0,
        _withdrawal: 0,
      };

      if (f.feeCode === 'primary_purchase_fee') {
        row._primary += amt;
        row.purchaseCount += 1;
      } else if (f.feeCode === 'secondary_market_fee') {
        row._secondary += amt;
        row.tradeCount += 1;
      } else if (f.feeCode === 'withdrawal_fee') {
        row._withdrawal += amt;
      }
      releaseAgg.set(releaseId, row);
    }

    const items = [...releaseAgg.values()]
      .map((r) => ({
        releaseId: r.releaseId,
        releaseTitle: r.releaseTitle,
        artistName: r.artistName,
        roundId: r.roundId,
        primaryFeeUsdt: formatMoneyRu(r._primary),
        secondaryFeeUsdt: formatMoneyRu(r._secondary),
        withdrawalFeeUsdt: formatMoneyRu(r._withdrawal),
        totalFeeUsdt: formatMoneyRu(r._primary + r._secondary + r._withdrawal),
        purchaseCount: r.purchaseCount,
        tradeCount: r.tradeCount,
      }))
      .sort(
        (a, b) =>
          Number(b.totalFeeUsdt.replace(/\s/g, '').replace(',', '.')) -
          Number(a.totalFeeUsdt.replace(/\s/g, '').replace(',', '.')),
      );

    return { items };
  }

  async transactions(roles: string[], query: AdminPlatformRevenueQueryDto) {
    this.assertView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const { from, to } = resolveAnalyticsPeriod(
      query.period,
      query.dateFrom,
      query.dateTo,
    );
    const where = this.buildFeeWhere(query, from, to);

    const [total, rows] = await Promise.all([
      this.prisma.fee.count({ where }),
      this.prisma.fee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          walletTransaction: {
            include: {
              wallet: {
                include: { user: { select: { id: true, email: true } } },
              },
            },
          },
        },
      }),
    ]);

    const mapped = rows.map((r) => mapFeeTransaction(r));
    await this.enrichReleaseInfo(mapped, rows);

    return buildPaginated(mapped, total, page, pageSize);
  }

  async transactionById(roles: string[], id: string) {
    this.assertView(roles);
    const row = await this.prisma.fee.findUnique({
      where: { id },
      include: {
        walletTransaction: {
          include: {
            wallet: {
              include: { user: { select: { id: true, email: true } } },
            },
          },
        },
      },
    });
    if (!row) {
      throwAdminError(
        'FEE_NOT_FOUND',
        'Platform revenue transaction not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const mapped = mapFeeTransaction(row);
    await this.enrichReleaseInfo([mapped], [row]);

    const audit = await this.prisma.auditLog.findMany({
      where: { entityType: 'platform_fees', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { actorUser: { select: { email: true } } },
    });

    return {
      ...mapped,
      rate: row.rate?.toString() ?? null,
      fixedAmount: row.fixedAmount?.toString() ?? null,
      audit: audit.map((a) => ({
        id: a.id,
        action: a.action,
        actorEmail: a.actorUser?.email ?? null,
        before: a.beforeJsonb,
        after: a.afterJsonb,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  async feeSettingsHistory(
    roles: string[],
  ): Promise<{ items: AdminPlatformFeeHistoryRowDto[] }> {
    this.assertView(roles);
    const rows = await this.prisma.platformFeeSetting.findMany({
      orderBy: { effectiveFrom: 'desc' },
      take: 50,
      include: {
        createdBy: { select: { email: true } },
        updatedBy: { select: { email: true } },
      },
    });

    return {
      items: rows.map((r) => ({
        id: r.id,
        primaryPurchaseFeePct: r.primaryPurchaseFeePct.toString(),
        withdrawalFeeUsdt: r.withdrawalFeeFixed.toFixed(2),
        secondaryMarketFeePct: r.secondaryMarketFeePct.toString(),
        premiumMonthlyUsdt: r.premiumFeeMonthly?.toFixed(2) ?? '0',
        effectiveFrom: r.effectiveFrom.toISOString(),
        isActive: r.isActive,
        createdByEmail: r.createdBy?.email ?? null,
        updatedByEmail: r.updatedBy?.email ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  async getFees(roles: string[]) {
    this.assertView(roles);
    const active = await this.prisma.platformFeeSetting.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
      include: {
        createdBy: { select: { email: true } },
        updatedBy: { select: { email: true } },
      },
    });
    if (!active) {
      return {
        primaryPurchaseFeePct: '2.5',
        withdrawalFeeUsdt: '5.00',
        secondaryMarketFeePct: '1.0',
        premiumMonthlyUsdt: '0',
        effectiveFrom: new Date().toISOString(),
        createdByEmail: null,
        updatedByEmail: null,
      };
    }
    return {
      primaryPurchaseFeePct: active.primaryPurchaseFeePct.toString(),
      withdrawalFeeUsdt: active.withdrawalFeeFixed.toFixed(2),
      withdrawalFeePct: active.withdrawalFeePct?.toString() ?? null,
      secondaryMarketFeePct: active.secondaryMarketFeePct.toString(),
      premiumMonthlyUsdt: active.premiumFeeMonthly?.toFixed(2) ?? '0',
      effectiveFrom: active.effectiveFrom.toISOString(),
      updatedAt: active.updatedAt.toISOString(),
      createdByEmail: active.createdBy?.email ?? null,
      updatedByEmail: active.updatedBy?.email ?? null,
    };
  }

  async patchFees(
    actorId: string,
    actorRoles: string[],
    body: Record<string, unknown>,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    assertSuperAdminPlatformFees(actorRoles);

    const current = await this.prisma.platformFeeSetting.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    const before = current
      ? {
          primaryPurchaseFeePct: current.primaryPurchaseFeePct.toString(),
          withdrawalFeeUsdt: current.withdrawalFeeFixed.toString(),
          secondaryMarketFeePct: current.secondaryMarketFeePct.toString(),
        }
      : null;

    const primaryPurchaseFeePct = new Prisma.Decimal(
      coerceUnknownString(
        body.primaryPurchaseFeePct ?? current?.primaryPurchaseFeePct,
        '2.5',
      ),
    );
    const withdrawalFeeUsdt = new Prisma.Decimal(
      coerceUnknownString(
        body.withdrawalFeeUsdt ?? current?.withdrawalFeeFixed,
        '5',
      ),
    );
    const secondaryMarketFeePct = new Prisma.Decimal(
      coerceUnknownString(
        body.secondaryMarketFeePct ?? current?.secondaryMarketFeePct,
        '1',
      ),
    );
    const premiumMonthlyUsdt = new Prisma.Decimal(
      coerceUnknownString(
        body.premiumMonthlyUsdt ?? current?.premiumFeeMonthly,
        '0',
      ),
    );

    this.validateFeeRange(
      primaryPurchaseFeePct,
      0,
      100,
      'primaryPurchaseFeePct',
    );
    this.validateFeeRange(withdrawalFeeUsdt, 0, 1000, 'withdrawalFeeUsdt');
    this.validateFeeRange(
      secondaryMarketFeePct,
      0,
      100,
      'secondaryMarketFeePct',
    );

    const saved = await this.prisma.$transaction(async (tx) => {
      if (current) {
        await tx.platformFeeSetting.update({
          where: { id: current.id },
          data: { isActive: false, updatedByUserId: actorId },
        });
      }
      return tx.platformFeeSetting.create({
        data: {
          primaryPurchaseFeePct,
          withdrawalFeeFixed: withdrawalFeeUsdt,
          withdrawalFeePct: body.withdrawalFeePct
            ? new Prisma.Decimal(coerceUnknownString(body.withdrawalFeePct))
            : null,
          secondaryMarketFeePct,
          premiumFeeMonthly: premiumMonthlyUsdt,
          effectiveFrom: new Date(),
          isActive: true,
          createdByUserId: actorId,
          updatedByUserId: actorId,
        },
      });
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles,
      entityType: 'platform_fees',
      entityId: saved.id,
      action: 'platform_fees.update',
      before: before ?? undefined,
      after: {
        primaryPurchaseFeePct: saved.primaryPurchaseFeePct.toString(),
        withdrawalFeeUsdt: saved.withdrawalFeeFixed.toString(),
        secondaryMarketFeePct: saved.secondaryMarketFeePct.toString(),
      },
      ...meta,
    });

    return {
      ok: true as const,
      persisted: true,
      primaryPurchaseFeePct: saved.primaryPurchaseFeePct.toString(),
      withdrawalFeeUsdt: saved.withdrawalFeeFixed.toFixed(2),
      secondaryMarketFeePct: saved.secondaryMarketFeePct.toString(),
      premiumMonthlyUsdt: saved.premiumFeeMonthly?.toFixed(2) ?? '0',
      effectiveFrom: saved.effectiveFrom.toISOString(),
    };
  }

  private async enrichReleaseInfo(
    mapped: Array<{
      subjectType: string;
      subjectId: string | null;
      releaseId: string | null;
      releaseTitle: string | null;
    }>,
    rows: Array<{ subjectType: string; subjectId: string | null }>,
  ) {
    const roundIds = rows
      .filter((r) => r.subjectType === 'primary_order' && r.subjectId)
      .map((r) => r.subjectId!);
    const listingIds = rows
      .filter((r) => r.subjectType === 'secondary_trade' && r.subjectId)
      .map((r) => r.subjectId!);

    const [rounds, listings] = await Promise.all([
      roundIds.length
        ? this.prisma.primaryRaiseRound.findMany({
            where: { id: { in: roundIds } },
            include: { release: { select: { id: true, title: true } } },
          })
        : [],
      listingIds.length
        ? this.prisma.marketListing.findMany({
            where: { id: { in: listingIds } },
            include: { release: { select: { id: true, title: true } } },
          })
        : [],
    ]);

    const roundMap = new Map(rounds.map((r) => [r.id, r.release]));
    const listingMap = new Map(listings.map((l) => [l.id, l.release]));

    for (let i = 0; i < mapped.length; i++) {
      const m = mapped[i];
      const src = rows[i];
      if (src.subjectType === 'primary_order' && src.subjectId) {
        const rel = roundMap.get(src.subjectId);
        if (rel) {
          m.releaseId = rel.id;
          m.releaseTitle = rel.title;
        }
      } else if (src.subjectType === 'secondary_trade' && src.subjectId) {
        const rel = listingMap.get(src.subjectId);
        if (rel) {
          m.releaseId = rel.id;
          m.releaseTitle = rel.title;
        }
      }
    }
  }

  private buildFeeWhere(
    query: AdminPlatformRevenueQueryDto | undefined,
    from: Date,
    to: Date,
  ): Prisma.FeeWhereInput {
    const where: Prisma.FeeWhereInput = { createdAt: { gte: from, lte: to } };

    if (query?.source && query.source !== 'all') {
      where.feeCode = query.source;
    }

    const minA = this.parseNum(query?.minAmount);
    const maxA = this.parseNum(query?.maxAmount);
    if (minA !== null || maxA !== null) {
      where.amountCharged = {
        ...(minA !== null ? { gte: new Prisma.Decimal(minA) } : {}),
        ...(maxA !== null ? { lte: new Prisma.Decimal(maxA) } : {}),
      };
    }

    if (query?.subjectType && query.subjectType !== 'all') {
      where.subjectType = query.subjectType;
    }

    if (query?.feeUserId) {
      where.walletTransaction = { wallet: { userId: query.feeUserId } };
    }

    return where;
  }

  private parseNum(v?: string): number | null {
    if (!v?.trim()) return null;
    const n = Number(v.replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  private validateFeeRange(
    value: Prisma.Decimal,
    min: number,
    max: number,
    field: string,
  ) {
    if (value.lessThan(min) || value.greaterThan(max)) {
      throwAdminError(
        'INVALID_FEE',
        `${field} must be between ${min} and ${max}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertView(roles: string[]) {
    const ok = roles.some((r) =>
      [
        'SUPER_ADMIN',
        'ADMIN',
        'ACCOUNTANT',
        'COMPLIANCE',
        'SUPPORT_MANAGER',
        'BUSINESS_ANALYST',
      ].includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
