import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  PrimaryRaiseRoundStatus,
  ReleaseStatus,
  UserRoleCode,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { CacheInvalidationService } from '../../../common/platform/cache/cache-invalidation.service';
import {
  coerceUnknownString,
  throwAdminError,
} from '../common/admin-http.util';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import {
  apiRoundStatusToDb,
  mapRound,
  snapRoundAudit,
  type AdminRoundListItemDto,
} from './mappers/admin-round.mapper';
import {
  assertRoundPublishReady,
  parseNum,
  parseOptionalString,
  validateRoundCreateBody,
  validateRoundUpdateBody,
} from './utils/admin-round.validation';

@Injectable()
export class AdminRoundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  private include() {
    return {
      release: {
        include: {
          releaseArtists: {
            include: { artist: true },
            orderBy: { createdAt: 'asc' as const },
            take: 1,
          },
          primaryRaiseRounds: {
            select: { id: true, status: true },
          },
        },
      },
    } satisfies Prisma.PrimaryRaiseRoundInclude;
  }

  async list(roles: string[], query: AdminListQueryDto) {
    this.assertView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PrimaryRaiseRoundWhereInput = {};
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { id: q },
        { release: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (query.status && query.status !== 'all') {
      where.status = apiRoundStatusToDb(query.status);
    }

    const [total, rows] = await Promise.all([
      this.prisma.primaryRaiseRound.count({ where }),
      this.prisma.primaryRaiseRound.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: this.include(),
      }),
    ]);

    return buildPaginated(
      rows.map((r) => mapRound(r)),
      total,
      page,
      pageSize,
    );
  }

  async getById(roles: string[], id: string) {
    this.assertView(roles);
    const row = await this.prisma.primaryRaiseRound.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!row) {
      throwAdminError(
        'ROUND_NOT_FOUND',
        'Round not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return mapRound(row, id);
  }

  async create(
    actorId: string,
    roles: string[],
    body: Record<string, unknown>,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    validateRoundCreateBody(body);

    const releaseId = parseOptionalString(body.trackId ?? body.releaseId)!;
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null },
      include: {
        releaseArtists: { include: { artist: true }, take: 1 },
      },
    });
    if (!release) {
      throwAdminError(
        'TRACK_NOT_FOUND',
        'Release not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (release.status === ReleaseStatus.ARCHIVED) {
      throwAdminError(
        'RELEASE_ARCHIVED',
        'Cannot create round for archived release',
        HttpStatus.BAD_REQUEST,
      );
    }

    const name = parseOptionalString(body.name) ?? 'Первичный раунд';
    const releaseUpdate = this.buildReleaseUpdate(body);

    const saved = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(releaseUpdate).length) {
        await tx.release.update({
          where: { id: releaseId },
          data: releaseUpdate,
        });
      }

      return tx.primaryRaiseRound.create({
        data: {
          releaseId,
          name,
          status: PrimaryRaiseRoundStatus.DRAFT,
          raiseTargetUsdt: new Prisma.Decimal(
            coerceUnknownString(
              body.raiseTargetUsdt ?? release.raiseTargetUsdt,
              '0',
            ).replace(/\s/g, ''),
          ),
          hardCapUsdt: new Prisma.Decimal(
            coerceUnknownString(
              body.hardCapUsdt ?? release.hardCapUsdt,
              '0',
            ).replace(/\s/g, ''),
          ),
          totalUnits: new Prisma.Decimal(
            coerceUnknownString(body.totalUnits ?? release.totalUnits),
          ),
          soldUnits: new Prisma.Decimal(
            coerceUnknownString(body.soldUnits, '0'),
          ),
          startDate: body.startDate
            ? new Date(coerceUnknownString(body.startDate))
            : null,
          endDate: body.endDate
            ? new Date(coerceUnknownString(body.endDate))
            : null,
        },
        include: this.include(),
      });
    });

    const dto = mapRound(saved);
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'round',
      entityId: saved.id,
      action: 'round.create',
      after: snapRoundAudit(dto),
      ...meta,
    });

    this.cacheInvalidation.onCatalogOrMarketChange();

    return dto;
  }

  async update(
    actorId: string,
    roles: string[],
    id: string,
    body: Record<string, unknown>,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    validateRoundUpdateBody(body);

    const existing = await this.prisma.primaryRaiseRound.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!existing) {
      throwAdminError(
        'ROUND_NOT_FOUND',
        'Round not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      existing.status === PrimaryRaiseRoundStatus.COMPLETED ||
      existing.status === PrimaryRaiseRoundStatus.CANCELLED
    ) {
      throwAdminError(
        'ROUND_TERMINAL',
        'Cannot update a closed round',
        HttpStatus.BAD_REQUEST,
      );
    }

    const beforeDto = mapRound(existing, id);
    const data: Prisma.PrimaryRaiseRoundUpdateInput = {};
    const name = parseOptionalString(body.name);
    if (name) data.name = name;
    if (body.raiseTargetUsdt !== undefined) {
      data.raiseTargetUsdt = new Prisma.Decimal(
        coerceUnknownString(body.raiseTargetUsdt).replace(/\s/g, ''),
      );
    }
    if (body.hardCapUsdt !== undefined) {
      data.hardCapUsdt = new Prisma.Decimal(
        coerceUnknownString(body.hardCapUsdt).replace(/\s/g, ''),
      );
    }
    if (body.totalUnits !== undefined) {
      data.totalUnits = new Prisma.Decimal(
        coerceUnknownString(body.totalUnits),
      );
    }
    if (body.soldUnits !== undefined) {
      data.soldUnits = new Prisma.Decimal(coerceUnknownString(body.soldUnits));
    }
    if (body.startDate !== undefined) {
      data.startDate = body.startDate
        ? new Date(coerceUnknownString(body.startDate))
        : null;
    }
    if (body.endDate !== undefined) {
      data.endDate = body.endDate
        ? new Date(coerceUnknownString(body.endDate))
        : null;
    }

    const releaseUpdate = this.buildReleaseUpdate(body);

    const saved = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(releaseUpdate).length) {
        await tx.release.update({
          where: { id: existing.releaseId },
          data: releaseUpdate,
        });
      }
      return tx.primaryRaiseRound.update({
        where: { id },
        data,
        include: this.include(),
      });
    });

    const afterDto = mapRound(saved, id);
    const auditAction = this.resolveUpdateAuditAction(
      beforeDto,
      afterDto,
      body,
    );

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'round',
      entityId: id,
      action: auditAction,
      before: snapRoundAudit(beforeDto),
      after: snapRoundAudit(afterDto),
      ...meta,
    });

    this.cacheInvalidation.onCatalogOrMarketChange();

    return afterDto;
  }

  async transitionStatus(
    actorId: string,
    roles: string[],
    id: string,
    action: 'publish' | 'pause' | 'close',
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);

    const existing = await this.prisma.primaryRaiseRound.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!existing) {
      throwAdminError(
        'ROUND_NOT_FOUND',
        'Round not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const beforeDto = mapRound(existing, id);

    if (
      existing.status === PrimaryRaiseRoundStatus.COMPLETED ||
      existing.status === PrimaryRaiseRoundStatus.CANCELLED
    ) {
      throwAdminError(
        'INVALID_ROUND_TRANSITION',
        'Round is already in a terminal status',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (action === 'publish') {
      if (
        existing.status !== PrimaryRaiseRoundStatus.DRAFT &&
        existing.status !== PrimaryRaiseRoundStatus.PAUSED
      ) {
        throwAdminError(
          'INVALID_ROUND_TRANSITION',
          'Only draft or paused rounds can be published',
          HttpStatus.BAD_REQUEST,
        );
      }

      const release = existing.release;
      const artist = release.releaseArtists[0]?.artist.name ?? '—';
      const hasOtherLive = release.primaryRaiseRounds.some(
        (r) => r.status === PrimaryRaiseRoundStatus.LIVE && r.id !== id,
      );

      assertRoundPublishReady({
        releaseTitle: release.title,
        releaseArtist: artist,
        releaseCoverUrl: release.coverUrl,
        releaseArchived: release.status === ReleaseStatus.ARCHIVED,
        holderSharePct: Number(release.holderSharePct?.toString() ?? 0),
        unitPrice: Number(release.primaryUnitPrice.toString()),
        totalUnits: Number(existing.totalUnits.toString()),
        raiseTarget: Number(existing.raiseTargetUsdt.toString()),
        hardCap: Number(existing.hardCapUsdt.toString()),
        startDate: existing.startDate,
        hasOtherLiveRound: hasOtherLive,
      });
    }

    if (
      action === 'pause' &&
      existing.status !== PrimaryRaiseRoundStatus.LIVE
    ) {
      throwAdminError(
        'INVALID_ROUND_TRANSITION',
        'Only live rounds can be paused',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      action === 'close' &&
      existing.status !== PrimaryRaiseRoundStatus.LIVE &&
      existing.status !== PrimaryRaiseRoundStatus.PAUSED
    ) {
      throwAdminError(
        'INVALID_ROUND_TRANSITION',
        'Only live or paused rounds can be closed',
        HttpStatus.BAD_REQUEST,
      );
    }

    const next: PrimaryRaiseRoundStatus =
      action === 'publish'
        ? PrimaryRaiseRoundStatus.LIVE
        : action === 'pause'
          ? PrimaryRaiseRoundStatus.PAUSED
          : PrimaryRaiseRoundStatus.COMPLETED;

    const saved = await this.prisma.primaryRaiseRound.update({
      where: { id },
      data: { status: next },
      include: this.include(),
    });

    const afterDto = mapRound(saved, id);
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'round',
      entityId: id,
      action: `round.${action}`,
      before: snapRoundAudit(beforeDto),
      after: snapRoundAudit(afterDto),
      ...meta,
    });

    this.cacheInvalidation.onCatalogOrMarketChange();

    return afterDto;
  }

  private buildReleaseUpdate(
    body: Record<string, unknown>,
  ): Prisma.ReleaseUpdateInput {
    const data: Prisma.ReleaseUpdateInput = {};
    const unitPrice = parseNum(body.unitPriceUsdt ?? body.primaryUnitPrice);
    const minP = parseNum(body.minPurchaseUnits);
    const maxP = parseNum(body.maxPurchaseUnits);

    if (unitPrice !== null) {
      data.primaryUnitPrice = new Prisma.Decimal(String(unitPrice));
    }
    if (minP !== null) {
      data.minPurchaseUnits = new Prisma.Decimal(String(minP));
    }
    if (maxP !== null) {
      data.maxPurchaseUnits = new Prisma.Decimal(String(maxP));
    }
    return data;
  }

  private resolveUpdateAuditAction(
    before: AdminRoundListItemDto,
    after: AdminRoundListItemDto,
    body: Record<string, unknown>,
  ): string {
    const financial =
      before.raiseTargetUsdt !== after.raiseTargetUsdt ||
      before.hardCapUsdt !== after.hardCapUsdt ||
      before.unitPriceUsdt !== after.unitPriceUsdt ||
      body.unitPriceUsdt !== undefined ||
      body.primaryUnitPrice !== undefined;

    const units =
      before.totalUnits !== after.totalUnits ||
      before.soldUnits !== after.soldUnits ||
      body.totalUnits !== undefined ||
      body.soldUnits !== undefined;

    const dates =
      before.startDate !== after.startDate ||
      before.endDate !== after.endDate ||
      body.startDate !== undefined ||
      body.endDate !== undefined;

    if (financial && !units && !dates) return 'round.financial_terms_update';
    if (units && !financial && !dates) return 'round.units_update';
    if (dates && !financial && !units) return 'round.date_update';
    return 'round.update';
  }

  private assertView(roles: string[]) {
    const ok = roles.some((r) =>
      (
        [
          UserRoleCode.SUPER_ADMIN,
          UserRoleCode.ADMIN,
          UserRoleCode.CONTENT_MANAGER,
          UserRoleCode.ACCOUNTANT,
          UserRoleCode.BUSINESS_ANALYST,
          UserRoleCode.COMPLIANCE,
        ] as string[]
      ).includes(r),
    );
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private assertMutate(roles: string[]) {
    const ok = roles.some((r) =>
      (
        [
          UserRoleCode.SUPER_ADMIN,
          UserRoleCode.ADMIN,
          UserRoleCode.CONTENT_MANAGER,
        ] as string[]
      ).includes(r),
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
