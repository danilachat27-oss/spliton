/** Secondary market analytics mocks — mock mode only (Spliton). */

function days(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const PERIODS = days(14);

export const MOCK_MARKET_ANALYTICS_SUMMARY = {
  period: { from: PERIODS[0]!, to: PERIODS[PERIODS.length - 1]! },
  activeListings: 37,
  unitsListed: 124800,
  listingsValueUsdt: "5 248 300,00",
  avgListingAgeDays: 4,
  staleListings: 6,
  frozenListings: 2,
  completedTrades: 412,
  volumeUsdt: "1 248 300,00",
  avgTradeSizeUsdt: "3 029,85",
  avgPricePerUnitUsdt: "12,40",
  uniqueSellers: 89,
  uniqueBuyers: 156,
  secondaryFeesUsdt: "18 640,00",
  avgFeePerTradeUsdt: "45,24",
  suspiciousTrades: 3,
  feesUsdt: "18 640,00",
  deltas: { volumePct: 14.2, tradesPct: 8.1, feesPct: 11.5 },
};

export const MOCK_MARKET_ANALYTICS_VOLUME = {
  items: PERIODS.map((period, i) => ({
    period,
    volumeUsdt: (42000 + i * 3200).toLocaleString("ru-RU", { minimumFractionDigits: 2 }) + "",
    tradesCount: 18 + (i % 5),
    uniqueBuyers: 8 + (i % 3),
    uniqueSellers: 5 + (i % 2),
  })),
};

export const MOCK_MARKET_ANALYTICS_LISTINGS = {
  items: [
    { status: "active", count: 37 },
    { status: "paused", count: 2 },
    { status: "cancelled", count: 5 },
  ],
  byTrack: [
    { trackId: "r1", trackTitle: "Glass Horizon", count: 8, unitsListed: "42000" },
    { trackId: "r2", trackTitle: "Midnight Drive", count: 5, unitsListed: "28000" },
  ],
};

export const MOCK_MARKET_ANALYTICS_TRADES = {
  total: 412,
  failedCount: 2,
  completed: PERIODS.map((period, i) => ({ period, count: 20 + i })),
  suspicious: PERIODS.filter((_, i) => i % 5 === 0).map((period) => ({ period, count: 1 })),
};

export const MOCK_MARKET_ANALYTICS_TOP_USERS = {
  sellers: [
    { userId: "u1", email: "seller@spliton.test", tradesCount: 42, listingsCount: 3, volumeUsdt: "124 000,00", units: "8200", riskStatus: "none" },
  ],
  buyers: [
    { userId: "u2", email: "buyer@spliton.test", tradesCount: 38, listingsCount: 0, volumeUsdt: "98 400,00", units: "6100", riskStatus: "none" },
  ],
  listingSellers: [
    { userId: "u3", email: "lister@spliton.test", tradesCount: 0, listingsCount: 5, volumeUsdt: "0,00", units: "12000", riskStatus: "none" },
  ],
};

export const MOCK_MARKET_ANALYTICS_FEES = {
  secondaryFeesUsdt: "18 640,00",
  items: PERIODS.map((period, i) => ({
    period,
    amountUsdt: (900 + i * 80).toLocaleString("ru-RU", { minimumFractionDigits: 2 }),
  })),
  byRelease: [{ releaseId: "r1", feeUsdt: "8 200,00" }],
};

export const MOCK_MARKET_ANALYTICS_DEPTH = {
  releaseId: "r1",
  releaseTitle: "Glass Horizon",
  primaryPriceUsdt: "10,00",
  bestAskUsdt: "11,20",
  spreadPct: 12,
  levels: [
    { pricePerUnitUsdt: "11,20", totalUnits: "4200", totalValueUsdt: "47 040,00", listingsCount: 3 },
    { pricePerUnitUsdt: "12,00", totalUnits: "8000", totalValueUsdt: "96 000,00", listingsCount: 2 },
  ],
  topReleases: [],
  hint: "Стакан показывает активные листинги на продажу.",
};

export const MOCK_MARKET_ANALYTICS_LIQUIDITY = {
  items: [
    {
      releaseId: "r1",
      releaseTitle: "Glass Horizon",
      artistName: "Arctic Line",
      activeListings: 8,
      unitsListed: "42000",
      completedTrades: 92,
      tradeVolumeUsdt: "520 100,00",
      avgPriceUsdt: "12,40",
      lastTradeAt: new Date().toISOString(),
      suspiciousCount: 1,
      liquidityScore: 186,
      primaryPriceUsdt: "10,00",
    },
  ],
};

export const MOCK_MARKET_ANALYTICS_PRICES = {
  avgListingPriceUsdt: "12,10",
  avgTradePriceUsdt: "12,40",
  minTradePriceUsdt: "9,80",
  maxTradePriceUsdt: "18,50",
  outliers: [
    {
      releaseId: "r2",
      releaseTitle: "Midnight Drive",
      tradePriceUsdt: "18,50",
      primaryPriceUsdt: "10,00",
      premiumPct: 85,
    },
  ],
};

export const MOCK_MARKET_ANALYTICS_RISK = {
  suspiciousTrades: [
    {
      tradeId: "t1",
      releaseId: "r1",
      releaseTitle: "Glass Horizon",
      sellerEmail: "a@test.com",
      buyerEmail: "b@test.com",
      grossAmountUsdt: "24 000,00",
      reason: "marked_suspicious",
      status: "suspicious",
      updatedAt: new Date().toISOString(),
    },
  ],
  frozenListings: [
    {
      listingId: "l1",
      releaseTitle: "Echo Chamber",
      sellerEmail: "seller@test.com",
      status: "frozen",
      units: "1200",
    },
  ],
  washTradeSuspects: 0,
};
