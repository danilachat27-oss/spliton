import { secondaryMarketBookHref, secondaryMarketBookIdForSymbol } from "@/constants/dashboard/secondary-market";

/**
 * Листинги вторичного рынка (макет). `analyticsCatalogId` совпадает с id строки
 * `MARKET_OVERVIEW_ROWS` / аналитики релизов, чтобы ссылки «Аналитика» открывали реальную страницу.
 */
export type SecondaryMarketListingGenre = "electronic" | "pop" | "hiphop" | "rock";

export type SecondaryMarketListingMock = {
  id: string;
  /** Slug релиза в каталоге (карточки buy и т.п.). */
  releaseId: string;
  /** Id строки в `RELEASE_ANALYTICS_ROWS_MOCK` / обзоре рынка (`"1"` … `"10"`). */
  analyticsCatalogId: string;
  symbol: string;
  track: string;
  artist: string;
  genre: SecondaryMarketListingGenre;
  pricePerUnit: number;
  change7dPct: number;
  payoutSparkline: number[];
  range7dLow: number;
  range7dHigh: number;
  listingValueUsdt: number;
  unitsAvailable: number;
  deals7d: number;
  liquidity: "high" | "med" | "low";
  featured?: boolean;
  /** Короткий текст «от продавца» для экрана Инфо. */
  listingNote: string;
  /** Public API listing status (live). Demo defaults to active when omitted. */
  status?: string;
  statusLabel?: string;
  canBuy?: boolean;
  canCancel?: boolean;
};

export const SECONDARY_MARKET_LISTINGS_MOCK: SecondaryMarketListingMock[] = [
  {
    id: "lst-mnr",
    releaseId: "midnight-run",
    analyticsCatalogId: "1",
    symbol: "MNR",
    track: "Midnight Run",
    artist: "Nova Lane",
    genre: "electronic",
    pricePerUnit: 18.4,
    change7dPct: 2.1,
    payoutSparkline: [0.35, 0.42, 0.4, 0.48, 0.52, 0.5, 0.58, 0.62, 0.6, 0.68],
    range7dLow: 17.2,
    range7dHigh: 19.1,
    listingValueUsdt: 2208,
    unitsAvailable: 120,
    deals7d: 14,
    liquidity: "high",
    featured: true,
    listingNote:
      "Лимитный лот на вторичке: цена за unit, объём и срок размещения задаются в рамках предложения. Данные и стакан — демо Spliton.",
  },
  {
    id: "lst-gls",
    releaseId: "glassline",
    analyticsCatalogId: "5",
    symbol: "GLS",
    track: "Glassline",
    artist: "The Static",
    genre: "rock",
    pricePerUnit: 9.05,
    change7dPct: -0.8,
    payoutSparkline: [0.55, 0.52, 0.54, 0.5, 0.48, 0.51, 0.47, 0.45, 0.46, 0.44],
    range7dLow: 8.6,
    range7dHigh: 9.4,
    listingValueUsdt: 724,
    unitsAvailable: 80,
    deals7d: 6,
    liquidity: "med",
    featured: true,
    listingNote:
      "Витринный лот: исполнение и settlement — по правилам площадки. Перед сделкой посмотрите карточку релиза и ликвидность.",
  },
  {
    id: "lst-sgn",
    releaseId: "signal-noise",
    analyticsCatalogId: "9",
    symbol: "SGN",
    track: "Signal / Noise",
    artist: "Kairo",
    genre: "hiphop",
    pricePerUnit: 22.1,
    change7dPct: 4.6,
    payoutSparkline: [0.22, 0.28, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.62, 0.7],
    range7dLow: 20.5,
    range7dHigh: 22.8,
    listingValueUsdt: 884,
    unitsAvailable: 40,
    deals7d: 22,
    liquidity: "high",
    featured: true,
    listingNote:
      "Высокая активность по сделкам за 7д. Параметры лота отражают текущее предложение; комиссии см. в правилах рынка.",
  },
  {
    id: "lst-aur",
    releaseId: "aurora-drift",
    analyticsCatalogId: "10",
    symbol: "AUR",
    track: "Aurora Drift",
    artist: "Mira Sol",
    genre: "pop",
    pricePerUnit: 11.25,
    change7dPct: 0.4,
    payoutSparkline: [0.5, 0.51, 0.49, 0.52, 0.5, 0.53, 0.52, 0.54, 0.53, 0.55],
    range7dLow: 10.9,
    range7dHigh: 11.6,
    listingValueUsdt: 1688,
    unitsAvailable: 150,
    deals7d: 9,
    liquidity: "med",
    listingNote:
      "Средняя ликвидность: смотрите диапазон цен за 7д и выплаты в карточке привязанного релиза.",
  },
  {
    id: "lst-vlt",
    releaseId: "velvet-room",
    analyticsCatalogId: "6",
    symbol: "VLT",
    track: "Velvet Room",
    artist: "June & Co",
    genre: "pop",
    pricePerUnit: 6.8,
    change7dPct: -2.3,
    payoutSparkline: [0.7, 0.65, 0.66, 0.62, 0.6, 0.58, 0.55, 0.52, 0.5, 0.48],
    range7dLow: 6.5,
    range7dHigh: 7.2,
    listingValueUsdt: 408,
    unitsAvailable: 60,
    deals7d: 3,
    liquidity: "low",
    listingNote:
      "Узкий стакан в макете: заявки и глубина носят иллюстративный характер. Условия предложения задаются в рамках этого лота.",
  },
  {
    id: "lst-cld",
    releaseId: "closed-echo",
    analyticsCatalogId: "2",
    symbol: "CLD",
    track: "Closed Echo",
    artist: "Demo Archive",
    genre: "rock",
    pricePerUnit: 12.5,
    change7dPct: 0,
    payoutSparkline: [0.5, 0.5, 0.5, 0.5, 0.5],
    range7dLow: 12.5,
    range7dHigh: 12.5,
    listingValueUsdt: 625,
    unitsAvailable: 0,
    deals7d: 0,
    liquidity: "low",
    listingNote: "Демо-лот: продан полностью, недоступен к покупке.",
    status: "sold_out",
    canBuy: false,
  },
];

