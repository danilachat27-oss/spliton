import { HttpStatus, Injectable } from '@nestjs/common';
import { ReleaseStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';

const PUBLIC_STATUSES: ReleaseStatus[] = [
  ReleaseStatus.ACTIVE,
  ReleaseStatus.PAUSED,
  ReleaseStatus.SOLD_OUT,
];

@Injectable()
export class UserAnalyticsResolveService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveReleaseId(idOrSlug: string): Promise<string> {
    const byId = await this.prisma.release.findFirst({
      where: { id: idOrSlug, deletedAt: null },
      select: { id: true },
    });
    if (byId) return byId.id;

    const bySlug = await this.prisma.release.findFirst({
      where: { slug: idOrSlug, deletedAt: null },
      select: { id: true },
    });
    if (bySlug) return bySlug.id;

    throwAdminError(
      'RELEASE_NOT_FOUND',
      'Release not found',
      HttpStatus.NOT_FOUND,
    );
  }

  async assertPublicRelease(releaseId: string): Promise<void> {
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null },
      select: { status: true },
    });
    if (!release || !PUBLIC_STATUSES.includes(release.status)) {
      throwAdminError(
        'RELEASE_NOT_FOUND',
        'Release not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async loadRelease(releaseId: string) {
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null },
      include: {
        releaseArtists: {
          include: { artist: true },
          orderBy: { createdAt: 'asc' },
          take: 3,
        },
        primaryRaiseRounds: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!release) {
      throwAdminError(
        'RELEASE_NOT_FOUND',
        'Release not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return release;
  }
}
