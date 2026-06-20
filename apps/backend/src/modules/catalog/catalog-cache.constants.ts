/** Process-local TTL cache keys for public catalog reads. */
export const CATALOG_CACHE_KEYS = {
  releasesPrefix: 'catalog:releases:',
  releasesDefault: 'catalog:releases:default',
  stats: 'catalog:stats',
  filtersPrefix: 'catalog:filters:',
} as const;

export function catalogFiltersCacheKey(kind: string): string {
  return `${CATALOG_CACHE_KEYS.filtersPrefix}${kind || 'all'}`;
}
