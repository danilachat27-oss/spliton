import type { CatalogItem } from "@/lib/catalog-mock";
import { catalogItemAvailabilityPriority } from "@/lib/catalog/catalog-purchase.util";
import type { CatalogFundingPhase, CatalogGridView, CatalogKindFilter, CatalogSortKey } from "@/types/catalog/page";

export type NumericRangeValidation = {
  min?: number;
  max?: number;
  invalid: boolean;
};

function parseOptionalNonNegative(raw: string | undefined): number | undefined {
  if (raw == null || !raw.trim()) return undefined;
  const normalized = raw.replace(/\s/g, "").replace(",", ".").trim();
  if (!normalized) return undefined;
  const n = Number.parseFloat(normalized);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

export function validateNumericRange(minRaw?: string, maxRaw?: string): NumericRangeValidation {
  const min = parseOptionalNonNegative(minRaw);
  const max = parseOptionalNonNegative(maxRaw);
  if (min != null && max != null && min > max) {
    return { invalid: true };
  }
  return { min, max, invalid: false };
}

export function catalogGridClass(view: CatalogGridView) {
  if (view === "list") {
    return "mx-auto flex w-full max-w-5xl flex-col gap-2 sm:gap-2.5";
  }
  return "grid grid-cols-1 items-start gap-6 sm:grid-cols-2 sm:gap-8 lg:gap-10 xl:grid-cols-2 2xl:grid-cols-3";
}

function parseYieldPct(item: CatalogItem): number {
  if (item.kind !== "funding") return -1;
  const n = parseFloat(item.forecastYield.replace("%", "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function parseSharePrice(item: CatalogItem): number {
  if (item.kind !== "market") return 0;
  const n = parseFloat(item.sharePrice.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function catalogMatchesFilters(
  item: CatalogItem,
  filters: {
    kind: CatalogKindFilter;
    phase: CatalogFundingPhase;
    genre: string;
    query: string;
    minPrice: string;
    maxPrice: string;
    minProgress: string;
    minYield: string;
  },
): boolean {
  const { kind, phase, genre, query, minPrice, maxPrice, minProgress, minYield } = filters;
  if (kind === "funding" && item.kind !== "funding") return false;
  if (kind === "market" && item.kind !== "market") return false;
  if (item.kind === "funding" && (kind === "all" || kind === "funding")) {
    if (phase === "open" && item.status !== "open") return false;
    if (phase === "payouts" && item.status !== "payouts") return false;
  }
  if (genre && item.genre !== genre) return false;
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = `${item.title} ${item.artist}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }

  const priceRange = validateNumericRange(minPrice, maxPrice);
  if (priceRange.invalid) return false;

  const minPriceValue = priceRange.min ?? NaN;
  const maxPriceValue = priceRange.max ?? NaN;
  const minProgressValue = parseFloat(minProgress.replace(/\s/g, "").replace(",", "."));
  const minYieldValue = parseFloat(minYield.replace(/\s/g, "").replace(",", "."));

  if (item.kind === "market") {
    const price = parseSharePrice(item);
    if (Number.isFinite(minPriceValue) && price < minPriceValue) return false;
    if (Number.isFinite(maxPriceValue) && price > maxPriceValue) return false;
  }

  if (item.kind === "funding") {
    if (Number.isFinite(minProgressValue) && item.pct < minProgressValue) return false;
    const yieldPct = parseYieldPct(item);
    if (Number.isFinite(minYieldValue) && yieldPct < minYieldValue) return false;
  }

  return true;
}

function compareWithAvailabilityTier(
  a: CatalogItem,
  b: CatalogItem,
  secondary: (left: CatalogItem, right: CatalogItem) => number,
): number {
  const tierDiff = catalogItemAvailabilityPriority(a) - catalogItemAvailabilityPriority(b);
  if (tierDiff !== 0) return tierDiff;
  return secondary(a, b);
}

export function sortCatalogItems(items: CatalogItem[], sort: CatalogSortKey, catalogOrder: Map<string, number>): CatalogItem[] {
  const arr = [...items];
  if (sort === "catalog_order") {
    arr.sort((a, b) =>
      compareWithAvailabilityTier(a, b, (left, right) =>
        (catalogOrder.get(left.id) ?? 0) - (catalogOrder.get(right.id) ?? 0),
      ),
    );
    return arr;
  }
  if (sort === "title_asc") {
    arr.sort((a, b) =>
      compareWithAvailabilityTier(a, b, (left, right) =>
        left.title.localeCompare(right.title, "ru", { sensitivity: "base" }),
      ),
    );
    return arr;
  }
  if (sort === "progress_desc") {
    arr.sort((a, b) =>
      compareWithAvailabilityTier(a, b, (left, right) => {
        const pa = left.kind === "funding" ? left.pct : -1;
        const pb = right.kind === "funding" ? right.pct : -1;
        if (pa !== pb) return pb - pa;
        return parseSharePrice(right) - parseSharePrice(left);
      }),
    );
    return arr;
  }
  if (sort === "yield_desc") {
    arr.sort((a, b) =>
      compareWithAvailabilityTier(a, b, (left, right) => {
        const ya = parseYieldPct(left);
        const yb = parseYieldPct(right);
        if (ya !== yb) return yb - ya;
        return (catalogOrder.get(left.id) ?? 0) - (catalogOrder.get(right.id) ?? 0);
      }),
    );
    return arr;
  }
  return arr;
}
