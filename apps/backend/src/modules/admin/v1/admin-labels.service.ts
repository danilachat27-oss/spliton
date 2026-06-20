import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CACHE_TTL_MS } from '../../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../../common/cache/ttl-cache.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import {
  normalizeReferenceName,
  referenceMatchKey,
  referenceSlugFromName,
} from '../common/admin-reference.util';
import { throwAdminError } from '../common/admin-http.util';
import { assertMatrixSection } from '../common/admin-role-matrix';

type LabelRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  releaseCount: number;
};

@Injectable()
export class AdminLabelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly cache: TtlCacheService,
  ) {}

  async list(roles: string[], search?: string, activeOnly = false) {
    this.assertView(roles);
    const q = search?.trim();
    if (!q) {
      const cacheKey = `admin:labels:list:${activeOnly ? 'active' : 'all'}`;
      return this.cache.getOrSet(cacheKey, CACHE_TTL_MS.adminReferenceDictionary, () =>
        this.fetchList(activeOnly, q),
      );
    }
    return this.fetchList(activeOnly, q);
  }

  private async fetchList(activeOnly: boolean, q?: string) {
    const rows = await this.prisma.label.findMany({
      where: {
        ...(activeOnly ? { isActive: true } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      take: 500,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { releases: true } },
      },
    });
    return { items: rows.map((r) => this.mapRow(r)) };
  }

  private invalidateListCache(): void {
    this.cache.invalidate('admin:labels:list:active');
    this.cache.invalidate('admin:labels:list:all');
  }

  async getById(roles: string[], id: string): Promise<LabelRow> {
    this.assertView(roles);
    const row = await this.prisma.label.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { releases: true } },
      },
    });
    if (!row) {
      throwAdminError('LABEL_NOT_FOUND', 'Label not found', HttpStatus.NOT_FOUND);
    }
    return this.mapRow(row);
  }

  async create(
    actorId: string,
    roles: string[],
    body: { name: string; slug?: string },
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const name = normalizeReferenceName(body.name);
    if (!name) {
      throwAdminError('VALIDATION', 'Name is required', HttpStatus.BAD_REQUEST);
    }
    const existing = await this.findByMatchKey(name);
    if (existing) {
      return this.getById(roles, existing.id);
    }
    const slug = await this.resolveUniqueSlug(body.slug?.trim() || referenceSlugFromName(name));
    const row = await this.prisma.label.create({
      data: { name, slug, isActive: true },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'label',
      entityId: row.id,
      action: 'label.create',
      after: { name: row.name, slug: row.slug },
      ...meta,
    });
    this.invalidateListCache();
    return this.getById(roles, row.id);
  }

  async update(
    actorId: string,
    roles: string[],
    id: string,
    body: { name?: string; slug?: string; isActive?: boolean },
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const existing = await this.prisma.label.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError('LABEL_NOT_FOUND', 'Label not found', HttpStatus.NOT_FOUND);
    }
    const data: Prisma.LabelUpdateInput = {};
    const name = body.name !== undefined ? normalizeReferenceName(body.name) : undefined;
    if (body.name !== undefined && !name) {
      throwAdminError('VALIDATION', 'Name is required', HttpStatus.BAD_REQUEST);
    }
    if (name) {
      const clash = await this.findByMatchKey(name, id);
      if (clash) {
        throwAdminError(
          'LABEL_DUPLICATE',
          `Label already exists as "${clash.name}"`,
          HttpStatus.CONFLICT,
        );
      }
      data.name = name;
    }
    if (body.slug?.trim()) {
      data.slug = await this.resolveUniqueSlug(body.slug.trim(), id);
    } else if (name) {
      data.slug = await this.resolveUniqueSlug(referenceSlugFromName(name), id);
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const row = await this.prisma.label.update({ where: { id }, data });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'label',
      entityId: id,
      action: body.isActive === false ? 'label.deactivate' : 'label.update',
      before: { name: existing.name, slug: existing.slug, isActive: existing.isActive },
      after: { name: row.name, slug: row.slug, isActive: row.isActive },
      ...meta,
    });
    this.invalidateListCache();
    return this.getById(roles, id);
  }

  async resolveForRelease(
    tx: Prisma.TransactionClient,
    rawLabel: string | null | undefined,
  ): Promise<{ id: string; name: string } | null> {
    const name = normalizeReferenceName(rawLabel);
    if (!name) return null;

    const existing = await this.findByMatchKeyInTx(tx, name);
    if (existing) {
      if (!existing.isActive) {
        const reactivated = await tx.label.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        return { id: reactivated.id, name: reactivated.name };
      }
      return { id: existing.id, name: existing.name };
    }

    const slug = await this.resolveUniqueSlugInTx(tx, referenceSlugFromName(name));
    const created = await tx.label.create({
      data: { name, slug, isActive: true },
    });
    return { id: created.id, name: created.name };
  }

  private mapRow(row: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: { releases: number };
  }): LabelRow {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      releaseCount: row._count.releases,
    };
  }

  private async findByMatchKey(name: string, excludeId?: string) {
    const key = referenceMatchKey(name);
    if (!key) return null;
    const rows = await this.prisma.label.findMany({
      where: excludeId ? { NOT: { id: excludeId } } : undefined,
      select: { id: true, name: true, isActive: true },
      take: 500,
    });
    return rows.find((r) => referenceMatchKey(r.name) === key) ?? null;
  }

  private async findByMatchKeyInTx(tx: Prisma.TransactionClient, name: string) {
    const key = referenceMatchKey(name);
    if (!key) return null;
    const rows = await tx.label.findMany({
      select: { id: true, name: true, isActive: true },
      take: 500,
    });
    return rows.find((r) => referenceMatchKey(r.name) === key) ?? null;
  }

  private async resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {
    const slug = referenceSlugFromName(base);
    let suffix = 0;
    for (;;) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const clash = await this.prisma.label.findFirst({
        where: {
          slug: candidate,
          ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
      });
      if (!clash) return candidate;
      suffix += 1;
    }
  }

  private async resolveUniqueSlugInTx(
    tx: Prisma.TransactionClient,
    base: string,
  ): Promise<string> {
    const slug = referenceSlugFromName(base);
    let suffix = 0;
    for (;;) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const clash = await tx.label.findFirst({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!clash) return candidate;
      suffix += 1;
    }
  }

  private assertView(roles: string[]) {
    assertMatrixSection(roles, 'tracks', 'view');
  }

  private assertMutate(roles: string[]) {
    assertMatrixSection(roles, 'tracks', 'mutate');
  }
}
