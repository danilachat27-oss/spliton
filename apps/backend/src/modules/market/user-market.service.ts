import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import {
  ActorRole,
  ConsentSource,
  LedgerOperationType,
  ListingStatus,
  OrderSide,
  OrderStatus,
  OrderType,
  OwnershipEventType,
  Prisma,
  PrimaryRaiseRoundStatus,
  ReleaseStatus,
  TimeInForce,
  TradeSettlementStatus,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';
import { MAX_PAGE_SIZE } from '../../common/pagination/pagination.constants';
import { resolvePagination } from '../../common/pagination/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { PlatformFeeLedgerService } from '../admin/common/platform-fee-ledger.service';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import { UserWalletService } from '../wallets/user-wallet.service';
import { WalletAuditService } from '../wallets/wallet-audit.service';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { FeePreviewQueryDto } from './dto/fee-preview-query.dto';
import { SecondaryMarketEnrichmentService } from './secondary-market-enrichment.service';
import { CacheInvalidationService } from '../../common/platform/cache/cache-invalidation.service';
import { FeatureFlagsService } from '../../common/platform/feature-flags/feature-flags.service';
import { ComplianceEnforcementService } from '../compliance/compliance-enforcement.service';
import { recordTradePriceHistory } from './utils/price-history-writer.util';
import { EligibilityService } from '../compliance/eligibility.service';
import { ComplianceRiskScoringService } from '../compliance/compliance-risk-scoring.service';
import { NotificationEventsService } from '../notifications/notification-events.service';
import { ReferralEventsService } from '../referrals/referral-events.service';
import { IdempotencyService } from '../../common/platform/idempotency/idempotency.service';
import { hashRequestPayload } from '../../common/platform/idempotency/request-hash.util';
import { SecondaryMarketResolveService } from './secondary-market-resolve.service';
import type { MarketOrderPreviewDto } from './dto/market-order-preview.dto';
import type { MarketOrderSubmitDto } from './dto/market-order-submit.dto';
import type { MarketListingsQueryDto } from './dto/market-listings-query.dto';
import {
  mapDbOrderToUserOrder,
  mapListingToUserOrder,
  mapRichListing,
  mapRichTrade,
} from './secondary-market-rich.mapper';

const listingInclude = {
  release: {
    include: { releaseArtists: { include: { artist: true } } },
  },
  seller: { select: { id: true, email: true } },
} as const;

@Injectable()
export class UserMarketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedgerService,
    private readonly feeLedger: PlatformFeeLedgerService,
    private readonly wallets: UserWalletService,
    private readonly audit: WalletAuditService,
    private readonly enrichment: SecondaryMarketEnrichmentService,
    private readonly enforcement: ComplianceEnforcementService,
    private readonly eligibility: EligibilityService,
    private readonly riskScoring: ComplianceRiskScoringService,
    private readonly notificationEvents: NotificationEventsService,
    private readonly flags: FeatureFlagsService,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly referralEvents: ReferralEventsService,
    private readonly idempotency: IdempotencyService,
    private readonly marketResolve: SecondaryMarketResolveService,
  ) {}

  private async activeFeeSettings(tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const row = await db.platformFeeSetting.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    return {
      primaryPurchaseFeePct:
        row?.primaryPurchaseFeePct ?? new Prisma.Decimal(2),
      secondaryMarketFeePct:
        row?.secondaryMarketFeePct ?? new Prisma.Decimal(1),
    };
  }

  async listListings(viewerUserId: string, query: MarketListingsQueryDto) {
    const pageSize = Math.min(
      query.limit ?? query.pageSize ?? 20,
      MAX_PAGE_SIZE,
    );
    const { page: p, pageSize: ps } = resolvePagination(query.page, pageSize);
    const where = await this.buildMarketListingWhere(query);
    const sort = query.sort ?? 'availability';
    const needsPostProcess =
      query.liquidity != null ||
      sort === 'change_desc' ||
      sort === 'availability';

    if (needsPostProcess) {
      const rows = await this.prisma.marketListing.findMany({
        where,
        take: MAX_PAGE_SIZE * 5,
        orderBy: { createdAt: 'desc' },
        include: listingInclude,
      });
      const ctx = await this.enrichment.loadByReleaseIds(
        rows.map((r) => r.releaseId),
      );
      let items = rows.map((l) =>
        mapRichListing(l, ctx.get(l.releaseId)!, viewerUserId),
      );

      if (query.liquidity) {
        items = items.filter((i) => i.liquidity === query.liquidity);
      }

      if (sort === 'change_desc') {
        items.sort(
          (a, b) => Number(b.change7dPct) - Number(a.change7dPct),
        );
      } else if (sort === 'availability') {
        items.sort((a, b) => {
          const tier = (status: string) => {
            if (status === 'active') return 0;
            if (status === 'paused') return 1;
            if (status === 'sold_out') return 2;
            if (status === 'cancelled') return 3;
            if (status === 'expired') return 4;
            return 5;
          };
          const tDiff = tier(a.status) - tier(b.status);
          if (tDiff !== 0) return tDiff;
          return Number(b.deals7d) - Number(a.deals7d);
        });
      }

      const total = items.length;
      const skip = (p - 1) * ps;
      const pageItems = items.slice(skip, skip + ps);
      return {
        items: pageItems,
        total,
        page: p,
        pageSize: ps,
        hasMore: skip + pageItems.length < total,
      };
    }

    const skip = (p - 1) * ps;
    const orderBy = this.buildMarketListingOrderBy(sort);
    const [total, rows] = await Promise.all([
      this.prisma.marketListing.count({ where }),
      this.prisma.marketListing.findMany({
        where,
        skip,
        take: ps,
        orderBy,
        include: listingInclude,
      }),
    ]);

    const ctx = await this.enrichment.loadByReleaseIds(
      rows.map((r) => r.releaseId),
    );

    return {
      items: rows.map((l) =>
        mapRichListing(l, ctx.get(l.releaseId)!, viewerUserId),
      ),
      total,
      page: p,
      pageSize: ps,
      hasMore: skip + rows.length < total,
    };
  }

  private buildMarketListingOrderBy(
    sort: MarketListingsQueryDto['sort'],
  ): Prisma.MarketListingOrderByWithRelationInput {
    switch (sort) {
      case 'price_asc':
        return { pricePerUnit: 'asc' };
      case 'price_desc':
        return { pricePerUnit: 'desc' };
      case 'units_desc':
        return { unitsAvailable: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private async buildMarketListingWhere(
    query: MarketListingsQueryDto,
  ): Promise<Prisma.MarketListingWhereInput> {
    const where: Prisma.MarketListingWhereInput = {
      deletedAt: null,
    };

    const status = query.status ?? 'purchasable';
    if (status === 'purchasable') {
      where.status = ListingStatus.ACTIVE;
      where.unitsAvailable = { gt: 0 };
    } else if (status === 'active') {
      where.status = ListingStatus.ACTIVE;
    } else if (status === 'paused') {
      where.status = ListingStatus.PAUSED;
    } else if (status === 'sold_out') {
      where.status = ListingStatus.SOLD_OUT;
    } else if (status === 'cancelled') {
      where.status = ListingStatus.CANCELLED;
    } else if (status === 'expired') {
      where.status = ListingStatus.EXPIRED;
    }

    if (query.releaseId) {
      where.releaseId = query.releaseId;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { release: { title: { contains: term, mode: 'insensitive' } } },
        { release: { symbol: { contains: term, mode: 'insensitive' } } },
        {
          release: {
            copyrightOwner: { contains: term, mode: 'insensitive' },
          },
        },
        {
          release: {
            releaseArtists: {
              some: {
                artist: { name: { contains: term, mode: 'insensitive' } },
              },
            },
          },
        },
      ];
    }

    const releaseWhere: Prisma.ReleaseWhereInput = {};
    if (query.genre && query.genre !== 'all') {
      Object.assign(releaseWhere, this.genreReleaseFilter(query.genre));
    }

    if (query.yieldMin != null || query.yieldMax != null) {
      releaseWhere.releaseMetricsDaily = {
        some: {
          yieldPct: {
            ...(query.yieldMin != null ? { gte: query.yieldMin } : {}),
            ...(query.yieldMax != null ? { lte: query.yieldMax } : {}),
          },
        },
      };
    }

    if (Object.keys(releaseWhere).length > 0) {
      where.release = releaseWhere;
    }

    if (query.priceMin != null || query.priceMax != null) {
      where.pricePerUnit = {
        ...(query.priceMin != null
          ? { gte: new Prisma.Decimal(query.priceMin) }
          : {}),
        ...(query.priceMax != null
          ? { lte: new Prisma.Decimal(query.priceMax) }
          : {}),
      };
    }

    if (query.unitsMin != null || query.unitsMax != null) {
      const min =
        query.unitsMin != null ? new Prisma.Decimal(query.unitsMin) : undefined;
      const max =
        query.unitsMax != null ? new Prisma.Decimal(query.unitsMax) : undefined;
      const existing = where.unitsAvailable;
      if (typeof existing === 'object' && existing !== null && !Array.isArray(existing)) {
        where.unitsAvailable = {
          ...existing,
          ...(min != null ? { gte: min } : {}),
          ...(max != null ? { lte: max } : {}),
        };
      } else {
        where.unitsAvailable = {
          ...(min != null ? { gte: min } : {}),
          ...(max != null ? { lte: max } : {}),
        };
      }
    }

    return where;
  }

  private genreReleaseFilter(
    genre: string,
  ): Prisma.ReleaseWhereInput {
    const g = genre.toLowerCase();
    if (g === 'pop') {
      return { genre: { contains: 'pop', mode: 'insensitive' } };
    }
    if (g === 'hiphop') {
      return {
        OR: [
          { genre: { contains: 'hip', mode: 'insensitive' } },
          { genre: { contains: 'rap', mode: 'insensitive' } },
        ],
      };
    }
    if (g === 'rock') {
      return { genre: { contains: 'rock', mode: 'insensitive' } };
    }
    return {
      AND: [
        { NOT: { genre: { contains: 'pop', mode: 'insensitive' } } },
        { NOT: { genre: { contains: 'hip', mode: 'insensitive' } } },
        { NOT: { genre: { contains: 'rock', mode: 'insensitive' } } },
      ],
    };
  }

  async getListing(id: string, viewerUserId: string) {
    const l = await this.prisma.marketListing.findFirst({
      where: { id, deletedAt: null },
      include: listingInclude,
    });
    if (!l) {
      throwAdminError(
        'LISTING_NOT_FOUND',
        'Listing not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const ctx = await this.enrichment.loadByReleaseIds([l.releaseId]);
    return mapRichListing(l, ctx.get(l.releaseId)!, viewerUserId);
  }

  async createListing(
    userId: string,
    dto: CreateListingDto,
    meta?: { ip: string | null; userAgent: string | null },
  ) {
    await this.eligibility.assertAllowed(userId, ConsentSource.SECONDARY_TRADE);

    const units = new Prisma.Decimal(dto.units);
    const pricePerUnit = new Prisma.Decimal(dto.pricePerUnit);

    const listing = await this.prisma.$transaction(async (tx) => {
      const position = await tx.userPosition.findUnique({
        where: { userId_releaseId: { userId, releaseId: dto.releaseId } },
      });
      if (!position || position.unitsAvailable.lessThan(units)) {
        throwAdminError(
          'INSUFFICIENT_UNITS',
          'Not enough units to list',
          HttpStatus.CONFLICT,
        );
      }

      await tx.userPosition.update({
        where: { id: position.id },
        data: {
          unitsAvailable: position.unitsAvailable.minus(units),
          unitsLocked: position.unitsLocked.plus(units),
        },
      });

      const created = await tx.marketListing.create({
        data: {
          releaseId: dto.releaseId,
          sellerUserId: userId,
          pricePerUnit,
          unitsTotal: units,
          unitsAvailable: units,
          status: ListingStatus.ACTIVE,
        },
        include: listingInclude,
      });

      await tx.ownershipLedger.create({
        data: {
          userId,
          releaseId: dto.releaseId,
          eventType: OwnershipEventType.LOCK_FOR_SELL,
          unitsDelta: units.negated(),
          pricePerUnit,
          happenedAt: new Date(),
        },
      });

      return created;
    });

    await this.audit.logUserAction({
      actorUserId: userId,
      entityType: 'listing',
      entityId: listing.id,
      action: 'listing.create',
      after: { releaseId: dto.releaseId, units: units.toString() },
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    this.cacheInvalidation.onCatalogOrMarketChange();

    const ctx = await this.enrichment.loadByReleaseIds([listing.releaseId]);
    return mapRichListing(listing, ctx.get(listing.releaseId)!, userId);
  }

  async cancelListing(
    userId: string,
    listingId: string,
    meta?: { ip: string | null; userAgent: string | null },
  ) {
    await this.enforcement.assertUserCanTransact(userId);

    await this.prisma.$transaction(async (tx) => {
      const listing = await tx.marketListing.findFirst({
        where: { id: listingId, sellerUserId: userId, deletedAt: null },
      });
      if (!listing) {
        throwAdminError(
          'LISTING_NOT_FOUND',
          'Listing not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (
        listing.status !== ListingStatus.ACTIVE &&
        listing.status !== ListingStatus.PAUSED
      ) {
        throwAdminError(
          'LISTING_NOT_CANCELLABLE',
          'Listing cannot be cancelled',
          HttpStatus.CONFLICT,
        );
      }

      const unlock = listing.unitsAvailable;
      const position = await tx.userPosition.findUnique({
        where: { userId_releaseId: { userId, releaseId: listing.releaseId } },
      });
      if (position) {
        await tx.userPosition.update({
          where: { id: position.id },
          data: {
            unitsAvailable: position.unitsAvailable.plus(unlock),
            unitsLocked: position.unitsLocked.minus(unlock),
          },
        });
      }

      await tx.marketListing.update({
        where: { id: listingId },
        data: { status: ListingStatus.CANCELLED },
      });

      await tx.ownershipLedger.create({
        data: {
          userId,
          releaseId: listing.releaseId,
          eventType: OwnershipEventType.UNLOCK_AFTER_CANCEL,
          unitsDelta: unlock,
          happenedAt: new Date(),
        },
      });
    });

    await this.audit.logUserAction({
      actorUserId: userId,
      entityType: 'listing',
      entityId: listingId,
      action: 'listing.cancel',
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    this.cacheInvalidation.onCatalogOrMarketChange();

    void this.riskScoring.evaluateListingCancel(userId, listingId);

    return { ok: true as const, id: listingId };
  }

  async buyListing(
    buyerUserId: string,
    listingId: string,
    meta?: { ip: string | null; userAgent: string | null },
  ) {
    await this.eligibility.assertAllowed(buyerUserId, ConsentSource.SECONDARY_TRADE);
    await this.enforcement.assertListingCanBeBought(listingId);
    this.flags.assertEnabled('enableSecondaryMarket');
    const buyerWallet = await this.wallets.getOrCreateWallet(buyerUserId);
    const fees = await this.activeFeeSettings();

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        SELECT id FROM market_listings WHERE id = ${listingId}::uuid FOR UPDATE
      `;

      const listing = await tx.marketListing.findFirst({
        where: { id: listingId, deletedAt: null },
        include: { release: true },
      });
      if (!listing || listing.status !== ListingStatus.ACTIVE) {
        throwAdminError(
          'LISTING_NOT_ACTIVE',
          'Listing is not available',
          HttpStatus.CONFLICT,
        );
      }
      if (listing.unitsAvailable.lessThanOrEqualTo(0)) {
        throwAdminError(
          'LISTING_SOLD_OUT',
          'Listing has no units available',
          HttpStatus.CONFLICT,
        );
      }
      if (listing.sellerUserId === buyerUserId) {
        throwAdminError(
          'SELF_TRADE',
          'Cannot buy your own listing',
          HttpStatus.CONFLICT,
        );
      }

      const units = listing.unitsAvailable;
      const gross = units.mul(listing.pricePerUnit);
      const fee = gross.mul(fees.secondaryMarketFeePct).div(100);
      const sellerNet = gross.minus(fee);

      const sellerWallet = await tx.wallet.findUnique({
        where: {
          userId_assetCode_network: {
            userId: listing.sellerUserId,
            assetCode: buyerWallet.assetCode,
            network: buyerWallet.network,
          },
        },
        include: { balance: true },
      });
      if (!sellerWallet?.balance) {
        throwAdminError(
          'SELLER_WALLET_NOT_FOUND',
          'Seller wallet not found',
          HttpStatus.CONFLICT,
        );
      }

      const tradeCorrelationId = randomUUID();

      await this.ledger.debitAvailable(tx, buyerWallet.id, gross, {
        operationType: LedgerOperationType.SECONDARY_TRADE,
        sourceEntityType: 'secondary_trade',
        sourceEntityId: tradeCorrelationId,
        actorUserId: buyerUserId,
        actorRole: ActorRole.USER,
        currency: buyerWallet.assetCode,
        idempotencyKey: `secondary-buy-debit:${listingId}`,
      });
      await this.ledger.creditAvailable(tx, sellerWallet.id, sellerNet, {
        operationType: LedgerOperationType.SECONDARY_TRADE,
        sourceEntityType: 'secondary_trade',
        sourceEntityId: tradeCorrelationId,
        actorUserId: buyerUserId,
        actorRole: ActorRole.USER,
        currency: sellerWallet.assetCode,
        idempotencyKey: `secondary-sell-credit:${listingId}`,
      });

      const buyTx = await this.ledger.createWalletTransaction(tx, {
        walletId: buyerWallet.id,
        txType: WalletTxType.TRADE_SETTLEMENT,
        direction: WalletTxDirection.OUT,
        amount: gross,
        feeAmount: fee,
        netAmount: gross,
        currency: buyerWallet.assetCode,
        status: WalletTxStatus.COMPLETED,
        referenceType: 'secondary_trade',
        referenceId: listingId,
        ctx: {
          operationType: LedgerOperationType.SECONDARY_TRADE,
          sourceEntityType: 'secondary_trade',
          sourceEntityId: tradeCorrelationId,
          actorUserId: buyerUserId,
          actorRole: ActorRole.USER,
          currency: buyerWallet.assetCode,
          idempotencyKey: `secondary-buy-tx:${listingId}`,
        },
      });

      await this.ledger.createWalletTransaction(tx, {
        walletId: sellerWallet.id,
        txType: WalletTxType.TRADE_SETTLEMENT,
        direction: WalletTxDirection.IN,
        amount: sellerNet,
        feeAmount: fee,
        netAmount: sellerNet,
        currency: sellerWallet.assetCode,
        status: WalletTxStatus.COMPLETED,
        referenceType: 'secondary_trade',
        referenceId: listingId,
        ctx: {
          operationType: LedgerOperationType.SECONDARY_TRADE,
          sourceEntityType: 'secondary_trade',
          sourceEntityId: tradeCorrelationId,
          actorUserId: buyerUserId,
          actorRole: ActorRole.USER,
          currency: sellerWallet.assetCode,
          idempotencyKey: `secondary-sell-tx:${listingId}`,
        },
      });

      if (fee.greaterThan(0)) {
        const feeTx = await this.ledger.createWalletTransaction(tx, {
          walletId: buyerWallet.id,
          txType: WalletTxType.FEE,
          direction: WalletTxDirection.OUT,
          amount: fee,
          feeAmount: new Prisma.Decimal(0),
          netAmount: fee,
          currency: buyerWallet.assetCode,
          status: WalletTxStatus.COMPLETED,
          referenceType: 'secondary_fee',
          referenceId: listingId,
          ctx: {
            operationType: LedgerOperationType.PLATFORM_FEE,
            sourceEntityType: 'secondary_trade',
            sourceEntityId: tradeCorrelationId,
            actorUserId: buyerUserId,
            actorRole: ActorRole.USER,
            currency: buyerWallet.assetCode,
            idempotencyKey: `secondary-fee-tx:${listingId}`,
          },
        });
        await this.feeLedger.recordFee(tx, {
          walletTransactionId: feeTx.id,
          feeCode: 'secondary_market_fee',
          subjectType: 'secondary_trade',
          subjectId: listingId,
          amount: fee,
          currency: buyerWallet.assetCode,
          rate: fees.secondaryMarketFeePct,
        });
        await this.ledger.recordPlatformFee(tx, buyerWallet.id, fee, {
          operationType: LedgerOperationType.PLATFORM_FEE,
          sourceEntityType: 'secondary_trade',
          sourceEntityId: tradeCorrelationId,
          actorUserId: buyerUserId,
          actorRole: ActorRole.USER,
          currency: buyerWallet.assetCode,
          walletTransactionId: feeTx.id,
          idempotencyKey: `secondary-fee-ledger:${listingId}`,
        });
      }

      const sellOrder = await tx.order.create({
        data: {
          userId: listing.sellerUserId,
          releaseId: listing.releaseId,
          listingId: listing.id,
          side: OrderSide.SELL,
          orderType: OrderType.LIMIT,
          timeInForce: TimeInForce.IOC,
          priceLimit: listing.pricePerUnit,
          unitsTotal: units,
          unitsFilled: units,
          status: OrderStatus.FILLED,
        },
      });

      const buyOrder = await tx.order.create({
        data: {
          userId: buyerUserId,
          releaseId: listing.releaseId,
          listingId: listing.id,
          side: OrderSide.BUY,
          orderType: OrderType.MARKET,
          timeInForce: TimeInForce.IOC,
          unitsTotal: units,
          unitsFilled: units,
          status: OrderStatus.FILLED,
        },
      });

      const executedAt = new Date();
      const trade = await tx.trade.create({
        data: {
          releaseId: listing.releaseId,
          buyOrderId: buyOrder.id,
          sellOrderId: sellOrder.id,
          buyerUserId,
          sellerUserId: listing.sellerUserId,
          price: listing.pricePerUnit,
          units,
          grossAmount: gross,
          feeTotal: fee,
          settlementStatus: TradeSettlementStatus.SETTLED,
          executedAt,
        },
      });

      await recordTradePriceHistory(tx, {
        releaseId: listing.releaseId,
        executedAt,
        price: listing.pricePerUnit,
        units,
        gross,
      });

      await tx.orderFill.createMany({
        data: [
          {
            orderId: buyOrder.id,
            tradeId: trade.id,
            side: OrderSide.BUY,
            units,
            price: listing.pricePerUnit,
            grossAmount: gross,
            feeAmount: fee,
            netAmount: gross,
          },
          {
            orderId: sellOrder.id,
            tradeId: trade.id,
            side: OrderSide.SELL,
            units,
            price: listing.pricePerUnit,
            grossAmount: gross,
            feeAmount: fee,
            netAmount: sellerNet,
          },
        ],
      });

      const sellerPos = await tx.userPosition.findUnique({
        where: {
          userId_releaseId: {
            userId: listing.sellerUserId,
            releaseId: listing.releaseId,
          },
        },
      });
      if (sellerPos) {
        await tx.userPosition.update({
          where: { id: sellerPos.id },
          data: {
            unitsTotal: sellerPos.unitsTotal.minus(units),
            unitsLocked: sellerPos.unitsLocked.minus(units),
          },
        });
      }

      let buyerPos = await tx.userPosition.findUnique({
        where: {
          userId_releaseId: {
            userId: buyerUserId,
            releaseId: listing.releaseId,
          },
        },
      });
      if (buyerPos) {
        const newTotal = buyerPos.unitsTotal.plus(units);
        const avg = buyerPos.avgEntryPrice
          .mul(buyerPos.unitsTotal)
          .plus(listing.pricePerUnit.mul(units))
          .div(newTotal);
        buyerPos = await tx.userPosition.update({
          where: { id: buyerPos.id },
          data: {
            unitsTotal: newTotal,
            unitsAvailable: buyerPos.unitsAvailable.plus(units),
            avgEntryPrice: avg,
          },
        });
      } else {
        buyerPos = await tx.userPosition.create({
          data: {
            userId: buyerUserId,
            releaseId: listing.releaseId,
            unitsTotal: units,
            unitsAvailable: units,
            unitsLocked: new Prisma.Decimal(0),
            avgEntryPrice: listing.pricePerUnit,
          },
        });
      }

      await tx.marketListing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.SOLD_OUT,
          unitsAvailable: new Prisma.Decimal(0),
        },
      });

      await tx.ownershipLedger.createMany({
        data: [
          {
            userId: listing.sellerUserId,
            releaseId: listing.releaseId,
            eventType: OwnershipEventType.SECONDARY_SELL,
            unitsDelta: units.negated(),
            pricePerUnit: listing.pricePerUnit,
            tradeId: trade.id,
            walletTransactionId: buyTx.id,
            happenedAt: new Date(),
          },
          {
            userId: buyerUserId,
            releaseId: listing.releaseId,
            eventType: OwnershipEventType.SECONDARY_BUY,
            unitsDelta: units,
            pricePerUnit: listing.pricePerUnit,
            tradeId: trade.id,
            happenedAt: new Date(),
          },
        ],
      });

      return {
        tradeId: trade.id,
        listingId,
        units: units.toString(),
        grossAmount: gross.toString(),
        feeAmount: fee.toString(),
        sellerNet: sellerNet.toString(),
        status: 'settled',
      };
    });

    const listingMeta = await this.prisma.marketListing.findUnique({
      where: { id: listingId },
      include: { release: { select: { title: true } } },
    });

    void this.riskScoring.evaluateTrade({
      buyerUserId,
      sellerUserId: listingMeta!.sellerUserId,
      tradeId: result.tradeId,
      releaseId: listingMeta!.releaseId,
    });

    await this.audit.logUserAction({
      actorUserId: buyerUserId,
      entityType: 'trade',
      entityId: result.tradeId,
      action: 'secondary.buy',
      after: result,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    if (listingMeta) {
      void this.notificationEvents.secondaryTradeExecuted({
        tradeId: result.tradeId,
        buyerUserId,
        sellerUserId: listingMeta.sellerUserId,
        releaseTitle: listingMeta.release.title,
        units: result.units,
        grossAmount: result.grossAmount,
      });
    }

    this.cacheInvalidation.onSecondaryTrade();
    const feeAmount = new Prisma.Decimal(result.feeAmount);
    if (feeAmount.greaterThan(0)) {
      void this.referralEvents.onSecondaryTradeFee({
        buyerUserId,
        tradeId: result.tradeId,
        feeAmount,
      });
    }
    return result;
  }

  async listTrades(userId: string, page = 1, pageSize = 20) {
    const { skip, page: p, pageSize: ps } = resolvePagination(page, pageSize);
    const where: Prisma.TradeWhereInput = {
      OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
    };
    const [total, rows] = await Promise.all([
      this.prisma.trade.count({ where }),
      this.prisma.trade.findMany({
        where,
        skip,
        take: ps,
        orderBy: { executedAt: 'desc' },
        include: {
          release: {
            include: { releaseArtists: { include: { artist: true } } },
          },
          buyOrder: { select: { id: true, listingId: true } },
          sellOrder: { select: { id: true, listingId: true } },
        },
      }),
    ]);
    return {
      items: rows.map((t) => mapRichTrade(t, userId)),
      total,
      page: p,
      pageSize: ps,
      hasMore: skip + rows.length < total,
    };
  }

  async getTrade(userId: string, tradeId: string) {
    const t = await this.prisma.trade.findFirst({
      where: {
        id: tradeId,
        OR: [{ buyerUserId: userId }, { sellerUserId: userId }],
      },
      include: {
        release: {
          include: { releaseArtists: { include: { artist: true } } },
        },
        buyOrder: { select: { id: true, listingId: true } },
        sellOrder: { select: { id: true, listingId: true } },
      },
    });
    if (!t) {
      throwAdminError(
        'TRADE_NOT_FOUND',
        'Trade not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return mapRichTrade(t, userId);
  }

  async listMyOrders(
    userId: string,
    page = 1,
    pageSize = 50,
    releaseId?: string,
  ) {
    const { skip, page: p, pageSize: ps } = resolvePagination(page, pageSize);
    const listingWhere = {
      sellerUserId: userId,
      deletedAt: null,
      ...(releaseId ? { releaseId } : {}),
    };
    const orderWhere = {
      userId,
      listingId: { not: null },
      primaryRaiseRoundId: null,
      ...(releaseId ? { releaseId } : {}),
    };
    const fetchCap = Math.min(ps * 3, MAX_PAGE_SIZE * 3);
    const [listingTotal, orderTotal, listings, orders] = await Promise.all([
      this.prisma.marketListing.count({ where: listingWhere }),
      this.prisma.order.count({ where: orderWhere }),
      this.prisma.marketListing.findMany({
        where: listingWhere,
        orderBy: { updatedAt: 'desc' },
        take: fetchCap,
        skip,
        include: listingInclude,
      }),
      this.prisma.order.findMany({
        where: orderWhere,
        orderBy: { createdAt: 'desc' },
        take: fetchCap,
        skip,
        include: {
          release: {
            include: { releaseArtists: { include: { artist: true } } },
          },
        },
      }),
    ]);

    const listingOrders = listings.map((l) => mapListingToUserOrder(l, userId));
    const tradeOrders = orders.map((o) => mapDbOrderToUserOrder(o));
    const merged = [...listingOrders, ...tradeOrders]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, ps);

    const total = listingTotal + orderTotal;
    return {
      items: merged,
      total,
      page: p,
      pageSize: ps,
      hasMore: skip + merged.length < total,
    };
  }

  async listHoldings(userId: string) {
    const rows = await this.prisma.userPosition.findMany({
      where: { userId, unitsTotal: { gt: 0 } },
      include: { release: true },
      orderBy: { updatedAt: 'desc' },
    });
    return {
      items: rows.map((p) => ({
        releaseId: p.releaseId,
        trackTitle: p.release.title,
        symbol: p.release.symbol,
        unitsTotal: p.unitsTotal.toString(),
        unitsAvailable: p.unitsAvailable.toString(),
        unitsLocked: p.unitsLocked.toString(),
        avgEntryPrice: p.avgEntryPrice.toString(),
      })),
    };
  }

  async getActivePrimaryRound(releaseId: string) {
    const round = await this.prisma.primaryRaiseRound.findFirst({
      where: { releaseId, status: PrimaryRaiseRoundStatus.LIVE },
      include: { release: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!round) {
      throwAdminError(
        'ROUND_NOT_ACTIVE',
        'No active primary round for this release',
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      round.release.deletedAt != null ||
      round.release.status !== ReleaseStatus.ACTIVE
    ) {
      throwAdminError(
        'TRACK_NOT_ACTIVE',
        'Release is not available for primary purchase',
        HttpStatus.CONFLICT,
      );
    }
    const available = round.totalUnits.minus(round.soldUnits);
    const pricePerUnit = round.release.primaryUnitPrice;
    const fees = await this.activeFeeSettings();
    return {
      roundId: round.id,
      releaseId: round.releaseId,
      trackTitle: round.release.title,
      status: 'live',
      availableUnits: available.toString(),
      pricePerUnit: pricePerUnit.toString(),
      primaryPurchaseFeePct: fees.primaryPurchaseFeePct.toString(),
      raiseTargetUsdt: round.raiseTargetUsdt.toString(),
      hardCapUsdt: round.hardCapUsdt.toString(),
    };
  }

  async listMyListings(userId: string, page = 1, pageSize = 20) {
    const { skip, page: p, pageSize: ps } = resolvePagination(page, pageSize);
    const where = { sellerUserId: userId, deletedAt: null };
    const [total, rows] = await Promise.all([
      this.prisma.marketListing.count({ where }),
      this.prisma.marketListing.findMany({
        where,
        skip,
        take: ps,
        orderBy: { createdAt: 'desc' },
        include: listingInclude,
      }),
    ]);
    const ctx = await this.enrichment.loadByReleaseIds(
      rows.map((r) => r.releaseId),
    );
    return {
      items: rows.map((l) => mapRichListing(l, ctx.get(l.releaseId)!, userId)),
      total,
      page: p,
      pageSize: ps,
      hasMore: skip + rows.length < total,
    };
  }

  async feePreview(_userId: string, query: FeePreviewQueryDto) {
    const fees = await this.activeFeeSettings();
    let units: Prisma.Decimal;
    let pricePerUnit: Prisma.Decimal;

    if (query.listingId) {
      const listing = await this.prisma.marketListing.findFirst({
        where: {
          id: query.listingId,
          deletedAt: null,
          status: ListingStatus.ACTIVE,
        },
      });
      if (!listing) {
        throwAdminError(
          'LISTING_NOT_FOUND',
          'Listing not found',
          HttpStatus.NOT_FOUND,
        );
      }
      units = listing.unitsAvailable;
      pricePerUnit = listing.pricePerUnit;
    } else if (
      query.releaseId &&
      query.units != null &&
      query.pricePerUnit != null
    ) {
      units = new Prisma.Decimal(query.units);
      pricePerUnit = new Prisma.Decimal(query.pricePerUnit);
    } else {
      throwAdminError(
        'FEE_PREVIEW_INVALID',
        'Provide listingId or releaseId with units and pricePerUnit',
        HttpStatus.BAD_REQUEST,
      );
    }

    const gross = units.mul(pricePerUnit);
    const fee = gross.mul(fees.secondaryMarketFeePct).div(100);
    const sellerNet = gross.minus(fee);

    return {
      units: units.toString(),
      pricePerUnit: pricePerUnit.toString(),
      grossAmount: gross.toString(),
      feeAmount: fee.toString(),
      feePct: fees.secondaryMarketFeePct.toString(),
      buyerTotal: gross.toString(),
      sellerNet: sellerNet.toString(),
      roundingNote:
        'Комиссия считается от номинала сделки (gross). Покупатель списывает gross; комиссия удерживается из выплаты продавцу.',
    };
  }

  async listWatchlist(userId: string) {
    const items = await this.prisma.marketWatchlistItem.findMany({
      where: { userId },
      include: {
        release: {
          include: { releaseArtists: { include: { artist: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (items.length === 0) {
      return { items: [] as const };
    }

    const releaseIds = items.map((i) => i.releaseId);
    const [ctxMap, listingAgg, recentTradeCounts] = await Promise.all([
      this.enrichment.loadByReleaseIds(releaseIds),
      this.prisma.marketListing.groupBy({
        by: ['releaseId'],
        where: {
          releaseId: { in: releaseIds },
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          unitsAvailable: { gt: 0 },
        },
        _count: { id: true },
        _sum: { unitsAvailable: true },
      }),
      this.prisma.trade.groupBy({
        by: ['releaseId'],
        where: {
          releaseId: { in: releaseIds },
          settlementStatus: TradeSettlementStatus.SETTLED,
          executedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        _count: { id: true },
      }),
    ]);

    const listingByRelease = new Map(
      listingAgg.map((r) => [
        r.releaseId,
        {
          count: r._count.id,
          units: r._sum.unitsAvailable?.toString() ?? '0',
        },
      ]),
    );
    const deals24hByRelease = new Map(
      recentTradeCounts.map((r) => [r.releaseId, r._count.id]),
    );

    return {
      items: items.map((item) => {
        const release = item.release;
        const ctx = ctxMap.get(release.id)!;
        const agg = listingByRelease.get(release.id);
        const artist =
          release.releaseArtists?.[0]?.artist.name ??
          release.copyrightOwner ??
          'Unknown Artist';
        const bestAsk = ctx.bestAsk ? Number(ctx.bestAsk) : 0;
        const spark =
          ctx.payoutSparkline.length >= 2
            ? ctx.payoutSparkline.map((p) => Number(p))
            : [0.45, 0.46, 0.47, 0.48, 0.49, 0.5];

        return {
          id: item.id,
          releaseId: release.slug,
          releaseUuid: release.id,
          bookMarketId: release.slug,
          symbol: release.symbol,
          track: release.title,
          artist,
          pricePerUnit: bestAsk || Number(release.primaryUnitPrice),
          change24hPct: Number(ctx.change7dPct),
          listingsCount: agg?.count ?? 0,
          unitsInBook: Number(agg?.units ?? 0),
          deals24h: deals24hByRelease.get(release.id) ?? 0,
          liquidity: ctx.liquidity,
          spark,
        };
      }),
    };
  }

  async addWatchlistItem(userId: string, releaseId: string) {
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, deletedAt: null },
    });
    if (!release) {
      throwAdminError(
        'RELEASE_NOT_FOUND',
        'Release not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.prisma.marketWatchlistItem.findUnique({
      where: { userId_releaseId: { userId, releaseId } },
    });
    if (existing) {
      return { id: existing.id, releaseId: release.slug, alreadyExists: true };
    }

    const created = await this.prisma.marketWatchlistItem.create({
      data: { userId, releaseId },
    });
    return { id: created.id, releaseId: release.slug, alreadyExists: false };
  }

  async removeWatchlistItem(userId: string, watchlistId: string) {
    const row = await this.prisma.marketWatchlistItem.findFirst({
      where: { id: watchlistId, userId },
    });
    if (!row) {
      throwAdminError(
        'WATCHLIST_NOT_FOUND',
        'Watchlist item not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.prisma.marketWatchlistItem.delete({ where: { id: watchlistId } });
    return { ok: true as const, id: watchlistId };
  }

  async orderPreview(userId: string, dto: MarketOrderPreviewDto) {
    const side = dto.side.toUpperCase() as 'BUY' | 'SELL';
    const type = dto.type.toUpperCase() as 'LIMIT' | 'MARKET';

    const { releaseId } = await this.marketResolve.resolveReleaseByMarketKey(
      dto.marketId,
    );

    const [wallet, position, fees, listings] = await Promise.all([
      this.prisma.wallet.findFirst({
        where: { userId, assetCode: 'USDT' },
        include: { balance: true },
      }),
      this.prisma.userPosition.findUnique({
        where: { userId_releaseId: { userId, releaseId } },
      }),
      this.activeFeeSettings(),
      this.prisma.marketListing.findMany({
        where: {
          releaseId,
          deletedAt: null,
          status: ListingStatus.ACTIVE,
          unitsAvailable: { gt: 0 },
        },
        orderBy: { pricePerUnit: 'asc' },
        take: 20,
      }),
    ]);

    const bestAsk = listings[0] ?? null;
    const walletBalance = wallet?.balance?.available.toString() ?? '0';
    const availableUnits = position?.unitsAvailable.toString() ?? '0';
    const lockedUnits = position?.unitsLocked.toString() ?? '0';

    const base = {
      marketId: dto.marketId,
      releaseId,
      walletBalance,
      availableUnits,
      lockedUnits,
      bestBid: null,
      bestAsk: bestAsk?.pricePerUnit.toString() ?? null,
      feeRate: fees.secondaryMarketFeePct.toString(),
      crossesMarket: false,
      listingId: null as string | null,
    };

    if (type === 'MARKET') {
      return {
        ...base,
        canSubmit: false,
        blockingReason:
          'Market-заявки пока недоступны — используйте limit по активному лоту.',
        executionMode: 'BLOCKED' as const,
        subtotal: '0',
        feeAmount: '0',
        totalAmount: '0',
        estimatedAveragePrice: null,
        estimatedSlippage: null,
      };
    }

    const price = dto.price != null ? new Prisma.Decimal(dto.price) : null;
    const units = dto.units != null ? new Prisma.Decimal(dto.units) : null;

    if (!price || price.lessThanOrEqualTo(0)) {
      return {
        ...base,
        canSubmit: false,
        blockingReason: 'Цена должна быть больше 0',
        executionMode: 'BLOCKED' as const,
        subtotal: '0',
        feeAmount: '0',
        totalAmount: '0',
        estimatedAveragePrice: null,
        estimatedSlippage: null,
      };
    }

    if (!units || units.lessThanOrEqualTo(0)) {
      return {
        ...base,
        canSubmit: false,
        blockingReason: 'Количество units должно быть больше 0',
        executionMode: 'BLOCKED' as const,
        subtotal: '0',
        feeAmount: '0',
        totalAmount: '0',
        estimatedAveragePrice: null,
        estimatedSlippage: null,
      };
    }

    const gross = units.mul(price);
    const feeAmount = gross.mul(fees.secondaryMarketFeePct).div(100);

    if (side === 'SELL') {
      const avail = position?.unitsAvailable ?? new Prisma.Decimal(0);
      if (avail.lessThan(units)) {
        return {
          ...base,
          canSubmit: false,
          blockingReason: 'Недостаточно units',
          executionMode: 'BLOCKED' as const,
          subtotal: gross.toString(),
          feeAmount: feeAmount.toString(),
          totalAmount: gross.toString(),
          estimatedAveragePrice: price.toString(),
          estimatedSlippage: '0',
        };
      }
      return {
        ...base,
        canSubmit: true,
        blockingReason: null,
        executionMode: 'MAKER' as const,
        subtotal: gross.toString(),
        feeAmount: feeAmount.toString(),
        totalAmount: gross.toString(),
        estimatedAveragePrice: price.toString(),
        estimatedSlippage: '0',
      };
    }

    if (!bestAsk) {
      return {
        ...base,
        canSubmit: false,
        blockingReason: 'В стакане нет активных лотов для покупки',
        executionMode: 'BLOCKED' as const,
        subtotal: gross.toString(),
        feeAmount: feeAmount.toString(),
        totalAmount: gross.toString(),
        estimatedAveragePrice: price.toString(),
        estimatedSlippage: null,
      };
    }

    if (!bestAsk.unitsAvailable.equals(units)) {
      return {
        ...base,
        canSubmit: false,
        blockingReason: `Покупка целого лота: доступно ${bestAsk.unitsAvailable.toString()} u по ${bestAsk.pricePerUnit.toString()} USDT`,
        executionMode: 'BLOCKED' as const,
        subtotal: bestAsk.unitsAvailable.mul(bestAsk.pricePerUnit).toString(),
        feeAmount: bestAsk.unitsAvailable
          .mul(bestAsk.pricePerUnit)
          .mul(fees.secondaryMarketFeePct)
          .div(100)
          .toString(),
        totalAmount: bestAsk.unitsAvailable.mul(bestAsk.pricePerUnit).toString(),
        estimatedAveragePrice: bestAsk.pricePerUnit.toString(),
        estimatedSlippage: null,
        listingId: bestAsk.id,
      };
    }

    if (price.lessThan(bestAsk.pricePerUnit)) {
      return {
        ...base,
        canSubmit: false,
        blockingReason:
          'Лимитные заявки на покупку ниже ask не поддерживаются — повысьте цену до уровня лота',
        executionMode: 'BLOCKED' as const,
        subtotal: gross.toString(),
        feeAmount: feeAmount.toString(),
        totalAmount: gross.toString(),
        estimatedAveragePrice: bestAsk.pricePerUnit.toString(),
        estimatedSlippage: null,
        listingId: bestAsk.id,
      };
    }

    if (bestAsk.sellerUserId === userId) {
      return {
        ...base,
        canSubmit: false,
        blockingReason: 'Нельзя купить собственный лот',
        executionMode: 'BLOCKED' as const,
        subtotal: gross.toString(),
        feeAmount: feeAmount.toString(),
        totalAmount: gross.toString(),
        estimatedAveragePrice: bestAsk.pricePerUnit.toString(),
        estimatedSlippage: null,
        listingId: bestAsk.id,
      };
    }

    const buyerTotal = bestAsk.unitsAvailable.mul(bestAsk.pricePerUnit);
    const available = wallet?.balance?.available ?? new Prisma.Decimal(0);
    if (available.lessThan(buyerTotal)) {
      return {
        ...base,
        canSubmit: false,
        blockingReason: 'Недостаточно средств',
        executionMode: 'BLOCKED' as const,
        subtotal: buyerTotal.toString(),
        feeAmount: buyerTotal.mul(fees.secondaryMarketFeePct).div(100).toString(),
        totalAmount: buyerTotal.toString(),
        estimatedAveragePrice: bestAsk.pricePerUnit.toString(),
        estimatedSlippage: '0',
        listingId: bestAsk.id,
        crossesMarket: true,
      };
    }

    return {
      ...base,
      canSubmit: true,
      blockingReason: null,
      executionMode: 'TAKER' as const,
      subtotal: buyerTotal.toString(),
      feeAmount: buyerTotal.mul(fees.secondaryMarketFeePct).div(100).toString(),
      totalAmount: buyerTotal.toString(),
      estimatedAveragePrice: bestAsk.pricePerUnit.toString(),
      estimatedSlippage: '0',
      listingId: bestAsk.id,
      crossesMarket: true,
    };
  }

  async submitMarketOrder(
    userId: string,
    dto: MarketOrderSubmitDto,
    meta?: { ip: string | null; userAgent: string | null },
    idempotencyKey?: string,
  ) {
    const key = (dto.idempotencyKey ?? idempotencyKey ?? '').trim();
    const previewDto: MarketOrderPreviewDto = {
      marketId: dto.marketId,
      side: dto.side,
      type: dto.type,
      price: dto.price,
      units: dto.units,
    };

    const run = async () => {
      const preview = await this.orderPreview(userId, previewDto);
      if (!preview.canSubmit) {
        throwAdminError(
          'ORDER_BLOCKED',
          preview.blockingReason ?? 'Заявка не может быть исполнена',
          HttpStatus.CONFLICT,
        );
      }

      const side = dto.side.toUpperCase();
      if (side === 'SELL') {
        const listing = await this.createListing(
          userId,
          {
            releaseId: preview.releaseId,
            units: dto.units!,
            pricePerUnit: dto.price!,
          },
          meta,
        );
        return {
          kind: 'listing' as const,
          listingId: listing.id,
          orderId: `lst-order-${listing.id}`,
        };
      }

      const listingId = preview.listingId;
      if (!listingId) {
        throwAdminError(
          'LISTING_NOT_FOUND',
          'Нет подходящего лота для покупки',
          HttpStatus.CONFLICT,
        );
      }
      const trade = await this.buyListing(userId, listingId, meta);
      return {
        kind: 'trade' as const,
        tradeId: trade.tradeId,
        listingId,
        orderId: trade.tradeId,
      };
    };

    if (!key) {
      return run();
    }

    const { result } = await this.idempotency.execute({
      actorType: 'user',
      actorId: userId,
      action: 'market.order.submit',
      idempotencyKey: key,
      requestHash: hashRequestPayload(dto),
      handler: run,
    });
    return result;
  }

  async cancelMarketOrder(
    userId: string,
    orderId: string,
    meta?: { ip: string | null; userAgent: string | null },
  ) {
    const listingId = orderId.startsWith('lst-order-')
      ? orderId.slice('lst-order-'.length)
      : orderId;
    return this.cancelListing(userId, listingId, meta);
  }
}
