import type { FundingCard } from "@/lib/catalog-mock";

export const HERO_JOURNEY_RELEASE = {
  title: "Midnight Code",
  artist: "Vera Kline",
  symbol: "MD2145",
  cover: "/images/hero-journey/1.webp",
  unitPrice: "22,00",
  units: "120",
  askPrice: "1,0260",
} as const;

/** Три релиза для сцены каталога — фото из /images/hero-journey. */
export const HERO_JOURNEY_CATALOG_ITEMS: FundingCard[] = [
  {
    kind: "funding",
    id: "hero-1",
    slug: "midnight-code",
    title: "Midnight Code",
    artist: "Vera Kline",
    genre: "Pop",
    status: "open",
    purchaseState: "available",
    availableUnits: 1200,
    raised: "143 000",
    goal: "220 000",
    pct: 65,
    availablePct: "Высокая",
    forecastYield: "10,1%",
    unitPriceUsdt: "22,00",
    coverUrl: "/images/hero-journey/1.webp",
  },
  {
    kind: "funding",
    id: "hero-2",
    title: "Glass Echo",
    artist: "North Tide",
    genre: "Indie",
    status: "open",
    purchaseState: "available",
    raised: "28 450",
    goal: "50 000",
    pct: 57,
    availablePct: "12%",
    forecastYield: "8,7%",
    unitPriceUsdt: "50,00",
    coverUrl: "/images/hero-journey/2.webp",
  },
  {
    kind: "funding",
    id: "hero-3",
    title: "City Lights",
    artist: "Neon District",
    genre: "Electronic",
    status: "open",
    purchaseState: "available",
    raised: "86 400",
    goal: "120 000",
    pct: 72,
    availablePct: "Средняя",
    forecastYield: "9,4%",
    unitPriceUsdt: "38,00",
    coverUrl: "/images/hero-journey/3.webp",
  },
];

export const HERO_JOURNEY_BOOK = {
  symbol: "MD2145",
  track: "Midnight Code",
  artist: "Vera Kline",
  asks: [
    { price: 1.031, units: 420 },
    { price: 1.0295, units: 890 },
    { price: 1.028, units: 560 },
  ],
  bids: [
    { price: 1.024, units: 1080 },
    { price: 1.0225, units: 740 },
    { price: 1.021, units: 560 },
  ],
} as const;
