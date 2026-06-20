import { TtlCacheService } from './ttl-cache.service';

describe('TtlCacheService', () => {
  it('returns cached value within TTL', async () => {
    const cache = new TtlCacheService();
    let calls = 0;
    const factory = async () => {
      calls += 1;
      return { n: calls };
    };
    const a = await cache.getOrSet('k', 60_000, factory);
    const b = await cache.getOrSet('k', 60_000, factory);
    expect(a).toEqual({ n: 1 });
    expect(b).toEqual({ n: 1 });
    expect(calls).toBe(1);
  });

  it('coalesces concurrent cache misses (single-flight)', async () => {
    const cache = new TtlCacheService();
    let calls = 0;
    const factory = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 50));
      return calls;
    };
    const results = await Promise.all(
      Array.from({ length: 30 }, () =>
        cache.getOrSet('stampede', 60_000, factory),
      ),
    );
    expect(new Set(results)).toEqual(new Set([1]));
    expect(calls).toBe(1);
  });

  it('serves stale value while revalidating after fresh TTL', async () => {
    const cache = new TtlCacheService();
    let calls = 0;
    const factory = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 30));
      return calls;
    };
    await cache.getOrSet('stale', 10, factory, { staleTtlMs: 60_000 });
    await new Promise((r) => setTimeout(r, 15));

    const fast = await cache.getOrSet('stale', 10, factory, { staleTtlMs: 60_000 });
    expect(fast).toBe(1);

    await new Promise((r) => setTimeout(r, 60));
    expect(calls).toBe(2);
  });

  it('returns stale value when factory fails within stale window', async () => {
    const cache = new TtlCacheService();
    await cache.getOrSet('err', 10, async () => ({ ok: true }), {
      staleTtlMs: 60_000,
    });
    await new Promise((r) => setTimeout(r, 15));

    const value = await cache.getOrSet(
      'err',
      10,
      async () => {
        throw new Error('pool timeout');
      },
      { staleTtlMs: 60_000 },
    );
    expect(value).toEqual({ ok: true });
  });

  it('rethrows when factory fails and no stale entry exists', async () => {
    const cache = new TtlCacheService();
    await expect(
      cache.getOrSet('cold', 60_000, async () => {
        throw new Error('db down');
      }),
    ).rejects.toThrow('db down');
  });
});
