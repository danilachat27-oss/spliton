import { Injectable, Logger } from '@nestjs/common';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  staleUntil: number;
};

export type TtlCacheGetOrSetOptions = {
  /** Serve expired entries while refreshing (default: same as fresh TTL). */
  staleTtlMs?: number;
};

/**
 * Process-local TTL cache with single-flight coalescing and stale-while-revalidate.
 * Not suitable for balances, orders, or any post-mutation reads.
 */
@Injectable()
export class TtlCacheService {
  private readonly logger = new Logger(TtlCacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  async getOrSet<T>(
    key: string,
    ttlMs: number,
    factory: () => Promise<T>,
    options?: TtlCacheGetOrSetOptions,
  ): Promise<T> {
    const now = Date.now();
    const staleTtlMs = options?.staleTtlMs ?? ttlMs;
    const hit = this.store.get(key) as CacheEntry<T> | undefined;

    if (hit && hit.expiresAt > now) {
      return hit.value;
    }

    if (hit && hit.staleUntil > now) {
      this.scheduleBackgroundRefresh(key, ttlMs, staleTtlMs, factory, hit);
      return hit.value;
    }

    return this.fetchSingleFlight(key, ttlMs, staleTtlMs, factory, hit);
  }

  invalidate(key: string): void {
    this.store.delete(key);
    this.inFlight.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        this.inFlight.delete(key);
      }
    }
  }

  private scheduleBackgroundRefresh<T>(
    key: string,
    ttlMs: number,
    staleTtlMs: number,
    factory: () => Promise<T>,
    fallback: CacheEntry<T>,
  ): void {
    if (this.inFlight.has(key)) return;
    void this.fetchSingleFlight(key, ttlMs, staleTtlMs, factory, fallback).catch(
      (err) => {
        this.logger.warn(
          `TTL cache background refresh failed for ${key}: ${
            err instanceof Error ? err.message : err
          }`,
        );
      },
    );
  }

  private fetchSingleFlight<T>(
    key: string,
    ttlMs: number,
    staleTtlMs: number,
    factory: () => Promise<T>,
    fallback?: CacheEntry<T>,
  ): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const promise = this.runFactory(
      key,
      ttlMs,
      staleTtlMs,
      factory,
      fallback,
    ).finally(() => {
      if (this.inFlight.get(key) === promise) {
        this.inFlight.delete(key);
      }
    });
    this.inFlight.set(key, promise);
    return promise;
  }

  private async runFactory<T>(
    key: string,
    ttlMs: number,
    staleTtlMs: number,
    factory: () => Promise<T>,
    fallback?: CacheEntry<T>,
  ): Promise<T> {
    const now = Date.now();
    try {
      const value = await factory();
      this.store.set(key, {
        value,
        expiresAt: now + ttlMs,
        staleUntil: now + ttlMs + staleTtlMs,
      });
      return value;
    } catch (err) {
      const current = (fallback ?? this.store.get(key)) as
        | CacheEntry<T>
        | undefined;
      if (current && current.staleUntil > now) {
        this.logger.warn(
          `TTL cache stale fallback for ${key}: ${
            err instanceof Error ? err.message : err
          }`,
        );
        return current.value;
      }
      throw err;
    }
  }
}
