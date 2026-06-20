import { Injectable } from '@nestjs/common';
import { TtlCacheService } from '../../cache/ttl-cache.service';
import { CATALOG_CACHE_KEYS } from '../../../modules/catalog/catalog-cache.constants';

/** Centralized cache busting after domain mutations. */
@Injectable()
export class CacheInvalidationService {
  constructor(private readonly cache: TtlCacheService) {}

  onCatalogOrMarketChange(): void {
    this.cache.invalidate(CATALOG_CACHE_KEYS.releasesDefault);
    this.cache.invalidatePrefix(CATALOG_CACHE_KEYS.releasesPrefix);
    this.cache.invalidate(CATALOG_CACHE_KEYS.stats);
    this.cache.invalidatePrefix(CATALOG_CACHE_KEYS.filtersPrefix);
    this.cache.invalidatePrefix('analytics:releases:');
    this.cache.invalidatePrefix('market:overview:');
    this.cache.invalidatePrefix('market:charts:');
  }

  onSecondaryTrade(): void {
    this.onCatalogOrMarketChange();
    this.cache.invalidatePrefix('portfolio:charts:');
  }

  onPrimaryPurchase(): void {
    this.onCatalogOrMarketChange();
    this.cache.invalidatePrefix('portfolio:charts:');
  }

  onNewsPublish(): void {
    this.cache.invalidatePrefix('news:');
  }

  onSystemStatusChange(): void {
    this.cache.invalidate('system-status:snapshot');
  }

  onAdminDashboardChange(): void {
    this.cache.invalidatePrefix('admin:dashboard:');
    this.cache.invalidatePrefix('admin:analytics:');
  }
}
