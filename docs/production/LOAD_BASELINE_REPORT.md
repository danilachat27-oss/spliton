# Load Baseline Report — Spliton (2026-06-16)

Local API `http://localhost:4001`, shared Supabase pooler, `LOAD_TEST_MODE=true`, `THROTTLE_LIMIT=5000`.

## Commands

```powershell
$env:LOAD_TEST_MODE="true"
$env:THROTTLE_LIMIT="5000"
$env:LOAD_BASELINE_REPORT_PATH="logs/load-baseline-after-read10.json"
node scripts/load-baseline.mjs --mode=smoke
node scripts/load-baseline.mjs --mode=read10
node scripts/load-baseline.mjs --mode=read30 --vus=30 --duration=180
```

Modes: `smoke` (2 VU), `read10` (10 VU, 120s), `read30` (30 VU, 180s), `stress` (50 VU, opt-in).

## Before optimization (read-heavy, 10 VU, 120s)

| Endpoint | RPS | p50 | p95 | p99 | 2xx % | Notes |
|----------|-----|-----|-----|-----|-------|-------|
| catalog_releases | 10.98 | 3.9ms | 6.6ms | 26.5ms | 100 | SQL search + 60s TTL cache |
| market_overview | 8.85 | 4.6ms | 10.3ms | 11200ms* | 100 | *cold SQL outlier |
| platform_fees | 11.13 | 3.7ms | 9.2ms | 324ms | 100 | cached |
| system_status | 10.95 | 3.3ms | 6.6ms | 325ms | 100 | cached |

## Stress signal (30 VU, 180s) — pool limit

| Endpoint | 2xx % | 5xx/503 | Notes |
|----------|-------|---------|-------|
| health / catalog / filters | 100 | 0 | OK |
| market_overview | **74.86** | **503** | Supabase pool checkout timeout under concurrent load |

**Root cause:** single instance + Supabase transaction pooler + long transactions (market SQL). Not application logic regression.

## After optimization (read10, 10 VU, 120s)

| Endpoint | RPS | p50 | p95 | p99 | 2xx % |
|----------|-----|-----|-----|-----|-------|
| health | 11.18 | 3.2ms | 7.4ms | 18.2ms | 100 |
| catalog_releases | 10.47 | 7.0ms | 19.5ms | 655ms | 100 |
| catalog_filters | 10.82 | 2.6ms | 5.6ms | 1963ms | 100 |
| market_overview | 8.83 | 3.7ms | **9.4ms** | 6058ms* | 100 |
| platform_fees | 10.88 | 3.7ms | 7.2ms | 18.3ms | 100 |
| system_status | 11.03 | 2.6ms | 5.5ms | 309ms | 100 |
| public_news | 10.98 | 3.2ms | 6.1ms | 256ms | 100 |

`secondary_listings` in public profile returns 401 (auth required) — expected.

JSON: `logs/load-baseline-after-read10.json`

## Bottlenecks & recommendations

| Item | Priority | Action |
|------|----------|--------|
| market_overview SQL | **Fixed** | single-flight + stale cache (60s fresh / 5min stale) |
| Redis rate limit | P0 ops | `RATE_LIMIT_STORAGE=redis` + `REDIS_URL` for 2+ API instances |
| Supabase pool @ 30+ VU | P1 ops | Still tune `connection_limit` for multi-instance prod |
| Admin dictionary lists | P2 | 60s TTL cache added for genres/labels |
| FK indexes | P2 | `releases_genre_id_idx`, `releases_label_id_idx` migration applied |

## Clean read30 (30 VU, 180s per scenario) — 2026-06-16

No parallel e2e. Single backend instance. Shared Supabase pooler.

| Endpoint | RPS | p95 2xx | 2xx % | 5xx % | Notes |
|----------|-----|---------|-------|-------|-------|
| health | 33.5 | 4.2ms | 100 | 0 | OK |
| catalog_releases | 32.8 | 11.5ms | 100 | 0 | OK |
| catalog_filters | 32.2 | 7.8ms | 100 | 0 | OK |
| **market_overview** | **1.4** | **112s*** | **17.96** | **82.04** | **503 pool timeout** |
| platform_fees | 32.9 | 19.4ms | 100 | 0 | OK |
| system_status | 32.6 | 7.6ms | 100 | 0 | OK |
| secondary_listings | 33.2 | — | 0 (401) | 0 | auth required |

\* p95 on successful 2xx only; most requests fail with 503.

JSON: `logs/load-baseline-read30.json`  
Verdict script: **INVALID** (5xx &gt; 0.5% aggregate due to market_overview).

**Load gate (before fix):** read10 **PASS**; read30 **FAIL** — cache stampede on `market_overview_stats()`.

## read30 after cache stampede fix (2026-06-16)

Single-flight + stale-while-revalidate. JSON: `logs/load-baseline-read30-after-fix.json` — **VALID**

| Endpoint | RPS | p95 2xx | 2xx % | 5xx % |
|----------|-----|---------|-------|-------|
| market_overview | 32.7 | **15.9ms** | **100** | **0** |
| catalog_releases | 32.7 | 20.2ms | 100 | 0 |

Before: 245 req, 17.96% 2xx, 82% 503.

## read50 after fix (50 VU, 180s per scenario)

JSON: `logs/load-baseline-read50-after-fix.json` — **VALID**

| Endpoint | RPS | p95 2xx | 2xx % | 5xx % |
|----------|-----|---------|-------|-------|
| market_overview | 54.8 | **5.4ms** | **100** | **0** |
| catalog_releases | 54.3 | 12.2ms | 100 | 0 |
| health | 55.3 | 4.5ms | 100 | 0 |

**Load gate:** read10/read30/read50 **PASS** (0% unexpected 5xx on public reads).

## Capacity estimate (single instance, read10)

20k registered users ≈ 200–500 concurrent peak → **2–4 API instances + Redis + pool tuning** required.
