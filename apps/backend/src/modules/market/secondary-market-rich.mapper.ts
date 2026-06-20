import {
  ListingStatus,
  OrderSide,
  OrderStatus,
  OrderType,
  Prisma,
  TradeSettlementStatus,
} from '@prisma/client';
import type {
  ReleaseMarketContext,
  RichMarketListingDto,
  RichMarketTradeDto,
  RichUserMarketOrderDto,
  SecondaryMarketLiquidityTag,
} from './secondary-market-rich.types';

const LISTING_STATUS_LABEL: Record<string, string> = {
  active: 'Активно',
  paused: 'На паузе',
  sold_out: 'Продано',
  cancelled: 'Отменено',
  expired: 'Истекло',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  active: 'Активна',
  partial: 'Частично',
  open: 'Активна',
  partially_filled: 'Частично',
  filled: 'Исполнена',
  cancelled: 'Отменена',
  rejected: 'Отклонена',
  expired: 'Истекла',
  created: 'Создана',
  paid: 'Оплачена',
  settled: 'Исполнена',
  failed: 'Сбой',
};

const LIQUIDITY_LABEL: Record<SecondaryMarketLiquidityTag, string> = {
  high: 'Высокая',
  med: 'Средняя',
  low: 'Низкая',
};

type ListingRow = Prisma.MarketListingGetPayload<{
  include: {
    release: {
      include: { releaseArtists: { include: { artist: true } } };
    };
    seller: { select: { id: true; email: true } };
  };
}>;

export function listingStatusToApi(status: ListingStatus): string {
  const map: Record<ListingStatus, string> = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    SOLD_OUT: 'sold_out',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
  };
  return map[status] ?? status.toLowerCase();
}

export function normalizeGenre(genre: string | null | undefined): string {
  const g = (genre ?? 'electronic').toLowerCase();
  if (g.includes('pop')) return 'pop';
  if (g.includes('hip')) return 'hiphop';
  if (g.includes('rock')) return 'rock';
  return 'electronic';
}

function artistName(release: ListingRow['release']): string {
  return (
    release.releaseArtists?.[0]?.artist.name ??
    release.copyrightOwner ??
    'Unknown Artist'
  );
}

function spreadValues(price: Prisma.Decimal, ctx: ReleaseMarketContext) {
  const ask = ctx.bestAsk ? new Prisma.Decimal(ctx.bestAsk) : price;
  const bid = ctx.bestBid ? new Prisma.Decimal(ctx.bestBid) : price.mul(0.98);
  const spread = ask.minus(bid);
  const spreadPct = ask.greaterThan(0)
    ? spread.div(ask).mul(100)
    : new Prisma.Decimal(0);
  return {
    spread: spread.toFixed(4),
    spreadPct: spreadPct.toFixed(2),
  };
}

export function mapRichListing(
  row: ListingRow,
  ctx: ReleaseMarketContext,
  viewerUserId?: string,
): RichMarketListingDto {
  const units = row.unitsAvailable;
  const ppu = row.pricePerUnit;
  const listingValue = units.mul(ppu);
  const status = listingStatusToApi(row.status);
  const { spread, spreadPct } = spreadValues(ppu, ctx);
  const isOwn = viewerUserId === row.sellerUserId;
  const canCancel =
    isOwn &&
    (row.status === ListingStatus.ACTIVE ||
      row.status === ListingStatus.PAUSED);

  const rangeLow =
    ctx.range7dLow !== '0' ? ctx.range7dLow : ppu.mul(0.95).toString();
  const rangeHigh =
    ctx.range7dHigh !== '0' ? ctx.range7dHigh : ppu.mul(1.05).toString();
  const sparkline =
    ctx.payoutSparkline.length >= 2
      ? ctx.payoutSparkline
      : [ppu.mul(0.98), ppu.mul(0.99), ppu, ppu, ppu].map((d) => d.toString());

  return {
    id: row.id,
    releaseId: row.releaseId,
    releaseSlug: row.release.slug,
    symbol: row.release.symbol,
    title: row.release.title,
    artist: artistName(row.release),
    coverUrl: row.release.coverUrl,
    genre: normalizeGenre(row.release.genre),
    unitsAvailable: units.toString(),
    unitsTotal: row.unitsTotal.toString(),
    pricePerUnit: ppu.toString(),
    listingValueUsdt: listingValue.toFixed(2),
    seller: { id: row.sellerUserId, email: row.seller.email },
    spread,
    spreadPct,
    liquidity: ctx.liquidity,
    liquidityLabel: LIQUIDITY_LABEL[ctx.liquidity],
    volume24hUsdt: ctx.volume24hUsdt,
    change7dPct: ctx.change7dPct,
    payoutSparkline: sparkline,
    range7dLow: rangeLow,
    range7dHigh: rangeHigh,
    bestBid: ctx.bestBid,
    bestAsk: ctx.bestAsk ?? ppu.toString(),
    deals7d: ctx.deals7d,
    status,
    statusLabel: LISTING_STATUS_LABEL[status] ?? status,
    canBuy:
      !!viewerUserId &&
      !isOwn &&
      row.status === ListingStatus.ACTIVE &&
      units.greaterThan(0),
    canCancel,
    analyticsCatalogId: row.release.slug,
    listingNote: `Лот на вторичном рынке · ${row.release.symbol}`,
    featured: ctx.liquidity === 'high' && ctx.deals7d >= 3,
    createdAt: row.createdAt.toISOString(),
  };
}

