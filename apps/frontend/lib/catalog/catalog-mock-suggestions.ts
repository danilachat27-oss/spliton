import type { CatalogSearchSuggestionItem } from "@/types/catalog/page";
import { catalogItems } from "@/lib/catalog-mock";

export function buildMockCatalogSuggestions(
  q: string,
  limit = 8,
): CatalogSearchSuggestionItem[] {
  const term = q.trim().toLowerCase();
  if (term.length < 2) return [];

  const items: CatalogSearchSuggestionItem[] = [];
  const seen = new Set<string>();

  for (const entry of catalogItems) {
    if (items.length >= limit) break;
    const haystack = `${entry.title} ${entry.artist} ${entry.genre}`.toLowerCase();
    if (!haystack.includes(term)) continue;
    const key = `${entry.kind}:${entry.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      type: "release",
      label: entry.title,
      value: entry.title,
      subtitle: entry.artist,
      releaseId: entry.id,
      slug: entry.slug ?? null,
      score: 1,
      ...(entry.kind === "funding"
        ? {
            purchaseState: entry.purchaseState,
            canPurchase: entry.purchaseState === "available",
          }
        : {}),
    });
  }

  return items;
}
