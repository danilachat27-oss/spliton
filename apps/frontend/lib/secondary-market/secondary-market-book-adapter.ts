import type { MarketDepthDto } from "@/services/secondary-market.service";
import type { BookMarket, BookTrade } from "@/lib/secondary-market/secondary-market-book.types";
import { isSecondaryBookMarketQuery } from "@/constants/dashboard/secondary-market";

function formatTradeTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function adaptDepthToBookMarket(
  depth: MarketDepthDto,
  marketKey: string,
): BookMarket {
  const spark = depth.priceSparkline;

  const trades: BookTrade[] = depth.recentTrades.map((t) => ({
    time: formatTradeTime(t.time),
    side: t.side,
    price: Number(t.price),
    units: Number(t.units),
  }));

  return {
    id: isSecondaryBookMarketQuery(marketKey) ? marketKey : depth.slug,
    symbol: depth.symbol,
    track: depth.title,
    artist: depth.artist,
    releaseId: depth.slug,
    releaseUuid: depth.releaseId,
    asks: depth.asks.map((a) => ({
      price: Number(a.price),
      units: Number(a.units),
      listingId: a.listingId,
    })),
    bids: depth.bids.map((b) => ({
      price: Number(b.price),
      units: Number(b.units),
    })),
    trades,
    volume24hUsdt: Number(depth.volume24hUsdt),
    volume24hUnits: Number(depth.volume24hUnits),
    rightsListed: Number(depth.rightsListed),
    priceSpark: spark,
    liquidity: depth.liquidity,
    change24hPct: Number(depth.change24hPct ?? depth.change7dPct),
    high24h: Number(depth.high24h) || 0,
    low24h: Number(depth.low24h) || 0,
    availableUsdt: Number(depth.availableUsdt),
    availableUnits: Number(depth.availableUnits),
    unitsTotal: Number(depth.unitsTotal ?? depth.availableUnits),
    unitsLocked: Number(depth.unitsLocked ?? 0),
    lockedUsdt: Number(depth.lockedUsdt ?? 0),
    avgEntryPrice: Number(depth.avgEntryPrice ?? 0),
    lastPrice: Number(depth.lastPrice ?? 0),
    genre: depth.genre,
  };
}

export function depthQueryFromMarketKey(marketKey: string): {
  releaseId?: string;
  slug?: string;
  symbol?: string;
} {
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRe.test(marketKey)) return { releaseId: marketKey };
  if (marketKey.length <= 6 && marketKey === marketKey.toUpperCase()) {
    return { symbol: marketKey };
  }
  return { slug: marketKey };
}
