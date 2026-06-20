import { HttpStatus, Injectable } from '@nestjs/common';
import { ReleaseDocumentVisibility, ReleaseDocumentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAppError } from '../../common/platform/errors/throw-app-error';
import { ErrorCodes } from '../../common/platform/errors/error-codes';

@Injectable()
export class ReleaseDataRoomService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(releaseId: string, userId?: string | null) {
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null, status: { in: ['ACTIVE', 'SOLD_OUT', 'PAUSED'] } },
    });
    if (!release) {
      throwAppError(ErrorCodes.RELEASE_NOT_FOUND, 'Release not found', HttpStatus.NOT_FOUND);
    }

    const isHolder = userId
      ? Boolean(
          await this.prisma.userPosition.findFirst({
            where: { userId, releaseId, unitsTotal: { gt: 0 } },
          }),
        )
      : false;

    const docs = await this.prisma.releaseDocument.findMany({
      where: {
        releaseId,
        status: ReleaseDocumentStatus.PUBLISHED,
        visibility: { not: ReleaseDocumentVisibility.ADMIN_ONLY },
      },
      orderBy: [{ docType: 'asc' }, { version: 'desc' }],
    });

    return {
      releaseId,
      items: docs
        .filter((doc) => this.canAccess(doc.visibility, Boolean(userId), isHolder))
        .map((doc) => ({
          id: doc.id,
          docType: doc.docType,
          title: doc.title || doc.docType,
          locale: doc.locale,
          visibility: doc.visibility.toLowerCase(),
          version: doc.version,
          locked: !this.canAccess(doc.visibility, Boolean(userId), isHolder),
          url: this.canAccess(doc.visibility, Boolean(userId), isHolder) ? doc.url : null,
        })),
    };
  }

  private canAccess(
    visibility: ReleaseDocumentVisibility,
    isAuthenticated: boolean,
    isHolder: boolean,
  ): boolean {
    if (visibility === ReleaseDocumentVisibility.PUBLIC) return true;
    if (visibility === ReleaseDocumentVisibility.AUTHENTICATED) return isAuthenticated;
    if (visibility === ReleaseDocumentVisibility.HOLDERS_ONLY) return isHolder;
    return false;
  }
}
