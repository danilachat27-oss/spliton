import { ROUTES, secondaryMarketBookPath } from "@/constants/routes";

export const SECONDARY_MARKET_TAB_IDS = [
  "market",
  "analytics",
  "orders",
  "history",
  "watchlist",
  "rules",
] as const;

export type SecondaryMarketTabId = (typeof SECONDARY_MARKET_TAB_IDS)[number];

/** @deprecated Use `useSecondaryMarketTabs()` for localized labels */
export const SECONDARY_MARKET_TABS = SECONDARY_MARKET_TAB_IDS.map((id) => ({ id }));

/** Тип «страницы» внутри workspace — для бейджа и тона шапки. */
export type SecondaryMarketTabZone = "trading" | "operations" | "ledger" | "research" | "reference";

export type SecondaryMarketTabPageMeta = {
  /** Заголовок вкладки браузера (без суффикса продукта). */
  documentTitle: string;
  zone: SecondaryMarketTabZone;
  /** Короткий бейдж над заголовком. */
  zoneLabel: string;
  /** Крупный заголовок текущей поверхности. */
  surfaceTitle: string;
  surfaceSubtitle: string;
};

const TAB_ZONE: Record<SecondaryMarketTabId, SecondaryMarketTabZone> = {
  market: "trading",
  analytics: "trading",
  orders: "operations",
  history: "ledger",
  watchlist: "research",
  rules: "reference",
};

/** Zone mapping only — localized copy via `useSecondaryMarketPageMeta()`. */
export const SECONDARY_MARKET_TAB_META: Record<SecondaryMarketTabId, Pick<SecondaryMarketTabPageMeta, "zone">> =
  Object.fromEntries(SECONDARY_MARKET_TAB_IDS.map((id) => [id, { zone: TAB_ZONE[id] }])) as Record<
    SecondaryMarketTabId,
    Pick<SecondaryMarketTabPageMeta, "zone">
  >;

/** Валидный `tab` из query для `/dashboard/secondary-market`. Раньше был отдельный `book` — считаем как «Рынок». */
export function parseSecondaryMarketTabParam(raw: string | null): SecondaryMarketTabId | null {
  if (!raw) return null;
  if (raw === "book") return "market";
  return (SECONDARY_MARKET_TAB_IDS as readonly string[]).includes(raw) ? (raw as SecondaryMarketTabId) : null;
}

/** Mock id стакана (совпадает с `BOOK_MARKETS` в компоненте стакана). */
export type SecondaryBookMarketId = "mnr" | "sgn" | "vlt";

export function isSecondaryBookMarketQuery(raw: string | null): raw is SecondaryBookMarketId {
  return raw === "mnr" || raw === "sgn" || raw === "vlt";
}

const SYMBOL_TO_BOOK: Record<string, SecondaryBookMarketId> = {
  MNR: "mnr",
  SGN: "sgn",
  VLT: "vlt",
};

/** Символ листинга → id стакана; `null`, если отдельного стакана в макете нет. */
export function secondaryMarketBookIdForSymbol(symbol: string): SecondaryBookMarketId | null {
  return SYMBOL_TO_BOOK[symbol] ?? null;
}

/** Ссылка на вкладку вторичного рынка с query. */
export function secondaryMarketHref(
  tab: SecondaryMarketTabId,
  opts?: { market?: SecondaryBookMarketId | string; release?: string },
): string {
  const p = new URLSearchParams();
  p.set("tab", tab);
  if (opts?.market) p.set("market", String(opts.market));
  if (opts?.release) p.set("release", String(opts.release));
  return `${ROUTES.dashboardSecondaryMarket}?${p.toString()}`;
}

/** Стакан выбранного инструмента — отдельная страница терминала. */
export function secondaryMarketBookHref(marketId: SecondaryBookMarketId | string): string {
  return secondaryMarketBookPath(String(marketId));
}