export function getSecondaryMarketListingById(id: string): SecondaryMarketListingMock | undefined {
  return SECONDARY_MARKET_LISTINGS_MOCK.find((r) => r.id === id);
}

export function getSecondaryMarketListingByReleaseId(
  releaseId: string,
): SecondaryMarketListingMock | undefined {
  return SECONDARY_MARKET_LISTINGS_MOCK.find((r) => r.releaseId === releaseId);
}

export function isSecondaryMarketReleaseIdKnown(releaseId: string): boolean {
  return SECONDARY_MARKET_LISTINGS_MOCK.some((r) => r.releaseId === releaseId);
}

/** Листинг вторички, привязанный к id строки каталога / аналитики (если есть в макете). */
export function getSecondaryMarketListingByAnalyticsCatalogId(
  catalogId: string,
): SecondaryMarketListingMock | undefined {
  return SECONDARY_MARKET_LISTINGS_MOCK.find((l) => l.analyticsCatalogId === catalogId);
}

/** Id строки аналитики (`/analytics/releases/{id}`) по slug релиза из макетов вторички. */
export function getSecondaryMarketAnalyticsCatalogIdForReleaseSlug(slug: string): string {
  const hit = SECONDARY_MARKET_LISTINGS_MOCK.find((r) => r.releaseId === slug);
  return hit?.analyticsCatalogId ?? "1";
}

/** URL стакана вторички (`tab=market&market=…`), если листинг с таким id аналитики есть и у символа есть стакан в макете. */
export function getSecondaryMarketStackHrefForAnalyticsCatalogId(catalogId: string): string | undefined {
  const listing = SECONDARY_MARKET_LISTINGS_MOCK.find((l) => l.analyticsCatalogId === catalogId);
  if (!listing) return undefined;
  const bookId = secondaryMarketBookIdForSymbol(listing.symbol);
  return bookId ? secondaryMarketBookHref(bookId) : undefined;
}

export type SecondaryMarketListingTradeMock = {
  time: string;
  side: "buy" | "sell";
  price: number;
  units: number;
  notionalUsdt: number;
};

/** Детерминированные «сделки по лоту» для карточки листинга (макет). */
export function getSecondaryMarketListingTradesMock(listing: SecondaryMarketListingMock): SecondaryMarketListingTradeMock[] {
  const seed = listing.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = listing.pricePerUnit;
  const sides: Array<"buy" | "sell"> = ["buy", "sell", "buy", "sell", "buy", "buy", "sell", "buy"];
  return sides.map((side, i) => {
    const jitter = (((seed + i * 17) % 11) - 5) * 0.015;
    const price = Math.round((base + jitter + (side === "sell" ? 0.02 : -0.01)) * 100) / 100;
    const units = 4 + ((seed + i * 3) % 18);
    const notionalUsdt = Math.round(price * units * 100) / 100;
    const m = 58 - i * 6;
    const time = `${String(11 + Math.floor(i / 2)).padStart(2, "0")}:${String((m + 60) % 60).padStart(2, "0")}`;
    return { time, side, price, units, notionalUsdt };
  });
}