type TradeRow = Prisma.TradeGetPayload<{
  include: {
    release: { include: { releaseArtists: { include: { artist: true } } } };
    buyOrder: { select: { id: true; listingId: true } };
    sellOrder: { select: { id: true; listingId: true } };
  };
}>;

export function mapRichTrade(
  row: TradeRow,
  viewerUserId: string,
): RichMarketTradeDto {
  const isBuyer = row.buyerUserId === viewerUserId;
  const side = isBuyer ? 'buy' : 'sell';
  const gross = row.grossAmount;
  const fee = row.feeTotal;
  const net = isBuyer ? gross.plus(fee) : gross.minus(fee);
  const settlement = tradeSettlementToApi(row.settlementStatus);

  return {
    id: row.id,
    releaseId: row.releaseId,
    releaseSlug: row.release.slug,
    title: row.release.title,
    artist: artistName(row.release),
    ticker: row.release.symbol,
    genre: normalizeGenre(row.release.genre),
    coverUrl: row.release.coverUrl,
    side,
    units: row.units.toString(),
    price: row.price.toString(),
    grossAmount: gross.toString(),
    feeAmount: fee.toString(),
    netAmount: net.toString(),
    settlementStatus: settlement,
    settlementLabel: settlementLabel(settlement),
    linkedOrderId: isBuyer
      ? (row.buyOrder?.id ?? null)
      : (row.sellOrder?.id ?? null),
    linkedListingId:
      row.sellOrder?.listingId ?? row.buyOrder?.listingId ?? null,
    executedAt: row.executedAt.toISOString(),
  };
}

function tradeSettlementToApi(
  status: TradeSettlementStatus,
): 'settled' | 'processing' | 'failed' {
  if (status === TradeSettlementStatus.SETTLED) return 'settled';
  if (status === TradeSettlementStatus.FAILED) return 'failed';
  return 'processing';
}

function settlementLabel(status: 'settled' | 'processing' | 'failed'): string {
  if (status === 'settled') return 'Исполнено';
  if (status === 'failed') return 'Сбой';
  return 'В обработке';
}

export function mapListingToUserOrder(
  row: ListingRow,
  viewerUserId: string,
): RichUserMarketOrderDto {
  const units = row.unitsTotal;
  const filled = units.minus(row.unitsAvailable);
  const ppu = row.pricePerUnit;
  let statusKey = listingStatusToUserOrderStatus(row.status);
  if (listingHasPartialFill(row)) statusKey = 'partial';

  return {
    id: `lst-order-${row.id}`,
    listingId: row.id,
    releaseId: row.releaseId,
    releaseSlug: row.release.slug,
    symbol: row.release.symbol,
    title: row.release.title,
    artist: artistName(row.release),
    side: 'sell',
    mode: 'limit',
    pricePerUnit: ppu.toString(),
    unitsTotal: units.toString(),
    unitsFilled: filled.toString(),
    orderValueUsdt: units.mul(ppu).toFixed(2),
    status: statusKey,
    statusLabel: ORDER_STATUS_LABEL[statusKey] ?? statusKey,
    canCancel:
      row.sellerUserId === viewerUserId &&
      (row.status === ListingStatus.ACTIVE ||
        row.status === ListingStatus.PAUSED),
    failureReason: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function listingStatusToUserOrderStatus(status: ListingStatus): string {
  if (status === ListingStatus.SOLD_OUT) return 'filled';
  if (status === ListingStatus.CANCELLED || status === ListingStatus.EXPIRED) {
    return 'cancelled';
  }
  if (status === ListingStatus.PAUSED) return 'active';
  return 'active';
}

export function listingHasPartialFill(
  row: Pick<ListingRow, 'unitsTotal' | 'unitsAvailable' | 'status'>,
): boolean {
  return (
    row.status === ListingStatus.ACTIVE &&
    row.unitsAvailable.greaterThan(0) &&
    row.unitsAvailable.lessThan(row.unitsTotal)
  );
}

type DbOrderRow = Prisma.OrderGetPayload<{
  include: {
    release: { include: { releaseArtists: { include: { artist: true } } } };
  };
}>;

export function mapDbOrderToUserOrder(row: DbOrderRow): RichUserMarketOrderDto {
  const status = orderStatusToUserKey(row.status);
  const side = row.side === OrderSide.BUY ? 'buy' : 'sell';
  const mode = row.orderType === OrderType.MARKET ? 'market' : 'limit';
  const ppu = row.priceLimit ?? row.unitPrice;
  const gross =
    row.grossAmount ?? row.unitsTotal.mul(ppu ?? new Prisma.Decimal(0));

  return {
    id: row.id,
    listingId: row.listingId ?? '',
    releaseId: row.releaseId,
    releaseSlug: row.release.slug,
    symbol: row.release.symbol,
    title: row.release.title,
    artist: artistName(row.release),
    side,
    mode,
    pricePerUnit: ppu?.toString() ?? null,
    unitsTotal: row.unitsTotal.toString(),
    unitsFilled: row.unitsFilled.toString(),
    orderValueUsdt: gross.toString(),
    status,
    statusLabel: ORDER_STATUS_LABEL[status] ?? status,
    canCancel: false,
    failureReason: row.failureReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function orderStatusToUserKey(status: OrderStatus): string {
  const map: Partial<Record<OrderStatus, string>> = {
    OPEN: 'active',
    PARTIALLY_FILLED: 'partial',
    FILLED: 'filled',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    SETTLED: 'filled',
    FAILED: 'rejected',
  };
  return map[status] ?? status.toLowerCase();
}
