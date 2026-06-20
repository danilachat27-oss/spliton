# Production Performance Audit — Spliton

**Date:** 2026-06-20  
**Mode:** read-only audit (no code, secrets, DNS, or business-logic changes)

---

## 1. Executive summary

### Top causes of slow loading

1. **Auth to wallet waterfall in header** — POST /auth/refresh blocks GET /api/v1/wallet; balance shows ellipsis until both finish.
2. **Header uses heavy wallet summary** — fetchWalletSummary to GET /api/v1/wallet (~7 SQL + 3 JWT guard queries) instead of lean balance.
3. **No client cache/dedup** — no React Query/SWR; header remount refetches wallet; overview/profile/dashboard can hit wallet 3x in parallel.
4. **JWT touchSession UPDATE on every authed request** — adds DB write and pool pressure.
5. **~72 MB static PNG in public/** + release covers with unoptimized Next Image — Lighthouse LCP /catalog = 12.0 s, score 70.

### P0 quick wins

- Lean /api/v1/wallet/balance + shared wallet cache in header
- Debounce touchSession
- Shared layout for DashboardHeader
- WebP for top PNG heroes (>1 MB)
- Enable PRISMA_SLOW_QUERY_MS=500

---

## 2. Current production URLs

| Role | URL |
|------|-----|
| Frontend | https://spliton.io |
| Backend API | https://api.spliton.io |
| Frontend fallback | https://spliton-frontend-production.up.railway.app |
| Backend fallback | https://spliton-production.up.railway.app |

Railway project 931eaee7-c169-40ff-9964-746af3bb21d3 — services spliton + spliton-frontend Online.

Production JS resolves API to https://api.spliton.io (chunk 0hj-qq-w3cz~m.js). http://localhost:4001 exists as dead fallback constant only.

---

## 3. Frontend findings

### Slow pages (HTML TTFB ~225-380 ms; slowness mostly client/API/images)

| Route | Notes |
|-------|-------|
| / | Redirect to /dashboard |
| /catalog | LCP 12 s; catalog API + header wallet + covers |
| /login | Header on auth layout fetches wallet if session exists |
| /dashboard | Header remount + landing wallet + portfolio |
| /assets/overview | 307 if unauth; then 6+ API, duplicate wallet |
| /system-status | 1.4 MB hero PNG with priority |
| /fees, /news | Large shell + client fetch |

Lighthouse (docs/performance/lighthouse-catalog.json): score 70, FCP 1.7 s, LCP 12.0 s, TBT 200 ms, CLS 0.018, TTI 12.0 s.

### Header data map

| Data | Component | Hook | Endpoint |
|------|-----------|------|----------|
| Balance | DashboardHeader | useHeaderWalletBalance | GET /api/v1/wallet |
| Session | AuthProvider | refreshSession | POST /auth/refresh |
| Notifications | NotificationBell | poll 60s | GET /api/v1/notifications/unread-count |
| Announcements | SystemAnnouncementBanners | mount | GET /api/v1/system-announcements/active |

Waterfall: refresh then isAuthenticated then wallet. 401 path: wallet, refresh, wallet retry (20s timeout each).

Duplicate wallet: header + use-dashboard-landing-stats + use-portfolio-live + profile-overview-content.

Remount: DashboardHeader in ~20 page.tsx; only dashboard/(assets)/layout keeps header in subtree.

### API client

Native fetch, 20s timeout (lib/fetch-with-timeout.ts), credentials include, 401 refresh retry once, no dedup/cache.

### Bundle

Admin i18n lazy on /admin; user routes eager ~25 modules x 4 locales. Heavy: framer-motion, flag/crypto icon packs.

---

## 4. Backend / API findings

JWT guard: findUser + findSession + touchSession UPDATE (jwt.strategy.ts).

Wallet: GET /api/v1/wallet = getSummary (aggregates + fee). GET /api/v1/wallet/balance delegates to getSummary — no lean path. Header uses summary.

Profile: GET /users/me includes AccountCenterService.buildSummary (~20+ queries).

Public cache (TtlCacheService, in-memory):

| Endpoint | TTL | Cold TTFB | Warm TTFB |
|----------|-----|-----------|-----------|
| /api/v1/system-status | 30s | ~1.10s | ~0.22s |
| /api/v1/market/overview | 60s | ~1.95s | ~0.22s |
| /api/v1/catalog/releases | 60s | ~1.70s | ~0.22s |
| /api/v1/platform/fees | 60s | ~1.02s | ~0.22s |
| /api/v1/news | 60s | ~0.96s | ~0.22s |

PRISMA_SLOW_QUERY_MS default 0 (off).

Portfolio: double position load. Secondary: may fetch 500 rows for default sort.

---

## 5. Images / media

79 raster files, ~72.3 MB in apps/frontend/public.

Top WebP candidates (plan only):

| Path | Size | Dimensions | Usage | LCP |
|------|------|------------|-------|-----|
| /images/loginphoto.png | 2182 KB | 1024x1536 | login | high |
| /images/LOGO/FULL-LOGO.png | 2025 KB | 1536x1024 | branding | med |
| /images/fees/back.png | 1380 KB | 2172x724 | fees, system-status, news | high |
| /images/catalogbuy/backgraundbuy.png | 1838 KB | 2172x724 | buy flow | high |
| /images/payouts-menu/*.png | 1.4-1.7 MB | 1536x1024 | megamenu | low |

Release covers: catalog-track-card.tsx — next/image + sizes but unoptimized for Supabase URLs. Fix via remotePatterns; do not change backend URLs.

---

## 6. Header balance analysis

Hook: apps/frontend/hooks/use-header-wallet-balance.ts  
UI: apps/frontend/components/dashboard/dashboard-header.tsx  
API: fetchWalletSummary to GET /api/v1/wallet  
Backend: UserWalletService.getSummary()

Loader shows ellipsis while loading. Zero balance is correct formatting. Error shows dash.

---

## 7. Network waterfall

HTML ~230ms -> JS parse -> POST /auth/refresh -> GET /api/v1/wallet -> notifications + announcements -> page APIs -> duplicate wallet -> PNG/covers LCP.

---

## 8. Fix plan

P0: wallet cache, lean balance API, debounce touchSession, shared header layout, WebP heroes, balance skeleton, PRISMA_SLOW_QUERY_MS.

P1: skip wallet on login, dedup activity, remotePatterns covers, slim /users/me, cache platform fees.

P2: Redis cache, secondary SQL sort, megamenu split, i18n split, Lighthouse CI.

---

## 9. Commands / results

curl timing on api.spliton.io (cold ~1-2s TTFB, warm ~0.22s for cached public endpoints).

npx lighthouse https://spliton.io/catalog -> docs/performance/lighthouse-catalog.json (score 70, LCP 12.0s).

railway status -> both Online.

Not measured: authed wallet latency (no test account; spliton_pass.txt not used).

---

## 10. No-change guarantee

No secrets, DNS, domains, CORS, business logic, live/mock modes, Prisma, Railway vars, image conversion, or commits changed.

Artifacts: docs/performance/PRODUCTION_PERFORMANCE_AUDIT.md, lighthouse-catalog.json

---

## Appendix — key files

- apps/frontend/hooks/use-header-wallet-balance.ts
- apps/frontend/components/providers/auth-provider.tsx
- apps/frontend/services/wallet.service.ts
- apps/backend/src/modules/wallets/user-wallet.service.ts
- apps/backend/src/modules/auth/strategies/jwt.strategy.ts
- apps/frontend/components/dashboard/catalog-track-card.tsx
- apps/backend/src/common/cache/ttl-cache.service.ts