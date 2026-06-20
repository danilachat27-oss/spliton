import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';

@Injectable()
export class SecondaryMarketResolveService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveReleaseId(params: {
    releaseId?: string;
    slug?: string;
    symbol?: string;
  }): Promise<string> {
    if (params.releaseId) {
      const row = await this.prisma.release.findFirst({
        where: { id: params.releaseId, deletedAt: null },
        select: { id: true },
      });
      if (!row) {
        throwAdminError(
          'RELEASE_NOT_FOUND',
          'Release not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return row.id;
    }
    if (params.slug) {
      const row = await this.prisma.release.findFirst({
        where: { slug: params.slug, deletedAt: null },
        select: { id: true },
      });
      if (!row) {
        throwAdminError(
          'RELEASE_NOT_FOUND',
          'Release not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return row.id;
    }
    if (params.symbol) {
      const row = await this.prisma.release.findFirst({
        where: { symbol: params.symbol.toUpperCase(), deletedAt: null },
        select: { id: true },
      });
      if (!row) {
        throwAdminError(
          'RELEASE_NOT_FOUND',
          'Release not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return row.id;
    }
    throwAdminError(
      'RELEASE_ID_REQUIRED',
      'releaseId, slug, or symbol is required',
      HttpStatus.BAD_REQUEST,
    );
  }

  async resolveReleaseByMarketKey(marketKey: string): Promise<{
    releaseId: string;
    slug: string;
    symbol: string;
  }> {
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRe.test(marketKey)) {
      const row = await this.prisma.release.findFirst({
        where: { id: marketKey, deletedAt: null },
        select: { id: true, slug: true, symbol: true },
      });
      if (!row) {
        throwAdminError(
          'RELEASE_NOT_FOUND',
          'Release not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return { releaseId: row.id, slug: row.slug, symbol: row.symbol };
    }
    const bySlug = await this.prisma.release.findFirst({
      where: { slug: marketKey, deletedAt: null },
      select: { id: true, slug: true, symbol: true },
    });
    if (bySlug) {
      return { releaseId: bySlug.id, slug: bySlug.slug, symbol: bySlug.symbol };
    }
    const bySymbol = await this.prisma.release.findFirst({
      where: { symbol: marketKey.toUpperCase(), deletedAt: null },
      select: { id: true, slug: true, symbol: true },
    });
    if (bySymbol) {
      return {
        releaseId: bySymbol.id,
        slug: bySymbol.slug,
        symbol: bySymbol.symbol,
      };
    }
    throwAdminError(
      'RELEASE_NOT_FOUND',
      'Release not found',
      HttpStatus.NOT_FOUND,
    );
  }
}
