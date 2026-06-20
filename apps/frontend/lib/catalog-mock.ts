export type FundingCard = {
  kind: "funding";
  id: string;
  title: string;
  artist: string;
  genre: string;
  status: "open" | "payouts";
  raised: string;
  goal: string;
  pct: number;
  availablePct: string;
  forecastYield: string;
  /** Цена 1 UNT в USDT (формат ru-RU). */
  unitPriceUsdt: string;
  coverUrl?: string | null;
  shortDescription?: string | null;
  riskLabel?: string;
  statusLabel?: string;
  roundStatus?: string;
  purchaseState?: "available" | "sold_out" | "paused" | "unavailable";
  availableUnits?: number;
  payoutFreq?: "monthly" | "biweekly";
  nextPayoutDate?: string | null;
  secondaryMarketEnabled?: boolean;
  activeListingsCount?: number;
  hasSparkline?: boolean;
  hasAudioPreview?: boolean;
  slug?: string;
};

export type MarketCard = {
  kind: "market";
  id: string;
  title: string;
  artist: string;
  genre: string;
  sharePrice: string;
  sharePriceChange: string;
  lastMonthPayout: string;
  coverUrl?: string | null;
  shortDescription?: string | null;
  statusLabel?: string;
  riskLabel?: string;
  activeListingsCount?: number;
  volume24hUsdt?: string;
  volume7dUsdt?: string;
  liquidityLabel?: string;
  secondaryMarketEnabled?: boolean;
  hasSparkline?: boolean;
  hasAudioPreview?: boolean;
  slug?: string;
};

export type CatalogItem = FundingCard | MarketCard;

export const catalogItems: CatalogItem[] = [
  {
    kind: "funding",
    id: "1",
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
    id: "2",
    title: "Glass Echo",
    artist: "North Tide",
    genre: "Indie",
    status: "payouts",
    purchaseState: "sold_out",
    availableUnits: 0,
    roundStatus: "completed",
    raised: "41 200",
    goal: "60 000",
    pct: 69,
    availablePct: "9,2%",
    forecastYield: "8,1%",
    unitPriceUsdt: "45,00",
    coverUrl: "/images/hero-journey/2.webp",
  },
  {
    kind: "market",
    id: "3",
    title: "City Lights",
    artist: "Neon District",
    genre: "Electronic",
    sharePrice: "245,50",
    sharePriceChange: "+2,18%",
    lastMonthPayout: "12,46",
    coverUrl: "/images/catalog/3.png",
  },
  {
    kind: "market",
    id: "7",
    title: "Velvet Line",
    artist: "Kairo West",
    genre: "Hip-hop",
    sharePrice: "189,20",
    sharePriceChange: "−0,42%",
    lastMonthPayout: "9,88",
    coverUrl: "/images/catalog/4.png",
  },
  {
    kind: "market",
    id: "8",
    title: "Blue Hour",
    artist: "Nora Keys",
    genre: "Jazz",
    sharePrice: "312,00",
    sharePriceChange: "+1,05%",
    lastMonthPayout: "15,02",
    coverUrl: "/images/catalog/5.png",
  },
  {
    kind: "funding",
    id: "4",
    title: "Amber Static",
    artist: "Velvet Wire",
    genre: "Pop",
    status: "open",
    purchaseState: "available",
    availableUnits: 800,
    raised: "12 100",
    goal: "40 000",
    pct: 30,
    availablePct: "18%",
    forecastYield: "10,2%",
    unitPriceUsdt: "40,00",
    coverUrl: "/images/catalog/6.png",
  },
  {
    kind: "funding",
    id: "5",
    title: "Riverbed",
    artist: "Cold Atlas",
    genre: "Rock",
    status: "open",
    purchaseState: "available",
    availableUnits: 420,
    raised: "33 900",
    goal: "55 000",
    pct: 62,
    availablePct: "7%",
    forecastYield: "9,4%",
    unitPriceUsdt: "55,00",
    coverUrl: "/images/catalog/7.png",
  },
  {
    kind: "funding",
    id: "6",
    title: "Paper Moon",
    artist: "June & Co",
    genre: "Indie",
    status: "payouts",
    purchaseState: "sold_out",
    availableUnits: 0,
    roundStatus: "completed",
    raised: "52 000",
    goal: "52 000",
    pct: 100,
    availablePct: "0%",
    forecastYield: "6,8%",
    unitPriceUsdt: "52,00",
    coverUrl: "/images/catalog/8.png",
  },
];
