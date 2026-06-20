import { HttpStatus, Injectable } from '@nestjs/common';
import { ListingStatus, PriceBucket, Prisma, TradeSettlementStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { SecondaryMarketEnrichmentService } from './secondary-market-enrichment.service';
import { mapRichListing, normalizeGenre } from './secondary-market-rich.mapper';
import { maskSellerEmail } from './secondary-market-public.util';
import { SecondaryMarketResolveService } from './secondary-market-resolve.service';
import {
  aggregateDepthLevels,
  normalizeTickSize,
} from './utils/secondary-market-depth.util';

const listingInclude = {
  release: {
    include: { releaseArtists: { include: { artist: true } } },
  },
  seller: { select: { id: true, email: true } },
} as const;

/** Top ask levels returned in order book (best prices first). */
const MAX_DEPTH_ASK_LEVELS = 100;

@Injectable()
export class SecondaryMarketMarketDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichment: SecondaryMarketEnrichmentService,
    private readonly resolve: SecondaryMarketResolveService,
  ) {}

  async getListingDetail(listingId: string, viewerUserId: string) {
    const l = await this.prisma.marketListing.findFirst({
      where: { id: listingId, deletedAt: null },
      include: listingInclude,
    });
    if (!l) {
      throwAdminError(
        'LISTING_NOT_FOUND',
        'Listing not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const ctxMap = await this.enrichment.loadByReleaseIds([l.releaseId]);
    const listing = mapRichListing(l, ctxMap.get(l.releaseId)!, viewerUserId);
    const ctx = ctxMap.get(l.releaseId)!;

    const [recentTrades, relatedRows, tradeCount7d] = await Promise.all([
      this.prisma.trade.findMany({
        where: {
          releaseId: l.releaseId,
          settlementStatus: TradeSettlementStatus.SETTLED,
        },
        orderBy: { executedAt: 'desc' },
        take: 20,
        include: {
          release: {
            include: { releaseArtists: { include: { artist: true } } },
          },
          buyOrder: { select: { id: true, listingId: true } },
          sellOrder: { select: { id: true, listingId: true } },
        },
      }),
      this.prisma.marketListing.findMany({
        where: {
          releaseId: l.releaseId,
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          unitsAvailable: { gt: 0 },
          id: { not: l.id },
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: listingInclude,
      }),
      this.prisma.trade.count({
        where: {
          releaseId: l.releaseId,
          executedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          settlementStatus: TradeSettlementStatus.SETTLED,
        },
      }),
    ]);

    const relatedCtx = await this.enrichment.loadByReleaseIds(
      relatedRows.map((r) => r.releaseId),
    );

    const artist =
      l.release.releaseArtists?.[0]?.artist.name ??
      l.release.copyrightOwner ??
      'Unknown Artist';

    return {
      listing,
      release: {
        id: l.release.id,
        slug: l.release.slug,
        symbol: l.release.symbol,
        title: l.release.title,
        coverUrl: l.release.coverUrl,
        genre: normalizeGenre(l.release.genre),
        description: l.release.description,
        status: l.release.status.toLowerCase(),
      },
      seller: {
        id: l.sellerUserId,
        displayName: maskSellerEmail(l.seller.email),
      },
      permissions: {
        canBuy: listing.canBuy,
        canCancel: listing.canCancel,
      },
      recentTrades: recentTrades.map((t) => ({
        id: t.id,
        side: 'buy' as const,
        price: t.price.toString(),
        units: t.units.toString(),
        grossAmount: t.grossAmount.toString(),
        executedAt: t.executedAt.toISOString(),
        settlementStatus:
          t.settlementStatus === TradeSettlementStatus.SETTLED
            ? 'settled'
            : 'processing',
      })),
      relatedListings: relatedRows.map((row) =>
        mapRichListing(row, relatedCtx.get(row.releaseId)!, viewerUserId),
      ),
      marketSummary: {
        volume24hUsdt: ctx.volume24hUsdt,
        change7dPct: ctx.change7dPct,
        spread: listing.spread,
        spreadPct: listing.spreadPct,
        bestBid: ctx.bestBid,
        bestAsk: ctx.bestAsk,
        liquidity: ctx.liquidity,
        liquidityLabel: listing.liquidityLabel,
        deals7d: tradeCount7d,
        payoutSparkline: ctx.payoutSparkline,
        range7dLow: listing.range7dLow,
        range7dHigh: listing.range7dHigh,
        artist,
      },
    };
  }

  async getDepth(
    params: {
      releaseId?: string;
      slug?: string;
      symbol?: string;
      marketId?: string;
      tickSize?: number;
    },
    viewerUserId: string,
  ) {
    const resolvedParams =
      params.marketId != null
        ? await this.resolveParamsFromMarketKey(params.marketId)
        : params;
    const releaseId = await this.resolve.resolveReleaseId(resolvedParams);
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null },
      include: { releaseArtists: { include: { artist: true } } },
    });
    if (!release) {
      throwAdminError(
        'RELEASE_NOT_FOUND',
        'Release not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const listingWhere = {
      releaseId,
      deletedAt: null,
      status: ListingStatus.ACTIVE,
      unitsAvailable: { gt: 0 },
    } as const;

    const [activeListings, activeListingsCount, askDepthAgg, snapshot, recentTrades, ctxMap, position, wallet] =
      await Promise.all([
        this.prisma.marketListing.findMany({
          where: listingWhere,
          orderBy: { pricePerUnit: 'asc' },
          take: MAX_DEPTH_ASK_LEVELS,
          include: listingInclude,
        }),
        this.prisma.marketListing.count({ where: listingWhere }),
        this.prisma.marketListing.aggregate({
          where: listingWhere,
          _sum: { unitsAvailable: true },
        }),
        this.prisma.orderBookSnapshot.findFirst({
          where: { releaseId },
          orderBy: { capturedAt: 'desc' },
        }),
        this.prisma.trade.findMany({
          where: {
            releaseId,
            settlementStatus: TradeSettlementStatus.SETTLED,
          },
          orderBy: { executedAt: 'desc' },
          take: 40,
        }),
        this.enrichment.loadByReleaseIds([releaseId]),
        this.prisma.userPosition.findUnique({
          where: {
            userId_releaseId: { userId: viewerUserId, releaseId },
          },
        }),
        this.prisma.wallet.findFirst({
          where: { userId: viewerUserId, assetCode: 'USDT' },
          include: { balance: true },
        }),
      ]);

    const ctx = ctxMap.get(releaseId)!;

    const asks = activeListings.map((l) => ({
      price: l.pricePerUnit.toString(),
      units: l.unitsAvailable.toString(),
      listingId: l.id,
    }));

    const bidLevels: Array<{ price: string; units: string }> = [];
    if (snapshot?.topBidPrice && snapshot.bidDepthUnits) {
      bidLevels.push({
        price: snapshot.topBidPrice.toString(),
        units: snapshot.bidDepthUnits.toString(),
      });
    }

    const bestAsk =
      asks[0]?.price ?? snapshot?.topAskPrice?.toString() ?? ctx.bestAsk;
    const bestBid =
      bidLevels[0]?.price ?? snapshot?.topBidPrice?.toString() ?? ctx.bestBid;
    let spread = '0';
    let spreadPct = '0';
    if (bestAsk && bestBid) {
      const askD = new Prisma.Decimal(bestAsk);
      const bidD = new Prisma.Decimal(bestBid);
      const sp = askD.minus(bidD);
      spread = sp.toString();
      spreadPct = askD.greaterThan(0) ? sp.div(askD).mul(100).toFixed(2) : '0';
    }

    const askDepthUnits =
      askDepthAgg._sum.unitsAvailable ?? new Prisma.Decimal(0);
    const bidDepthUnits = bidLevels.reduce(
      (sum, b) => sum.plus(b.units),
      new Prisma.Decimal(0),
    );

    const artist =
      release.releaseArtists?.[0]?.artist.name ??
      release.copyrightOwner ??
      'Unknown Artist';

    const sparkline = ctx.payoutSparkline.map((p) => Number(p));
    const lastTradePrice = recentTrades[0]?.price.toString() ?? null;
    const lastPrice =
      lastTradePrice ??
      bestAsk ??
      bestBid ??
      (sparkline.length > 0 ? String(sparkline[sparkline.length - 1]) : '0');
    const high24h =
      ctx.range24hHigh !== '0' ? ctx.range24hHigh : ctx.range7dHigh;
    const low24h = ctx.range24hLow !== '0' ? ctx.range24hLow : ctx.range7dLow;
    const tickSize = normalizeTickSize(params.tickSize);
    const asksAggregated = aggregateDepthLevels(asks, tickSize, 'ask');
    const bidsAggregated = aggregateDepthLevels(bidLevels, tickSize, 'bid');

    return {
      releaseId: release.id,
      slug: release.slug,
      symbol: release.symbol,
      title: release.title,
      artist,
      genre: normalizeGenre(release.genre),
      coverUrl: release.coverUrl,
      bids: bidLevels,
      asks,
      asksAggregated,
      bidsAggregated,
      tickSize,
      pair: `${release.symbol}/USDT`,
      midPrice:
        bestAsk && bestBid
          ? new Prisma.Decimal(bestAsk).plus(bestBid).div(2).toString()
          : lastPrice,
      spread,
      spreadPct,
      bestBid: bestBid ?? null,
      bestAsk: bestAsk ?? null,
      bidDepthUnits: bidDepthUnits.toString(),
      askDepthUnits: askDepthUnits.toString(),
      volume24hUsdt: ctx.volume24hUsdt,
      volume24hUnits: ctx.volume24hUnits,
      change7dPct: ctx.change7dPct,
      change24hPct: ctx.change24hPct,
      liquidity: ctx.liquidity,
      rightsListed: askDepthUnits.toString(),
      activeListingsCount,
      recentTradesCount: recentTrades.length,
      priceSparkline: sparkline,
      lastPrice,
      high24h,
      low24h,
      availableUsdt: wallet?.balance?.available.toString() ?? '0',
      lockedUsdt: wallet?.balance?.locked.toString() ?? '0',
      availableUnits: position?.unitsAvailable.toString() ?? '0',
      unitsTotal: position?.unitsTotal.toString() ?? '0',
      unitsLocked: position?.unitsLocked.toString() ?? '0',
      avgEntryPrice: position?.avgEntryPrice.toString() ?? '0',
      recentTrades: recentTrades.map((t) => ({
        id: t.id,
        time: t.executedAt.toISOString(),
        side: t.buyerUserId === viewerUserId ? 'buy' : 'sell',
        price: t.price.toString(),
        units: t.units.toString(),
      })),
      listings: activeListings.map((l) => mapRichListing(l, ctx, viewerUserId)),
      updatedAt: new Date().toISOString(),
    };
  }

  async getPriceHistory(params: {
    releaseId?: string;
    slug?: string;
    symbol?: string;
    bucket?: PriceBucket;
    period?: string;
  }) {
    const releaseId = await this.resolve.resolveReleaseId(params);
    const bucket = params.bucket ?? PriceBucket.D1;
    const since = this.periodSince(params.period ?? '30d');

    const rows = await this.prisma.priceHistory.findMany({
      where: {
        releaseId,
        bucket,
        ...(since ? { ts: { gte: since } } : {}),
      },
      orderBy: { ts: 'asc' },
      take: 500,
    });

    return {
      releaseId,
      bucket,
      period: params.period ?? '30d',
      points: rows.map((r) => ({
        ts: r.ts.toISOString(),
        open: r.openPrice.toString(),
        high: r.highPrice.toString(),
        low: r.lowPrice.toString(),
        close: r.closePrice.toString(),
        volumeUnits: r.volumeUnits.toString(),
        volumeNotional: r.volumeNotional.toString(),
      })),
    };
  }

  async getTerminalSummary(marketKey: string, viewerUserId: string) {
    const depth = await this.getDepth({ marketId: marketKey }, viewerUserId);
    return {
      marketId: marketKey,
      releaseId: depth.releaseId,
      symbol: depth.symbol,
      pair: depth.pair ?? `${depth.symbol}/USDT`,
      releaseTitle: depth.title,
      artistName: depth.artist,
      genre: depth.genre,
      releaseStatus: 'active',
      liquidityLabel: depth.liquidity,
      lastPrice: depth.lastPrice,
      priceChange24h: depth.change24hPct,
      priceChangePercent24h: depth.change24hPct,
      max24h: depth.high24h,
      min24h: depth.low24h,
      bestBid: depth.bestBid,
      bestAsk: depth.bestAsk,
      spread: depth.spread,
      spreadPercent: depth.spreadPct,
      volume24hUsdt: depth.volume24hUsdt,
      volume24hUnits: depth.volume24hUnits,
      recentTradesCount: depth.recentTradesCount,
      liquidityScore: depth.liquidity,
      activeListingsCount: depth.activeListingsCount,
      updatedAt: depth.updatedAt,
      slug: depth.slug,
    };
  }

  async getUserTerminalState(marketKey: string, viewerUserId: string) {
    const depth = await this.getDepth({ marketId: marketKey }, viewerUserId);
    const activeOrders = await this.prisma.marketListing.count({
      where: {
        sellerUserId: viewerUserId,
        releaseId: depth.releaseId,
        deletedAt: null,
        status: { in: [ListingStatus.ACTIVE, ListingStatus.PAUSED] },
        unitsAvailable: { gt: 0 },
      },
    });

    let canTrade = true;
    let blockingReason: string | null = null;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: viewerUserId },
        select: { status: true },
      });
      if (user?.status !== 'ACTIVE') {
        canTrade = false;
        blockingReason = 'Операция ограничена compliance';
      }
    } catch {
      canTrade = false;
      blockingReason = 'Не удалось проверить статус аккаунта';
    }

    return {
      walletAvailableUsdt: depth.availableUsdt,
      walletLockedUsdt: depth.lockedUsdt ?? '0',
      userUnitsTotal: depth.unitsTotal ?? depth.availableUnits,
      userUnitsAvailable: depth.availableUnits,
      userUnitsLocked: depth.unitsLocked ?? '0',
      activeOrdersCount: activeOrders,
      canTrade,
      blockingReason,
      kycStatus: 'verified',
      complianceStatus: canTrade ? 'clear' : 'restricted',
      avgEntryPrice: depth.avgEntryPrice,
      releaseId: depth.releaseId,
    };
  }

  async getRecentTrades(marketKey: string, limit: number, viewerUserId: string) {
    const { releaseId } = await this.resolve.resolveReleaseByMarketKey(marketKey);
    const take = Math.min(100, Math.max(1, limit || 20));
    const rows = await this.prisma.trade.findMany({
      where: {
        releaseId,
        settlementStatus: TradeSettlementStatus.SETTLED,
      },
      orderBy: { executedAt: 'desc' },
      take,
      include: {
        buyer: { select: { email: true } },
        seller: { select: { email: true } },
      },
    });

    return {
      marketId: marketKey,
      releaseId,
      items: rows.map((t) => ({
        tradeId: t.id,
        side: t.buyerUserId === viewerUserId ? 'buy' : 'sell',
        price: t.price.toString(),
        units: t.units.toString(),
        grossAmount: t.grossAmount.toString(),
        feeAmount: t.feeTotal.toString(),
        executedAt: t.executedAt.toISOString(),
        buyerSellerMasked:
          t.buyerUserId === viewerUserId
            ? maskSellerEmail(t.seller.email)
            : maskSellerEmail(t.buyer.email),
        directionLabel:
          t.buyerUserId === viewerUserId ? 'Покупка' : 'Продажа',
      })),
    };
  }

  async getSparkline(marketKey: string, period = '24h') {
    const { releaseId, symbol } =
      await this.resolve.resolveReleaseByMarketKey(marketKey);
    const since = this.periodSince(period);
    const rows = await this.prisma.priceHistory.findMany({
      where: {
        releaseId,
        bucket: PriceBucket.H1,
        ...(since ? { ts: { gte: since } } : {}),
      },
      orderBy: { ts: 'asc' },
      take: 48,
    });

    if (rows.length === 0) {
      const ctx = await this.enrichment.loadByReleaseIds([releaseId]);
      const spark = ctx.get(releaseId)?.payoutSparkline ?? [];
      return {
        marketId: marketKey,
        releaseId,
        symbol,
        period,
        points: spark.map((price, i) => ({
          timestamp: new Date(Date.now() - (spark.length - i) * 3_600_000).toISOString(),
          price: String(price),
        })),
      };
    }

    return {
      marketId: marketKey,
      releaseId,
      symbol,
      period,
      points: rows.map((r) => ({
        timestamp: r.ts.toISOString(),
        price: r.closePrice.toString(),
      })),
    };
  }

  private async resolveParamsFromMarketKey(marketKey: string) {
    const row = await this.resolve.resolveReleaseByMarketKey(marketKey);
    return { releaseId: row.releaseId };
  }

  private periodSince(period: string): Date | null {
    const now = Date.now();
    const days: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    const d = days[period];
    if (!d) return null;
    return new Date(now - d * 24 * 60 * 60 * 1000);
  }
}
