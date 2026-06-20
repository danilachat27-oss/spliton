import { HttpStatus, Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

import { AdminAuditService } from '../common/admin-audit.service';

import { throwAdminError } from '../common/admin-http.util';

import { assertMatrixSection } from '../common/admin-role-matrix';



@Injectable()

export class AdminArtistsService {

  constructor(

    private readonly prisma: PrismaService,

    private readonly audit: AdminAuditService,

  ) {}



  async list(roles: string[], search?: string) {

    this.assertView(roles);

    const q = search?.trim();

    const rows = await this.prisma.artist.findMany({

      where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,

      orderBy: { name: 'asc' },

      take: 200,

      select: {

        id: true,

        slug: true,

        name: true,

        isActive: true,

        createdAt: true,

        updatedAt: true,

        _count: { select: { releaseArtists: true } },

      },

    });

    return {

      items: rows.map((r) => ({

        id: r.id,

        slug: r.slug,

        name: r.name,

        isActive: r.isActive,

        createdAt: r.createdAt.toISOString(),

        updatedAt: r.updatedAt.toISOString(),

        releaseCount: r._count.releaseArtists,

      })),

    };

  }



  async getById(roles: string[], id: string) {

    this.assertView(roles);

    const row = await this.prisma.artist.findUnique({

      where: { id },

      select: {

        id: true,

        slug: true,

        name: true,

        isActive: true,

        createdAt: true,

        updatedAt: true,

        _count: { select: { releaseArtists: true } },

      },

    });

    if (!row) {

      throwAdminError('ARTIST_NOT_FOUND', 'Artist not found', HttpStatus.NOT_FOUND);

    }

    return {

      id: row.id,

      slug: row.slug,

      name: row.name,

      isActive: row.isActive,

      createdAt: row.createdAt.toISOString(),

      updatedAt: row.updatedAt.toISOString(),

      releaseCount: row._count.releaseArtists,

    };

  }



  async create(

    actorId: string,

    roles: string[],

    body: { name: string; slug?: string },

    meta: { ip: string | null; userAgent: string | null },

  ) {

    this.assertMutate(roles);

    const name = body.name?.trim();

    if (!name) {

      throwAdminError('VALIDATION', 'Name is required', HttpStatus.BAD_REQUEST);

    }

    const slug = await this.resolveUniqueSlug(body.slug?.trim() || this.slugify(name));

    const duplicate = await this.prisma.artist.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) {
      return this.getById(roles, duplicate.id);
    }

    const row = await this.prisma.artist.create({

      data: { name, slug },

    });

    await this.audit.logOperatorAction({

      actorUserId: actorId,

      actorRoles: roles,

      entityType: 'artist',

      entityId: row.id,

      action: 'artist.create',

      after: { name: row.name, slug: row.slug },

      ...meta,

    });

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

    const existing = await this.prisma.artist.findUnique({ where: { id } });

    if (!existing) {

      throwAdminError('ARTIST_NOT_FOUND', 'Artist not found', HttpStatus.NOT_FOUND);

    }

    const name = body.name?.trim();

    const slugInput = body.slug?.trim();

    const data: Prisma.ArtistUpdateInput = {};

    if (name) data.name = name;

    if (slugInput) {

      data.slug = await this.resolveUniqueSlug(slugInput, id);

    } else if (name && !slugInput) {

      data.slug = await this.resolveUniqueSlug(this.slugify(name), id);

    }

    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const row = await this.prisma.artist.update({ where: { id }, data });

    await this.audit.logOperatorAction({

      actorUserId: actorId,

      actorRoles: roles,

      entityType: 'artist',

      entityId: id,

      action: body.isActive === false ? 'artist.deactivate' : 'artist.update',

      before: { name: existing.name, slug: existing.slug, isActive: existing.isActive },

      after: { name: row.name, slug: row.slug, isActive: row.isActive },

      ...meta,

    });

    return this.getById(roles, id);

  }



  async remove(

    actorId: string,

    roles: string[],

    id: string,

    meta: { ip: string | null; userAgent: string | null },

  ) {

    this.assertMutate(roles);

    const existing = await this.prisma.artist.findUnique({

      where: { id },

      include: { _count: { select: { releaseArtists: true } } },

    });

    if (!existing) {

      throwAdminError('ARTIST_NOT_FOUND', 'Artist not found', HttpStatus.NOT_FOUND);

    }

    if (existing._count.releaseArtists > 0) {

      throwAdminError(

        'ARTIST_IN_USE',

        'Artist is linked to releases and cannot be deleted',

        HttpStatus.CONFLICT,

      );

    }

    await this.prisma.artist.delete({ where: { id } });

    await this.audit.logOperatorAction({

      actorUserId: actorId,

      actorRoles: roles,

      entityType: 'artist',

      entityId: id,

      action: 'artist.delete',

      before: { name: existing.name, slug: existing.slug },

      ...meta,

    });

    return { ok: true };

  }



  private async resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {

    let slug = this.slugify(base);

    let suffix = 0;

    for (;;) {

      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;

      const clash = await this.prisma.artist.findFirst({

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



  private slugify(value: string): string {

    return (

      value

        .toLowerCase()

        .replace(/[^a-z0-9]+/g, '-')

        .replace(/^-|-$/g, '')

        .slice(0, 64) || `artist-${Date.now()}`

    );

  }



  private assertView(roles: string[]) {

    assertMatrixSection(roles, 'tracks', 'view');

  }



  private assertMutate(roles: string[]) {

    assertMatrixSection(roles, 'tracks', 'mutate');

  }

}


