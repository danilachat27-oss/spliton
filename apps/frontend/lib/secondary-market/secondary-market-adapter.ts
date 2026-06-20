import type { SecondaryMarketListingGenre, SecondaryMarketListingMock } from "@/mocks/dashboard/secondary-market-listings.mock";
import type { SecondaryMarketUserTradeMock } from "@/components/dashboard/secondary-market/secondary-market-trade-history-tab";
import type {
  RichMarketListingDto,
  RichMarketTradeDto,
  RichUserMarketOrderDto,
} from "@/services/secondary-market.service";

function toGenre(genre: string): SecondaryMarketListingGenre {
  const g = genre.toLowerCase();
  if (g === "pop" || g === "hiphop" || g === "rock" || g === "electronic") {
    return g;
  }
  return "electronic";
}

function sparklineToNumbers(values: string[]): number[] {
  const nums = values.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (nums.length >= 2) return nums;
  return [0.4, 0.42, 0.45, 0.44, 0.48];
}

export type AdaptedListing = SecondaryMarketListingMock & {
  canBuy: boolean;
  canCancel: boolean;
  sellerUserId: string;
  coverUrl: string | null;
  status: string;
  statusLabel: string;
};

export function adaptRichListing(dto: RichMarketListingDto): AdaptedListing {
  return {
    id: dto.id,
    releaseId: dto.releaseSlug,
    analyticsCatalogId: dto.analyticsCatalogId,
    symbol: dto.symbol,
    track: dto.title,
    artist: dto.artist,
    genre: toGenre(dto.genre),
    pricePerUnit: Number(dto.pricePerUnit),
    change7dPct: Number(dto.change7dPct),
    payoutSparkline: sparklineToNumbers(dto.payoutSparkline),
    range7dLow: Number(dto.range7dLow) || Number(dto.pricePerUnit) * 0.95,
    range7dHigh: Number(dto.range7dHigh) || Number(dto.pricePerUnit) * 1.05,
    listingValueUsdt: Number(dto.listingValueUsdt),
    unitsAvailable: Number(dto.unitsAvailable),
    deals7d: dto.deals7d,
    liquidity: dto.liquidity,
    featured: dto.featured,
    listingNote: dto.listingNote,
    canBuy: dto.canBuy,
    canCancel: dto.canCancel,
    sellerUserId: dto.seller.id,
    coverUrl: dto.coverUrl,
    status: dto.status,
    statusLabel: dto.statusLabel,
  };
}

export type AdaptedUserOrder = {
  id: string;
  listingId: string;
  symbol: string;
  track: string;
  artist: string;
  releaseId: string;
  side: "buy" | "sell";
  mode: "limit" | "market";
  pricePerUnit: number | null;
  unitsTotal: number;
  unitsFilled: number;
  orderValueUsdt: number;
  status: "active" | "partial" | "filled" | "cancelled" | "expired" | "rejected";
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
  canCancel: boolean;
};

function toOrderStatus(status: string): AdaptedUserOrder["status"] {
  if (status === "partial") return "partial";
  if (status === "filled") return "filled";
  if (status === "cancelled") return "cancelled";
  if (status === "expired") return "expired";
  if (status === "rejected") return "rejected";
  return "active";
}

export function adaptUserOrder(dto: RichUserMarketOrderDto): AdaptedUserOrder {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  return {
    id: dto.id,
    listingId: dto.listingId,
    symbol: dto.symbol,
    track: dto.title,
    artist: dto.artist,
    releaseId: dto.releaseSlug,
    side: dto.side,
    mode: dto.mode,
    pricePerUnit: dto.pricePerUnit ? Number(dto.pricePerUnit) : null,
    unitsTotal: Number(dto.unitsTotal),
    unitsFilled: Number(dto.unitsFilled),
    orderValueUsdt: Number(dto.orderValueUsdt),
    status: toOrderStatus(dto.status),
    createdAt: fmt(dto.createdAt),
    updatedAt: fmt(dto.updatedAt),
    failureReason: dto.failureReason ?? undefined,
    canCancel: dto.canCancel,
  };
}

export function adaptRichTrade(dto: RichMarketTradeDto): SecondaryMarketUserTradeMock {
  return {
    id: dto.id,
    timestamp: dto.executedAt,
    releaseId: dto.releaseSlug,
    releaseSlug: dto.releaseSlug,
    title: dto.title,
    artist: dto.artist,
    ticker: dto.ticker,
    genre: toGenre(dto.genre),
    side: dto.side,
    units: Number(dto.units),
    price: Number(dto.price),
    grossAmount: Number(dto.grossAmount),
    feeAmount: Number(dto.feeAmount),
    netAmount: Number(dto.netAmount),
    settlementStatus: dto.settlementStatus,
    linkedOrderId: dto.linkedOrderId ?? "",
    linkedListingId: dto.linkedListingId ?? "",
  };
}
