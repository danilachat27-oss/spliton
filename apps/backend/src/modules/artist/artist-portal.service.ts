import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, UserRoleCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAppError } from '../../common/platform/errors/throw-app-error';
import { ErrorCodes } from '../../common/platform/errors/error-codes';

@Injectable()
export class ArtistPortalService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveArtistId(userId: string, roles: string[]) {
    if (!roles.includes(UserRoleCode.ARTIST) && !roles.includes(UserRoleCode.ADMIN)) {
      throwAppError(ErrorCodes.AUTH_FORBIDDEN, 'Artist access required', HttpStatus.FORBIDDEN);
    }
    const link = await this.prisma.artistUserLink.findUnique({ where: { userId } });
    if (!link) {
      throwAppError(
        ErrorCodes.AUTH_FORBIDDEN,
        'Artist profile is not linked to an issuer account',
        HttpStatus.FORBIDDEN,
      );
    }
    return link!.artistId;
  }

  async dashboard(userId: string, roles: string[]) {
    const artistId = await this.resolveArtistId(userId, roles);
    const releaseIds = (
      await this.prisma.releaseArtist.findMany({
        where: { artistId },
        select: { releaseId: true },
      })
    ).map((r) => r.releaseId);

    const [releases, liveRounds, trades30d, payoutsAgg, submissionsOpen] =
      await Promise.all([
        this.prisma.release.count({ where: { id: { in: releaseIds }, deletedAt: null } }),
        this.prisma.primaryRaiseRound.count({
          where: { releaseId: { in: releaseIds }, status: 'LIVE' },
        }),
        this.prisma.trade.count({
          where: {
            releaseId: { in: releaseIds },
            executedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.payout.aggregate({
          where: { releaseId: { in: releaseIds } },
          _sum: { amountNet: true },
        }),
        this.prisma.releaseSubmission.count({
          where: { artistUserId: userId, status: { in: ['DRAFT', 'SUBMITTED', 'IN_REVIEW'] } },
        }),
      ]);

    return {
      summary: {
        releases,
        liveRounds,
        tradesLast30Days: trades30d,
        payoutsTotal: payoutsAgg._sum.amountNet?.toString() ?? '0',
        openSubmissions: submissionsOpen,
      },
    };
  }

  async listReleases(userId: string, roles: string[]) {
    const artistId = await this.resolveArtistId(userId, roles);
    const rows = await this.prisma.release.findMany({
      where: {
        deletedAt: null,
        releaseArtists: { some: { artistId } },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        primaryRaiseRounds: { orderBy: { startDate: 'desc' }, take: 1 },
      },
    });
    return {
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        symbol: r.symbol,
        title: r.title,
        status: r.status.toLowerCase(),
        primaryUnitPrice: r.primaryUnitPrice.toString(),
        unitsAvailablePrimary: r.unitsAvailablePrimary.toString(),
        roundStatus: r.primaryRaiseRounds[0]?.status.toLowerCase() ?? null,
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async getRelease(userId: string, roles: string[], releaseId: string) {
    const artistId = await this.resolveArtistId(userId, roles);
    const row = await this.prisma.release.findFirst({
      where: {
        id: releaseId,
        deletedAt: null,
        releaseArtists: { some: { artistId } },
      },
      include: { primaryRaiseRounds: true },
    });
    if (!row) {
      throwAppError(ErrorCodes.RELEASE_NOT_FOUND, 'Release not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: row!.id,
      title: row!.title,
      slug: row!.slug,
      status: row!.status.toLowerCase(),
      description: row!.description,
      rounds: row!.primaryRaiseRounds.map((round) => ({
        id: round.id,
        status: round.status.toLowerCase(),
        unitsSold: round.soldUnits.toString(),
        unitsTotal: round.totalUnits.toString(),
      })),
    };
  }

  async releaseAnalytics(userId: string, roles: string[], releaseId: string) {
    await this.getRelease(userId, roles, releaseId);
    const [trades, listings, payouts] = await Promise.all([
      this.prisma.trade.count({ where: { releaseId } }),
      this.prisma.marketListing.count({ where: { releaseId, status: 'ACTIVE' } }),
      this.prisma.payout.aggregate({
        where: { releaseId },
        _sum: { amountNet: true },
      }),
    ]);
    return {
      releaseId,
      trades,
      activeListings: listings,
      payoutsTotal: payouts._sum.amountNet?.toString() ?? '0',
    };
  }

  async listDocuments(userId: string, roles: string[]) {
    const artistId = await this.resolveArtistId(userId, roles);
    const docs = await this.prisma.generatedDocument.findMany({
      where: {
        ownerUserId: userId,
        kind: { in: ['ARTIST_ISSUER_STATEMENT', 'PORTFOLIO_STATEMENT', 'PAYOUT_RECEIPT'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      items: docs.map((d) => ({
        id: d.id,
        kind: d.kind.toLowerCase(),
        status: d.status.toLowerCase(),
        createdAt: d.createdAt.toISOString(),
      })),
      artistId,
    };
  }

  async createSubmission(
    userId: string,
    roles: string[],
    body: { title: string; description?: string; payload?: Record<string, unknown> },
  ) {
    await this.resolveArtistId(userId, roles);
    const row = await this.prisma.releaseSubmission.create({
      data: {
        artistUserId: userId,
        title: body.title.trim(),
        description: body.description,
        payload: (body.payload ?? {}) as Prisma.InputJsonValue,
        status: 'DRAFT',
      },
    });
    return { id: row.id, status: 'draft' };
  }
}
