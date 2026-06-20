export type AssetsStat = {
  label: string;
  value: string;
};

export type AssetsActivity = {
  id: string;
  type: string;
  detail: string;
  amount: string;
  date: string;
};

export type UpcomingDistribution = {
  id: string;
  release: string;
  eta: string;
  amount: string;
};

export type PositionPreviewItem = {
  id: string;
  release: string;
  artist: string;
  genre: "Electronic" | "Pop" | "Hip-Hop" | "Indie" | "Ambient";
  units: string;
  status: "Active" | "Open round" | "Secondary" | "Closed";
  share: string;
  value: string;
  dateEntered: string;
  /** Id строки каталога / обзора рынка — маршрут продажи `/assets/sell/{id}` и прайс из данных релиза. */
  catalogReleaseId?: string;
  /** Целое число units в позиции (лимит формы «продать»). */
  heldUnits?: number;
  /** Остаток units, доступный для продажи/вывода (если пришло от API). */
  availableUnits?: number;
  /** Признак доступности продажи. */
  availableToSell?: boolean;
  /** Возможность докупить units в позиции. */
  canBuyMore?: boolean;
};

export type PositionStructureItem = {
  label: string;
  value: string;
  percent: number;
};

export const assetsStats: AssetsStat[] = [
  { label: "Активных релизов", value: "6" },
  { label: "Всего позиций", value: "9" },
  { label: "Всего UNT", value: "14 280" },
  { label: "Крупнейшая позиция", value: "24%" },
];

export const recentActivity: AssetsActivity[] = [];

export const upcomingDistributions: UpcomingDistribution[] = [];

export const positionPreviews: PositionPreviewItem[] = [
  {
    id: "p1",
    catalogReleaseId: "1",
    heldUnits: 3420,
    release: "Neon Drift",
    artist: "Metro Lights",
    genre: "Electronic",
    units: "3 420",
    status: "Active",
    share: "24%",
    value: "2 180 USDT",
    dateEntered: "12.03.2026",
  },
  {
    id: "p2",
    catalogReleaseId: "2",
    heldUnits: 2860,
    release: "Static Bloom",
    artist: "Nika Vera",
    genre: "Pop",
    units: "2 860",
    status: "Secondary",
    share: "18%",
    value: "1 650 USDT",
    dateEntered: "05.02.2026",
  },
  {
    id: "p3",
    catalogReleaseId: "3",
    heldUnits: 2100,
    release: "Low Tide FM",
    artist: "Coastline",
    genre: "Hip-Hop",
    units: "2 100",
    status: "Open round",
    share: "14%",
    value: "1 130 USDT",
    dateEntered: "26.03.2026",
  },
  {
    id: "p4",
    catalogReleaseId: "4",
    heldUnits: 1720,
    release: "Cipher Walk",
    artist: "YGT",
    genre: "Hip-Hop",
    units: "1 720",
    status: "Active",
    share: "11%",
    value: "920 USDT",
    dateEntered: "17.01.2026",
  },
  {
    id: "p5",
    catalogReleaseId: "5",
    heldUnits: 1180,
    release: "Glass Hours",
    artist: "Anka Row",
    genre: "Indie",
    units: "1 180",
    status: "Closed",
    share: "8%",
    value: "640 USDT",
    dateEntered: "09.11.2025",
  },
];

export const statusStructure: PositionStructureItem[] = [
  { label: "Active", value: "4 releases", percent: 46 },
  { label: "Open round", value: "1 release", percent: 18 },
  { label: "Secondary", value: "1 release", percent: 24 },
  { label: "Closed", value: "3 releases", percent: 12 },
];

export const genreStructure: PositionStructureItem[] = [
  { label: "Electronic", value: "34%", percent: 34 },
  { label: "Pop", value: "26%", percent: 26 },
  { label: "Hip-Hop", value: "18%", percent: 18 },
  { label: "Ambient", value: "12%", percent: 12 },
  { label: "Indie", value: "10%", percent: 10 },
];
