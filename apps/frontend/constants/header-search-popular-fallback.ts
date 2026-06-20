import { ROUTES } from "@/constants/routes";
import { catalogBuyUnitsPath } from "@/constants/routes";

export type HeaderPopularQuery = {
  id: string;
  rank: number;
  label: string;
  subtitle: string;
  href: string;
  priceLabel: string;
  changePct: number;
  hot?: boolean;
  coverUrl?: string | null;
};

/** Fallback, если API top-releases недоступен. */
export const HEADER_SEARCH_POPULAR_FALLBACK: HeaderPopularQuery[] = [
  {
    id: "pop-1",
    rank: 1,
    label: "MIDNIGHT/USDT",
    subtitle: "Midnight Pulse",
    href: catalogBuyUnitsPath("midnight-pulse"),
    priceLabel: "0,42",
    changePct: 2.4,
    hot: true,
  },
  {
    id: "pop-2",
    rank: 2,
    label: "NEON/USDT",
    subtitle: "Neon District",
    href: catalogBuyUnitsPath("neon-district"),
    priceLabel: "0,18",
    changePct: 1.1,
    hot: true,
  },
  {
    id: "pop-3",
    rank: 3,
    label: "WAVE/USDT",
    subtitle: "Coastal Wave",
    href: catalogBuyUnitsPath("coastal-wave"),
    priceLabel: "0,65",
    changePct: -0.8,
    hot: true,
  },
  {
    id: "pop-4",
    rank: 4,
    label: "Каталог",
    subtitle: "Все релизы Spliton",
    href: ROUTES.dashboardCatalog,
    priceLabel: "—",
    changePct: 0,
  },
  {
    id: "pop-5",
    rank: 5,
    label: "Secondary",
    subtitle: "Вторичный рынок",
    href: ROUTES.dashboardSecondaryMarket,
    priceLabel: "—",
    changePct: 0.4,
  },
  {
    id: "pop-6",
    rank: 6,
    label: "Выплаты",
    subtitle: "История revenue share",
    href: ROUTES.dashboardPayoutsHistory,
    priceLabel: "—",
    changePct: 0,
  },
  {
    id: "pop-7",
    rank: 7,
    label: "Статус",
    subtitle: "Сервисы платформы",
    href: ROUTES.systemStatus,
    priceLabel: "—",
    changePct: 0,
  },
];
