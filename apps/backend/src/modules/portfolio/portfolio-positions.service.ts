import { Injectable } from '@nestjs/common';
import {
  ListingStatus,
  Prisma,
  PrimaryRaiseRoundStatus,
  ReleaseStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { d, decToMoney, decToString } from './portfolio-decimal.util';
import { PortfolioPricingService } from './portfolio-pricing.service';
import type { PortfolioPositionsQueryDto } from './dto/portfolio-positions-query.dto';
import type {
  PortfolioPositionDto,
  PortfolioPositionStatus,
} from './types/portfolio-api.types';

type PositionRow = Prisma.UserPositionGetPayload<{
  select: ReturnType<PortfolioPositionsService['positionSelect']>;
}>;

export type LoadedPosition = PortfolioPositionDto & {
  _unitsTotal: Prisma.Decimal;
  _marketValue: Prisma.Decimal;
  _pnl: Prisma.Decimal;
  _liquidityPercent: Prisma.Decimal;
  _payoutTotal: Prisma.Decimal;
};

type PayoutByRelease = Map<
  string,
  { accrued: Prisma.Decimal; paid: Prisma.Decimal; pending: Prisma.Decimal }
>;

type EnrichmentContext = {
  markPrices: Awaited<ReturnType<PortfolioPricingService['resolveMarkPrices']>>;
  liveRoundSet: Set<string>;
  listingByRelease: Map<string, { listedUnits: Prisma.Decimal; count: number }>;
  totalMarketValue: Prisma.Decimal;
};

@Injectable()
export class PortfolioPositionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PortfolioPricingService,
  ) {}

  private positionSelect() {
    return {
      id: true,
      releaseId: true,
      unitsTotal: true,
      unitsAvailable: true,
      unitsLocked: true,
      avgEntryPrice: true,
      createdAt: true,
      updatedAt: true,
      release: {
        select: {
          slug: true,
          symbol: true,
          title: true,
          coverUrl: true,
          genre: true,
          status: true,
          primaryUnitPrice: true,
          unitsAvailablePrimary: true,
          secondaryEnabled: true,
        },
      },
    } satisfies Prisma.UserPositionSelect;
  }

  async loadPositions(userId: string): Promise<LoadedPosition[]> {
    const rows = await this.prisma.userPosition.findMany({
      where: { userId, unitsTotal: { gt: 0 } },
      select: this.positionSelect(),
      orderBy: { updatedAt: 'desc' },
    });
    if (rows.length === 0) return [];

    const ctx = await this.loadEnrichmentContext(userId, rows);
    const positions = rows.map((row) =>
      this.mapRowToLoadedPosition(row, ctx, null),
    );
    return positions.sort((a, b) => b._marketValue.comparedTo(a._marketValue));
  }

  async loadPositionForRelease(
    userId: string,
    releaseId: string,
  ): Promise<LoadedPosition | null> {
    const row = await this.prisma.userPosition.findUnique({
      where: { userId_releaseId: { userId, releaseId } },
      select: this.positionSelect(),
    });
    if (!row || d(row.unitsTotal).lte(0)) return null;

    const [ctx, artists] = await Promise.all([
      this.loadEnrichmentContext(userId, [row]),
      this.loadArtistNames([releaseId]),
    ]);
    return this.mapRowToLoadedPosition(
      row,
      ctx,
      artists.get(releaseId) ?? '—',
    );
  }

  async queryPositionsPage(
    userId: string,
    query: PortfolioPositionsQueryDto,
    payoutByRelease: PayoutByRelease,
  ): Promise<{
    items: LoadedPosition[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sort = query.sort ?? 'value_desc';

    if (query.hasPayouts === true) {
      const releaseIdsWithPayouts = [...payoutByRelease.entries()]
        .filter(([, v]) => v.accrued.gt(0))
        .map(([id]) => id);
      if (releaseIdsWithPayouts.length === 0) {
        return { items: [], total: 0, page, limit };
      }
    }

    const where = this.buildPositionsWhere(userId, query, payoutByRelease);

    if (this.canPaginateInDb(sort, query)) {
      const orderBy = this.buildDbOrderBy(sort, query.sortDir ?? 'desc');
      const [total, rows] = await Promise.all([
        this.prisma.userPosition.count({ where }),
        this.prisma.userPosition.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          select: this.positionSelect(),
        }),
      ]);
      const items = await this.enrichRowsWithArtists(userId, rows);
      return { items, total, page, limit };
    }

    const rows = await this.prisma.userPosition.findMany({
      where,
      select: this.positionSelect(),
    });
    if (rows.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    const ctx = await this.loadEnrichmentContext(userId, rows);
    let candidates = rows.map((row) => {
      const payout = payoutByRelease.get(row.releaseId);
      const accrued = payout?.accrued ?? new Prisma.Decimal(0);
      const position = this.mapRowToLoadedPosition(row, ctx, null);
      return {
        ...position,
        _payoutTotal: accrued,
      };
    });

    if (query.status) {
      candidates = candidates.filter((p) => p.status === query.status);
    }

    candidates = this.sortPositions(
      candidates,
      sort,
      query.sortDir ?? 'desc',
    );

    const total = candidates.length;
    const slice = candidates.slice((page - 1) * limit, page * limit);
    const releaseIds = [...new Set(slice.map((p) => p.releaseId))];
    const artists = await this.loadArtistNames(releaseIds);
    const items = slice.map((p) => ({
      ...p,
      artist: artists.get(p.releaseId) ?? p.artist,
    }));

    return { items, total, page, limit };
  }

  private canPaginateInDb(
    sort: string,
    query: PortfolioPositionsQueryDto,
  ): boolean {
    if (query.status) return false;
    if (query.hasPayouts !== undefined) return false;
    if (query.hasActiveListing !== undefined) return false;
    if (
      sort === 'value_desc' ||
      sort === 'value_asc' ||
      sort === 'value' ||
      sort === 'payout_desc' ||
      sort === 'liquidity_desc' ||
      sort === 'share' ||
      sort === 'release'
    ) {
      return false;
    }
    return (
      sort === 'units_desc' ||
      sort === 'units_asc' ||
      sort === 'units' ||
      sort === 'newest' ||
      sort === 'date' ||
      sort === 'updated'
    );
  }

  private buildDbOrderBy(
    sort: string,
    sortDir: 'asc' | 'desc',
  ): Prisma.UserPositionOrderByWithRelationInput {
    switch (sort) {
      case 'units_desc':
        return { unitsTotal: 'desc' };
      case 'units_asc':
        return { unitsTotal: 'asc' };
      case 'units':
        return { unitsTotal: sortDir };
      case 'updated':
        return { updatedAt: 'desc' };
      case 'newest':
      case 'date':
      default:
        return { createdAt: 'desc' };
    }
  }

  private buildPositionsWhere(
    userId: string,
    query: PortfolioPositionsQueryDto,
    payoutByRelease: PayoutByRelease,
  ): Prisma.UserPositionWhereInput {
    const where: Prisma.UserPositionWhereInput = {
      userId,
      unitsTotal: { gt: 0 },
    };

    const releaseWhere: Prisma.ReleaseWhereInput = {};

    const q = query.q?.trim();
    if (q) {
      releaseWhere.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { symbol: { contains: q, mode: 'insensitive' } },
        { genre: { contains: q, mode: 'insensitive' } },
        {
          releaseArtists: {
            some: { artist: { name: { contains: q, mode: 'insensitive' } } },
          },
        },
      ];
    }

    const genre = query.genre?.trim();
    if (genre && genre !== 'all') {
      releaseWhere.genre = { equals: genre, mode: 'insensitive' };
    }

    if (query.hasActiveListing === true) {
      releaseWhere.marketListings = {
        some: {
          sellerUserId: userId,
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          unitsAvailable: { gt: 0 },
        },
      };
    } else if (query.hasActiveListing === false) {
      releaseWhere.marketListings = {
        none: {
          sellerUserId: userId,
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          unitsAvailable: { gt: 0 },
        },
      };
    }

    if (query.hasAvailableUnits === true) {
      where.unitsAvailable = { gt: 0 };
    } else if (query.hasAvailableUnits === false) {
      where.unitsAvailable = { lte: 0 };
    }

    if (query.hasLockedUnits === true) {
      where.unitsLocked = { gt: 0 };
    } else if (query.hasLockedUnits === false) {
      where.unitsLocked = { lte: 0 };
    }

    if (Object.keys(releaseWhere).length > 0) {
      where.release = releaseWhere;
    }

    if (query.hasPayouts === true) {
      where.releaseId = {
        in: [...payoutByRelease.entries()]
          .filter(([, v]) => v.accrued.gt(0))
          .map(([id]) => id),
      };
    } else if (query.hasPayouts === false) {
      const withPayouts = new Set(
        [...payoutByRelease.entries()]
          .filter(([, v]) => v.accrued.gt(0))
          .map(([id]) => id),
      );
      where.NOT = {
        releaseId: { in: [...withPayouts] },
      };
    }

    return where;
  }

  private sortPositions(
    items: LoadedPosition[],
    sort: string,
    legacyDir: 'asc' | 'desc',
  ): LoadedPosition[] {
    const cmp = (left: number, right: number) =>
      left === right ? 0 : left > right ? 1 : -1;

    return [...items].sort((a, b) => {
      switch (sort) {
        case 'value_asc':
          return cmp(Number(a.marketValue), Number(b.marketValue));
        case 'units_desc':
          return cmp(Number(b.unitsTotal), Number(a.unitsTotal));
        case 'units_asc':
          return cmp(Number(a.unitsTotal), Number(b.unitsTotal));
        case 'newest':
        case 'date':
          return cmp(Date.parse(b.dateEntered), Date.parse(a.dateEntered));
        case 'updated':
          return cmp(Date.parse(b.updatedAt), Date.parse(a.updatedAt));
        case 'payout_desc':
          return cmp(Number(b._payoutTotal), Number(a._payoutTotal));
        case 'liquidity_desc':
          return cmp(
            Number(b._liquidityPercent),
            Number(a._liquidityPercent),
          );
        case 'share':
          return (
            cmp(Number(b.portfolioSharePct), Number(a.portfolioSharePct)) *
            (legacyDir === 'asc' ? -1 : 1)
          );
        case 'release':
          return (
            a.release.localeCompare(b.release) * (legacyDir === 'asc' ? 1 : -1)
          );
        case 'units':
          return (
            cmp(Number(a.unitsTotal), Number(b.unitsTotal)) *
            (legacyDir === 'asc' ? 1 : -1)
          );
        case 'value':
          return (
            cmp(Number(a.marketValue), Number(b.marketValue)) *
            (legacyDir === 'asc' ? 1 : -1)
          );
        case 'value_desc':
        default:
          return cmp(Number(b.marketValue), Number(a.marketValue));
      }
    });
  }

  private async enrichRowsWithArtists(
    userId: string,
    rows: PositionRow[],
  ): Promise<LoadedPosition[]> {
    if (rows.length === 0) return [];
    const ctx = await this.loadEnrichmentContext(userId, rows);
    const artists = await this.loadArtistNames(rows.map((r) => r.releaseId));
    return rows.map((row) =>
      this.mapRowToLoadedPosition(
        row,
        ctx,
        artists.get(row.releaseId) ?? '—',
      ),
    );
  }

  private async loadEnrichmentContext(
    userId: string,
    rows: PositionRow[],
  ): Promise<EnrichmentContext> {
    const releaseIds = rows.map((r) => r.releaseId);
    const allRowsForTotal = await this.prisma.userPosition.findMany({
      where: { userId, unitsTotal: { gt: 0 } },
      select: {
        releaseId: true,
        unitsTotal: true,
        release: { select: { primaryUnitPrice: true } },
      },
    });

    const [markPrices, liveRounds, userListings] = await Promise.all([
      this.pricing.resolveMarkPrices(
        allRowsForTotal.map((r) => ({
          id: r.releaseId,
          primaryUnitPrice: r.release.primaryUnitPrice,
        })),
      ),
      this.prisma.primaryRaiseRound.findMany({
        where: {
          releaseId: { in: releaseIds },
          status: PrimaryRaiseRoundStatus.LIVE,
        },
        select: { releaseId: true },
      }),
      this.prisma.marketListing.findMany({
        where: {
          sellerUserId: userId,
          releaseId: { in: releaseIds },
          deletedAt: null,
          status: ListingStatus.ACTIVE,
        },
        select: { releaseId: true, unitsAvailable: true },
      }),
    ]);

    let totalMarketValue = new Prisma.Decimal(0);
    for (const row of allRowsForTotal) {
      const mark = markPrices.get(row.releaseId);
      const price = mark?.currentPrice ?? d(row.release.primaryUnitPrice);
      totalMarketValue = totalMarketValue.plus(d(row.unitsTotal).mul(price));
    }

    const liveRoundSet = new Set(liveRounds.map((r) => r.releaseId));
    const listingByRelease = new Map<
      string,
      { listedUnits: Prisma.Decimal; count: number }
    >();
    for (const listing of userListings) {
      const current = listingByRelease.get(listing.releaseId) ?? {
        listedUnits: new Prisma.Decimal(0),
        count: 0,
      };
      current.listedUnits = current.listedUnits.plus(listing.unitsAvailable);
      current.count += 1;
      listingByRelease.set(listing.releaseId, current);
    }

    return {
      markPrices,
      liveRoundSet,
      listingByRelease,
      totalMarketValue,
    };
  }

  private async loadArtistNames(
    releaseIds: string[],
  ): Promise<Map<string, string>> {
    if (releaseIds.length === 0) return new Map();
    const unique = [...new Set(releaseIds)];
    const rows = await this.prisma.releaseArtist.findMany({
      where: { releaseId: { in: unique } },
      orderBy: { createdAt: 'asc' },
      select: {
        releaseId: true,
        artist: { select: { name: true } },
      },
    });
    const map = new Map<string, string[]>();
    for (const row of rows) {
      const names = map.get(row.releaseId) ?? [];
      if (row.artist.name) names.push(row.artist.name);
      map.set(row.releaseId, names);
    }
    const result = new Map<string, string>();
    for (const id of unique) {
      const names = map.get(id) ?? [];
      result.set(id, names.slice(0, 3).join(', ') || '—');
    }
    return result;
  }

  private mapRowToLoadedPosition(
    p: PositionRow,
    ctx: EnrichmentContext,
    artist: string | null,
  ): LoadedPosition {
    const unitsTotal = d(p.unitsTotal);
    const unitsAvailable = d(p.unitsAvailable);
    const unitsLocked = d(p.unitsLocked);
    const avgEntry = d(p.avgEntryPrice);
    const mark = ctx.markPrices.get(p.releaseId);
    const currentPrice = mark?.currentPrice ?? d(p.release.primaryUnitPrice);
    const priceSource = mark?.priceSource ?? 'primary';
    const hasMarketPrice =
      priceSource === 'best_ask' || priceSource === 'last_trade';
    const marketValue = unitsTotal.mul(currentPrice);
    const costBasis = unitsTotal.mul(avgEntry);
    const pnl = marketValue.minus(costBasis);
    const pnlPct = costBasis.greaterThan(0)
      ? pnl.div(costBasis).mul(100)
      : new Prisma.Decimal(0);
    const listingMeta = ctx.listingByRelease.get(p.releaseId) ?? {
      listedUnits: new Prisma.Decimal(0),
      count: 0,
    };
    const liquidityPercent = unitsTotal.greaterThan(0)
      ? unitsAvailable.div(unitsTotal).mul(100)
      : new Prisma.Decimal(0);

    const status = this.resolveStatus(
      p.release.status,
      p.releaseId,
      unitsLocked,
      ctx.liveRoundSet,
      listingMeta.count > 0,
    );

    const canBuyPrimary =
      p.release.status === ReleaseStatus.ACTIVE &&
      (ctx.liveRoundSet.has(p.releaseId) ||
        p.release.unitsAvailablePrimary.gt(0));
    const canBuyMore =
      canBuyPrimary || Boolean(p.release.secondaryEnabled);

    const share = ctx.totalMarketValue.greaterThan(0)
      ? marketValue.div(ctx.totalMarketValue).mul(100)
      : new Prisma.Decimal(0);

    return {
      id: p.id,
      releaseId: p.releaseId,
      slug: p.release.slug,
      symbol: p.release.symbol,
      release: p.release.title,
      artist: artist ?? '—',
      coverUrl: p.release.coverUrl,
      genre: p.release.genre?.trim() || 'Indie',
      unitsTotal: decToString(unitsTotal),
      unitsAvailable: decToString(unitsAvailable),
      unitsLocked: decToString(unitsLocked),
      listedUnits: decToString(listingMeta.listedUnits),
      avgEntryPrice: decToMoney(avgEntry),
      currentPrice: decToMoney(currentPrice),
      priceSource,
      hasMarketPrice,
      lastTradePriceUsdt: mark?.lastTradePrice
        ? decToMoney(mark.lastTradePrice)
        : null,
      marketValue: decToMoney(marketValue),
      costBasis: decToMoney(costBasis),
      totalInvestedUsdt: decToMoney(costBasis),
      pnlUnrealized: decToMoney(pnl),
      pnlPct: pnlPct.toFixed(2),
      status,
      availableToSell:
        unitsAvailable.greaterThan(0) &&
        p.release.status === ReleaseStatus.ACTIVE,
      canBuyMore,
      dateEntered: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      portfolioSharePct: share.toFixed(1),
      liquidityPercent: liquidityPercent.toFixed(1),
      totalAccruedUsdt: '0.00',
      totalPaidUsdt: '0.00',
      pendingPayoutUsdt: '0.00',
      activeListingsCount: listingMeta.count,
      _unitsTotal: unitsTotal,
      _marketValue: marketValue,
      _pnl: pnl,
      _liquidityPercent: liquidityPercent,
      _payoutTotal: new Prisma.Decimal(0),
    };
  }

  private resolveStatus(
    releaseStatus: ReleaseStatus,
    releaseId: string,
    unitsLocked: Prisma.Decimal,
    liveRoundSet: Set<string>,
    hasActiveListing: boolean,
  ): PortfolioPositionStatus {
    if (releaseStatus !== ReleaseStatus.ACTIVE) return 'Closed';
    if (liveRoundSet.has(releaseId)) return 'Open round';
    if (unitsLocked.greaterThan(0) || hasActiveListing) {
      return 'Secondary';
    }
    return 'Active';
  }
}
