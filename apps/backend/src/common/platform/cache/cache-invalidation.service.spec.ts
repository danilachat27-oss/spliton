import { TtlCacheService } from '../../cache/ttl-cache.service';
import {
  CATALOG_CACHE_KEYS,
  catalogFiltersCacheKey,
} from '../../../modules/catalog/catalog-cache.constants';
import { CacheInvalidationService } from './cache-invalidation.service';

describe('CacheInvalidationService', () => {
  it('invalidates catalog releases default, stats, and filter caches', async () => {
    const cache = new TtlCacheService();
    const invalidation = new CacheInvalidationService(cache);

    let releaseCalls = 0;
    let statsCalls = 0;
    let filterCalls = 0;

    await cache.getOrSet(CATALOG_CACHE_KEYS.releasesDefault, 60_000, async () => {
      releaseCalls += 1;
      return { items: [] };
    });
    await cache.getOrSet(CATALOG_CACHE_KEYS.stats, 60_000, async () => {
      statsCalls += 1;
      return { publicReleases: 1 };
    });
    await cache.getOrSet(catalogFiltersCacheKey('all'), 60_000, async () => {
      filterCalls += 1;
      return { genres: [] };
    });

    expect(releaseCalls).toBe(1);
    expect(statsCalls).toBe(1);
    expect(filterCalls).toBe(1);

    invalidation.onCatalogOrMarketChange();

    await cache.getOrSet(CATALOG_CACHE_KEYS.releasesDefault, 60_000, async () => {
      releaseCalls += 1;
      return { items: [] };
    });
    await cache.getOrSet(CATALOG_CACHE_KEYS.stats, 60_000, async () => {
      statsCalls += 1;
      return { publicReleases: 2 };
    });
    await cache.getOrSet(catalogFiltersCacheKey('all'), 60_000, async () => {
      filterCalls += 1;
      return { genres: [] };
    });

    expect(releaseCalls).toBe(2);
    expect(statsCalls).toBe(2);
    expect(filterCalls).toBe(2);
  });

  it('invalidates all catalog release query variants via prefix', async () => {
    const cache = new TtlCacheService();
    const invalidation = new CacheInvalidationService(cache);

    let customCalls = 0;
    await cache.getOrSet(`${CATALOG_CACHE_KEYS.releasesPrefix}custom`, 60_000, async () => {
      customCalls += 1;
      return { items: [] };
    });

    invalidation.onCatalogOrMarketChange();

    await cache.getOrSet(`${CATALOG_CACHE_KEYS.releasesPrefix}custom`, 60_000, async () => {
      customCalls += 1;
      return { items: [] };
    });

    expect(customCalls).toBe(2);
  });
});
