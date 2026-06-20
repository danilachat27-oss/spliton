import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CACHE_TTL_MS } from '../../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../../common/cache/ttl-cache.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import {
  genreMatchKey,
  genreSlugFromName,
  normalizeGenreName,
} from '../common/admin-genre.util';
import { throwAdminError } from '../common/admin-http.util';
import { assertMatrixSection } from '../common/admin-role-matrix';

type GenreRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  releaseCount: number;
};

@Injectable()
export class AdminReleaseGenresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly cache: TtlCacheService,
  ) {}

  async list(roles: string[], search?: string, activeOnly = false) {
    this.assertView(roles);
    const q = search?.trim();
    if (!q) {
      const cacheKey = `admin:release-genres:list:${activeOnly ? 'active' : 'all'}`;
      return this.cache.getOrSet(cacheKey, CACHE_TTL_MS.adminReferenceDictionary, () =>
        this.fetchList(activeOnly, q),
      );
    }
    return this.fetchList(activeOnly, q);
  }

  private async fetchList(activeOnly: boolean, q?: string) {
    const rows = await this.prisma.releaseGenre.findMany({
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
    this.cache.invalidate('admin:release-genres:list:active');
    this.cache.invalidate('admin:release-genres:list:all');
  }

  async getById(roles: string[], id: string): Promise<GenreRow> {
    this.assertView(roles);
    const row = await this.prisma.releaseGenre.findUnique({
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
      throwAdminError('GENRE_NOT_FOUND', 'Genre not found', HttpStatus.NOT_FOUND);
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
    const name = normalizeGenreName(body.name);
    if (!name) {
      throwAdminError('VALIDATION', 'Name is required', HttpStatus.BAD_REQUEST);
    }
    const existing = await this.findByMatchKey(name);
    if (existing) {
      return this.getById(roles, existing.id);
    }
    const slug = await this.resolveUniqueSlug(body.slug?.trim() || genreSlugFromName(name));
    const row = await this.prisma.releaseGenre.create({
      data: { name, slug, isActive: true },
    });
    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'release_genre',
      entityId: row.id,
      action: 'release_genre.create',
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
    const existing = await this.prisma.releaseGenre.findUnique({ where: { id } });
    if (!existing) {
      throwAdminError('GENRE_NOT_FOUND', 'Genre not found', HttpStatus.NOT_FOUND);
    }
    const data: Prisma.ReleaseGenreUpdateInput = {};
    const name = body.name !== undefined ? normalizeGenreName(body.name) : undefined;
    if (body.name !== undefined && !name) {
      throwAdminError('VALIDATION', 'Name is required', HttpStatus.BAD_REQUEST);
    }
    if (name) {
      const clash = await this.findByMatchKey(name, id);
      if (clash) {
        throwAdminError(
          'GENRE_DUPLICATE',
          `Genre already exists as "${clash.name}"`,
          HttpStatus.CONFLICT,
        );
      }
      data.name = name;
    }
    if (body.slug?.trim()) {
      data.slug = await this.resolveUniqueSlug(body.slug.trim(), id);
    } else if (name) {
      data.slug = await this.resolveUniqueSlug(genreSlugFromName(name), id);
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const row = await this.prisma.releaseGenre.update({ where: { id }, data });

    if (name && name !== existing.name) {
      await this.prisma.release.updateMany({
        where: { genreId: id },
        data: { genre: name },
      });
    }

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'release_genre',
      entityId: id,
      action: body.isActive === false ? 'release_genre.deactivate' : 'release_genre.update',
      before: { name: existing.name, slug: existing.slug, isActive: existing.isActive },
      after: { name: row.name, slug: row.slug, isActive: row.isActive },
      ...meta,
    });
    this.invalidateListCache();
    return this.getById(roles, id);
  }

  /** Resolve genre for track/release save — finds or creates active dictionary row. */
  async resolveForRelease(
    tx: Prisma.TransactionClient,
    rawGenre: string | null | undefined,
  ): Promise<{ id: string; name: string } | null> {
    const name = normalizeGenreName(rawGenre);
    if (!name) return null;

    const existing = await this.findByMatchKeyInTx(tx, name);
    if (existing) {
      if (!existing.isActive) {
        const reactivated = await tx.releaseGenre.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
        return { id: reactivated.id, name: reactivated.name };
      }
      return { id: existing.id, name: existing.name };
    }

    const slug = await this.resolveUniqueSlugInTx(tx, genreSlugFromName(name));
    const created = await tx.releaseGenre.create({
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
  }): GenreRow {
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
    const key = genreMatchKey(name);
    if (!key) return null;
    const rows = await this.prisma.releaseGenre.findMany({
      where: excludeId ? { NOT: { id: excludeId } } : undefined,
      select: { id: true, name: true, isActive: true },
      take: 500,
    });
    return rows.find((r) => genreMatchKey(r.name) === key) ?? null;
  }

  private async findByMatchKeyInTx(tx: Prisma.TransactionClient, name: string) {
    const key = genreMatchKey(name);
    if (!key) return null;
    const rows = await tx.releaseGenre.findMany({
      select: { id: true, name: true, isActive: true },
      take: 500,
    });
    return rows.find((r) => genreMatchKey(r.name) === key) ?? null;
  }

  private async resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = genreSlugFromName(base);
    let suffix = 0;
    for (;;) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const clash = await this.prisma.releaseGenre.findFirst({
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
    let slug = genreSlugFromName(base);
    let suffix = 0;
    for (;;) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const clash = await tx.releaseGenre.findFirst({
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
