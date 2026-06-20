import { HttpStatus, Injectable } from '@nestjs/common';
import { PayoutFrequency, Prisma, ReleaseStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { CacheInvalidationService } from '../../../common/platform/cache/cache-invalidation.service';
import {
  coerceUnknownString,
  throwAdminError,
} from '../common/admin-http.util';
import { assertMatrixSection } from '../common/admin-role-matrix';
import { isAudioStorageKey } from '../common/media-storage.constants';
import {
  MediaStorageService,
  type UploadedFilePayload,
} from '../common/media-storage.service';
import { buildPaginated } from '../common/types/paginated-response.type';
import type { AdminListQueryDto } from '../common/dto/admin-list-query.dto';
import {
  apiReleaseStatusToDb,
  mapTrack,
  releaseStatusToApi,
  type AdminTrackListItemDto,
} from './mappers/admin-track.mapper';
import {
  normalizeTrackShares,
  parseNum,
  parseOptionalString,
  parseReleaseDate,
  validateTrackCreateBody,
  validateTrackUpdateBody,
} from './utils/admin-track.validation';
import { AdminReleaseGenresService } from './admin-release-genres.service';
import { AdminLabelsService } from './admin-labels.service';

type TrackBody = Record<string, unknown>;

@Injectable()
export class AdminTracksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly mediaStorage: MediaStorageService,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly releaseGenres: AdminReleaseGenresService,
    private readonly labelsService: AdminLabelsService,
  ) {}

  private include() {
    return {
      label: true,
      releaseArtists: {
        include: { artist: true },
        orderBy: { createdAt: 'asc' as const },
      },
    } satisfies Prisma.ReleaseInclude;
  }

  async list(roles: string[], query: AdminListQueryDto) {
    this.assertView(roles);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ReleaseWhereInput = { deletedAt: null };
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { id: q },
        {
          releaseArtists: {
            some: { artist: { name: { contains: q, mode: 'insensitive' } } },
          },
        },
      ];
    }
    if (query.status && query.status !== 'all') {
      where.status = apiReleaseStatusToDb(query.status);
    }

    const [total, rows] = await Promise.all([
      this.prisma.release.count({ where }),
      this.prisma.release.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: this.include(),
      }),
    ]);

    return buildPaginated(
      rows.map((r) => mapTrack(r)),
      total,
      page,
      pageSize,
    );
  }

  async getById(roles: string[], id: string) {
    this.assertView(roles);
    const row = await this.prisma.release.findFirst({
      where: { id, deletedAt: null },
      include: this.include(),
    });
    if (!row) {
      throwAdminError(
        'TRACK_NOT_FOUND',
        'Track not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return await this.enrichTrackDto(mapTrack(row));
  }

  async uploadCover(
    actorId: string,
    roles: string[],
    id: string,
    file: UploadedFilePayload,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const existing = await this.prisma.release.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throwAdminError(
        'TRACK_NOT_FOUND',
        'Track not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const uploaded = await this.mediaStorage.uploadReleaseCover(id, file);
    const saved = await this.prisma.release.update({
      where: { id },
      data: { coverUrl: uploaded.coverUrl },
      include: this.include(),
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'track',
      entityId: id,
      action: 'track.cover_update',
      before: { coverUrl: existing.coverUrl },
      after: { coverUrl: uploaded.coverUrl, storagePath: uploaded.storagePath },
      ...meta,
    });

    return await this.enrichTrackDto(mapTrack(saved));
  }

  async uploadAudioPreview(
    actorId: string,
    roles: string[],
    id: string,
    file: UploadedFilePayload,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const existing = await this.prisma.release.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throwAdminError(
        'TRACK_NOT_FOUND',
        'Track not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const uploaded = await this.mediaStorage.uploadReleaseAudioPreview(
      id,
      file,
    );
    const saved = await this.prisma.release.update({
      where: { id },
      data: { audioPreviewUrl: uploaded.audioPreviewStorageKey },
      include: this.include(),
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'track',
      entityId: id,
      action: 'track.audio_update',
      before: { audioPreviewUrl: existing.audioPreviewUrl },
      after: { audioPreviewUrl: uploaded.audioPreviewStorageKey },
      ...meta,
    });

    const dto = await this.enrichTrackDto(mapTrack(saved));
    return {
      ...dto,
      audioPreviewUrl: uploaded.audioPreviewSignedUrl,
      audioPreviewStorageKey: uploaded.audioPreviewStorageKey,
    };
  }

  async getAudioPreviewUrl(roles: string[], id: string) {
    this.assertView(roles);
    const row = await this.prisma.release.findFirst({
      where: { id, deletedAt: null },
      select: { audioPreviewUrl: true },
    });
    if (!row) {
      throwAdminError(
        'TRACK_NOT_FOUND',
        'Track not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (!row.audioPreviewUrl || !isAudioStorageKey(row.audioPreviewUrl)) {
      throwAdminError(
        'AUDIO_NOT_STORED',
        'No private audio preview for this release',
        HttpStatus.NOT_FOUND,
      );
    }
    const signedUrl = await this.mediaStorage.createReleaseAudioSignedUrl(
      row.audioPreviewUrl,
    );
    return { signedUrl, expiresInSeconds: 3600 };
  }

  private async enrichTrackDto(
    dto: AdminTrackListItemDto,
  ): Promise<AdminTrackListItemDto> {
    if (!dto.audioPreviewUrl || !isAudioStorageKey(dto.audioPreviewUrl)) {
      return dto;
    }
    if (!this.mediaStorage.isConfigured()) {
      return { ...dto, audioPreviewUrl: undefined };
    }
    try {
      const signedUrl = await this.mediaStorage.createReleaseAudioSignedUrl(
        dto.audioPreviewUrl,
      );
      return { ...dto, audioPreviewUrl: signedUrl };
    } catch {
      return { ...dto, audioPreviewUrl: undefined };
    }
  }

  async create(
    actorId: string,
    roles: string[],
    body: TrackBody,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    validateTrackCreateBody(body);

    const title = parseOptionalString(body.title)!;
    const artistName = parseOptionalString(body.artist)!;
    const slug = this.slugify(coerceUnknownString(body.slug, title));
    const symbol = coerceUnknownString(
      body.symbol,
      slug.slice(0, 8).toUpperCase(),
    ).toUpperCase();
    const shares = normalizeTrackShares(body);
    const totalUnits = parseNum(body.totalUnits) ?? 10000;
    const availableUnits = parseNum(body.availableUnits) ?? totalUnits;
    const releaseDate = parseReleaseDate(body.releaseDate);

    const saved = await this.prisma.$transaction(async (tx) => {
      const artist = await this.ensureArtist(tx, artistName);
      const labelResolved = await this.labelsService.resolveForRelease(
        tx,
        parseOptionalString(body.labelName),
      );
      const genreResolved = await this.releaseGenres.resolveForRelease(
        tx,
        parseOptionalString(body.genre),
      );

      const release = await tx.release.create({
        data: {
          title,
          slug,
          symbol,
          status: ReleaseStatus.DRAFT,
          payoutFrequency: PayoutFrequency.MONTHLY,
          totalUnits: new Prisma.Decimal(String(totalUnits)),
          unitsAvailablePrimary: new Prisma.Decimal(String(availableUnits)),
          primaryUnitPrice: new Prisma.Decimal(
            String(parseNum(body.primaryUnitPrice) ?? 5),
          ),
          coverUrl: parseOptionalString(body.coverUrl),
          audioPreviewUrl: parseOptionalString(body.audioPreviewUrl),
          genre: genreResolved?.name ?? null,
          genreId: genreResolved?.id ?? null,
          description: parseOptionalString(body.description),
          shortDescription: parseOptionalString(body.shortDescription),
          riskDisclosureText: parseOptionalString(body.riskDisclosureText),
          legalDisclaimer: parseOptionalString(body.legalDisclaimer),
          secondaryEnabled:
            body.secondaryEnabled === undefined
              ? undefined
              : Boolean(body.secondaryEnabled),
          releaseDate: releaseDate === undefined ? undefined : releaseDate,
          releaseType: parseOptionalString(body.releaseType),
          copyrightOwner: parseOptionalString(body.copyrightOwner),
          isrc: parseOptionalString(body.isrc),
          upc: parseOptionalString(body.upc),
          spotifyUrl: parseOptionalString(body.spotifyUrl),
          appleMusicUrl: parseOptionalString(body.appleMusicUrl),
          youtubeUrl: parseOptionalString(body.youtubeUrl),
          yandexMusicUrl: parseOptionalString(body.yandexMusicUrl),
          minPurchaseUnits:
            parseNum(body.minPurchaseUnits) != null
              ? new Prisma.Decimal(String(parseNum(body.minPurchaseUnits)))
              : null,
          maxPurchaseUnits:
            parseNum(body.maxPurchaseUnits) != null
              ? new Prisma.Decimal(String(parseNum(body.maxPurchaseUnits)))
              : null,
          distributionNotes: parseOptionalString(body.distributionNotes),
          platformSharePct: shares
            ? new Prisma.Decimal(String(shares.platformSharePct))
            : null,
          artistSharePct: shares
            ? new Prisma.Decimal(String(shares.artistSharePct))
            : null,
          holderSharePct: shares
            ? new Prisma.Decimal(String(shares.holderSharePct))
            : null,
          raiseTargetUsdt: this.decimalOrNull(body.raiseTargetUsdt),
          hardCapUsdt: this.decimalOrNull(body.hardCapUsdt),
          promoBudgetUsdt: this.decimalOrNull(body.promoBudgetUsdt),
          artistUpfrontUsdt: this.decimalOrNull(body.artistUpfrontUsdt),
          platformUpfrontUsdt: this.decimalOrNull(body.platformUpfrontUsdt),
          labelId: labelResolved?.id ?? null,
          releaseArtists: {
            create: { artistId: artist.id, role: 'MAIN' },
          },
        },
        include: this.include(),
      });

      return release;
    });

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'track',
      entityId: saved.id,
      action: 'track.create',
      after: mapTrack(saved),
      ...meta,
    });

    this.cacheInvalidation.onCatalogOrMarketChange();

    return mapTrack(saved);
  }

  async update(
    actorId: string,
    roles: string[],
    id: string,
    body: TrackBody,
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    validateTrackUpdateBody(body);

    const existing = await this.prisma.release.findFirst({
      where: { id, deletedAt: null },
      include: this.include(),
    });
    if (!existing) {
      throwAdminError(
        'TRACK_NOT_FOUND',
        'Track not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const before = mapTrack(existing);
    const shares = normalizeTrackShares(body);
    const releaseDate = parseReleaseDate(body.releaseDate);

    const saved = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.ReleaseUpdateInput = {};

      if (body.title !== undefined)
        data.title = parseOptionalString(body.title) ?? existing.title;
      if (body.coverUrl !== undefined)
        data.coverUrl = parseOptionalString(body.coverUrl);
      if (body.audioPreviewUrl !== undefined) {
        const parsed = parseOptionalString(body.audioPreviewUrl);
        if (
          parsed &&
          !isAudioStorageKey(parsed) &&
          !parsed.includes('/storage/v1/object/sign/') &&
          !parsed.includes('token=')
        ) {
          data.audioPreviewUrl = parsed;
        } else if (!parsed) {
          data.audioPreviewUrl = null;
        }
      }
      if (body.genre !== undefined) {
        const genreResolved = await this.releaseGenres.resolveForRelease(
          tx,
          parseOptionalString(body.genre),
        );
        if (genreResolved) {
          data.genre = genreResolved.name;
          data.releaseGenre = { connect: { id: genreResolved.id } };
        } else {
          data.genre = null;
          data.releaseGenre = { disconnect: true };
        }
      }
      if (body.description !== undefined)
        data.description = parseOptionalString(body.description);
      if (body.shortDescription !== undefined)
        data.shortDescription = parseOptionalString(body.shortDescription);
      if (body.riskDisclosureText !== undefined)
        data.riskDisclosureText = parseOptionalString(body.riskDisclosureText);
      if (body.legalDisclaimer !== undefined)
        data.legalDisclaimer = parseOptionalString(body.legalDisclaimer);
      if (body.secondaryEnabled !== undefined)
        data.secondaryEnabled = Boolean(body.secondaryEnabled);
      if (releaseDate !== undefined) data.releaseDate = releaseDate;
      if (body.releaseType !== undefined)
        data.releaseType = parseOptionalString(body.releaseType);
      if (body.copyrightOwner !== undefined) {
        data.copyrightOwner = parseOptionalString(body.copyrightOwner);
      }
      if (body.isrc !== undefined) data.isrc = parseOptionalString(body.isrc);
      if (body.upc !== undefined) data.upc = parseOptionalString(body.upc);
      if (body.spotifyUrl !== undefined)
        data.spotifyUrl = parseOptionalString(body.spotifyUrl);
      if (body.appleMusicUrl !== undefined) {
        data.appleMusicUrl = parseOptionalString(body.appleMusicUrl);
      }
      if (body.youtubeUrl !== undefined)
        data.youtubeUrl = parseOptionalString(body.youtubeUrl);
      if (body.yandexMusicUrl !== undefined) {
        data.yandexMusicUrl = parseOptionalString(body.yandexMusicUrl);
      }
      if (body.distributionNotes !== undefined) {
        data.distributionNotes = parseOptionalString(body.distributionNotes);
      }

      if (body.labelName !== undefined) {
        const labelResolved = await this.labelsService.resolveForRelease(
          tx,
          parseOptionalString(body.labelName),
        );
        if (labelResolved) {
          data.label = { connect: { id: labelResolved.id } };
        } else {
          data.label = { disconnect: true };
        }
      }

      if (parseNum(body.totalUnits) != null) {
        data.totalUnits = new Prisma.Decimal(String(parseNum(body.totalUnits)));
      }
      if (parseNum(body.availableUnits) != null) {
        data.unitsAvailablePrimary = new Prisma.Decimal(
          String(parseNum(body.availableUnits)),
        );
      }
      if (parseNum(body.primaryUnitPrice) != null) {
        data.primaryUnitPrice = new Prisma.Decimal(
          String(parseNum(body.primaryUnitPrice)),
        );
      }
      if (parseNum(body.minPurchaseUnits) != null) {
        data.minPurchaseUnits = new Prisma.Decimal(
          String(parseNum(body.minPurchaseUnits)),
        );
      }
      if (parseNum(body.maxPurchaseUnits) != null) {
        data.maxPurchaseUnits = new Prisma.Decimal(
          String(parseNum(body.maxPurchaseUnits)),
        );
      }

      if (shares) {
        data.holderSharePct = new Prisma.Decimal(String(shares.holderSharePct));
        data.artistSharePct = new Prisma.Decimal(String(shares.artistSharePct));
        data.platformSharePct = new Prisma.Decimal(
          String(shares.platformSharePct),
        );
      }

      if (body.raiseTargetUsdt !== undefined)
        data.raiseTargetUsdt = this.decimalOrNull(body.raiseTargetUsdt);
      if (body.hardCapUsdt !== undefined)
        data.hardCapUsdt = this.decimalOrNull(body.hardCapUsdt);
      if (body.promoBudgetUsdt !== undefined) {
        data.promoBudgetUsdt = this.decimalOrNull(body.promoBudgetUsdt);
      }
      if (body.artistUpfrontUsdt !== undefined) {
        data.artistUpfrontUsdt = this.decimalOrNull(body.artistUpfrontUsdt);
      }
      if (body.platformUpfrontUsdt !== undefined) {
        data.platformUpfrontUsdt = this.decimalOrNull(body.platformUpfrontUsdt);
      }

      if (body.artist !== undefined) {
        const artistName = parseOptionalString(body.artist)!;
        const artist = await this.ensureArtist(tx, artistName);
        const main = existing.releaseArtists.find((ra) => ra.role === 'MAIN');
        if (main) {
          await tx.releaseArtist.update({
            where: { id: main.id },
            data: { artistId: artist.id },
          });
        } else {
          await tx.releaseArtist.create({
            data: { releaseId: id, artistId: artist.id, role: 'MAIN' },
          });
        }
      }

      return tx.release.update({
        where: { id },
        data,
        include: this.include(),
      });
    });

    const after = mapTrack(saved);
    const action = this.resolveUpdateAuditAction(before, after, body);

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'track',
      entityId: id,
      action,
      before,
      after,
      ...meta,
    });

    this.cacheInvalidation.onCatalogOrMarketChange();

    return after;
  }

  async transitionStatus(
    actorId: string,
    roles: string[],
    id: string,
    action: 'publish' | 'pause' | 'archive' | 'submit_review',
    meta: { ip: string | null; userAgent: string | null },
  ) {
    this.assertMutate(roles);
    const existing = await this.prisma.release.findFirst({
      where: { id, deletedAt: null },
      include: this.include(),
    });
    if (!existing) {
      throwAdminError(
        'TRACK_NOT_FOUND',
        'Track not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const next: ReleaseStatus =
      action === 'publish'
        ? ReleaseStatus.ACTIVE
        : action === 'pause'
          ? ReleaseStatus.PAUSED
          : action === 'submit_review'
            ? ReleaseStatus.REVIEW
            : ReleaseStatus.ARCHIVED;

    this.assertValidStatusTransition(existing.status, next, action);

    if (action === 'publish') {
      this.assertPublishReady(mapTrack(existing));
    }

    const saved = await this.prisma.release.update({
      where: { id },
      data: { status: next },
      include: this.include(),
    });

    const auditAction =
      action === 'submit_review' ? 'track.submit_review' : `track.${action}`;

    await this.audit.logOperatorAction({
      actorUserId: actorId,
      actorRoles: roles,
      entityType: 'track',
      entityId: id,
      action: auditAction,
      before: { status: releaseStatusToApi(existing.status) },
      after: { status: releaseStatusToApi(saved.status) },
      ...meta,
    });

    this.cacheInvalidation.onCatalogOrMarketChange();

    return mapTrack(saved);
  }

  private resolveUpdateAuditAction(
    before: ReturnType<typeof mapTrack>,
    after: ReturnType<typeof mapTrack>,
    body: TrackBody,
  ): string {
    if (body.coverUrl !== undefined && before.coverUrl !== after.coverUrl) {
      return 'track.cover_update';
    }
    if (
      body.audioPreviewUrl !== undefined &&
      before.audioPreviewUrl !== after.audioPreviewUrl
    ) {
      return 'track.media_update';
    }
    const financialKeys = [
      'raiseTargetUsdt',
      'hardCapUsdt',
      'promoBudgetUsdt',
      'artistUpfrontUsdt',
      'platformUpfrontUsdt',
    ];
    if (financialKeys.some((k) => body[k] !== undefined)) {
      return 'track.financial_terms_update';
    }
    if (
      body.totalUnits !== undefined ||
      body.availableUnits !== undefined ||
      body.primaryUnitPrice !== undefined ||
      body.minPurchaseUnits !== undefined ||
      body.maxPurchaseUnits !== undefined
    ) {
      return 'track.units_update';
    }
    return 'track.update';
  }

  private assertPublishReady(track: ReturnType<typeof mapTrack>) {
    const missing: string[] = [];
    if (!track.title?.trim()) missing.push('title');
    if (!track.artist?.trim() || track.artist === '—') missing.push('artist');
    if (!track.genre?.trim() || track.genre === '—') missing.push('genre');
    if (!track.coverUrl) missing.push('coverUrl');
    const sum =
      Number(track.holderSharePct) +
      Number(track.artistSharePct) +
      Number(track.platformSharePct);
    if (Math.abs(sum - 100) > 0.01) missing.push('shares');
    if (Number(track.totalUnits) <= 0) missing.push('totalUnits');
    if (Number(track.primaryUnitPrice) <= 0) missing.push('primaryUnitPrice');
    if (missing.length) {
      throwAdminError(
        'TRACK_NOT_READY',
        `Release is not ready to publish: missing or invalid ${missing.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertValidStatusTransition(
    current: ReleaseStatus,
    next: ReleaseStatus,
    action: string,
  ) {
    if (current === next) return;
    const allowed: Partial<Record<ReleaseStatus, ReleaseStatus[]>> = {
      [ReleaseStatus.DRAFT]: [
        ReleaseStatus.REVIEW,
        ReleaseStatus.ACTIVE,
        ReleaseStatus.ARCHIVED,
      ],
      [ReleaseStatus.REVIEW]: [
        ReleaseStatus.ACTIVE,
        ReleaseStatus.DRAFT,
        ReleaseStatus.ARCHIVED,
      ],
      [ReleaseStatus.ACTIVE]: [
        ReleaseStatus.PAUSED,
        ReleaseStatus.ARCHIVED,
        ReleaseStatus.SOLD_OUT,
      ],
      [ReleaseStatus.PAUSED]: [ReleaseStatus.ACTIVE, ReleaseStatus.ARCHIVED],
      [ReleaseStatus.SOLD_OUT]: [ReleaseStatus.ARCHIVED],
      [ReleaseStatus.ARCHIVED]: [],
    };
    const ok = allowed[current]?.includes(next);
    if (!ok) {
      throwAdminError(
        'INVALID_TRACK_STATUS',
        `Cannot ${action} from status ${releaseStatusToApi(current)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async ensureArtist(tx: Prisma.TransactionClient, artistName: string) {
    let artist = await tx.artist.findFirst({
      where: { name: { equals: artistName, mode: 'insensitive' } },
    });
    if (!artist) {
      artist = await tx.artist.create({
        data: { name: artistName, slug: this.slugify(artistName) },
      });
    }
    return artist;
  }

  private async ensureLabelId(
    tx: Prisma.TransactionClient,
    labelName: string | null,
  ): Promise<string | null> {
    if (!labelName) return null;
    let label = await tx.label.findFirst({
      where: { name: { equals: labelName, mode: 'insensitive' } },
    });
    if (!label) {
      label = await tx.label.create({
        data: { name: labelName, slug: this.slugify(labelName) },
      });
    }
    return label.id;
  }

  private decimalOrNull(value: unknown): Prisma.Decimal | null {
    const n = parseNum(value);
    if (n === null) return null;
    return new Prisma.Decimal(String(n));
  }

  private slugify(value: string): string {
    return (
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64) || `track-${Date.now()}`
    );
  }

  private assertView(roles: string[]) {
    assertMatrixSection(roles, 'tracks', 'view');
  }

  private assertMutate(roles: string[]) {
    assertMatrixSection(roles, 'tracks', 'mutate');
  }
}
