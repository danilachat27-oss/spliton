export type BookLevel = { price: number; units: number; listingId?: string };
export type BookTrade = { time: string; side: "buy" | "sell"; price: number; units: number };

export type BookMarket = {
  id: string;
  symbol: string;
  track: string;
  artist: string;
  releaseId: string;
  /** UUID релиза для API create listing. */
  releaseUuid?: string;
  asks: BookLevel[];
  bids: BookLevel[];
  trades: BookTrade[];
  volume24hUsdt: number;
  volume24hUnits: number;
  rightsListed: number;
  priceSpark: number[];
  liquidity: "high" | "med" | "low";
  change24hPct: number;
  high24h: number;
  low24h: number;
  availableUsdt: number;
  availableUnits: number;
  unitsTotal: number;
  unitsLocked: number;
  lockedUsdt: number;
  avgEntryPrice: number;
  lastPrice: number;
  genre: string;
};
