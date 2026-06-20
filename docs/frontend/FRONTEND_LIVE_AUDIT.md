# Spliton — Frontend Live Audit

Аудит: 2026-06-12 (Account Center production polish). Цель: в режиме `live` UI ходит в backend API; mock — только fallback при выключенных флагах / local dev.

**Последние правки (PROMPT 7):** Account Center `/dashboard/profile` — live overview/security/verification/legal/settings; holdings без demo rows; documents/support ticket i18n + `isLiveAccountEnabled`; skeleton loading states; i18n ru/en/es/pt; admin disputes ES/PT parity.

## Account Center (`NEXT_PUBLIC_AUTH_DATA_SOURCE=live`)

| Surface | Live API | Mock / demo | Notes |
|---------|----------|-------------|-------|
| `/dashboard/profile` (overview) | `GET /users/me` (`accountCenter`), wallet summary, holdings | Demo banner only when `AUTH` mock | Wallet block fails isolated |
| `?tab=verification` | KYC + eligibility (4 endpoints) | `?verifyStatus=` gated by `isAccountCenterPrototypeAllowed` | No «Иванов» in live |
| `?tab=legal` | `GET /legal/center`, `POST /legal/consents` | — | Inline accept + history |
| `?tab=security` | sessions, 2FA, password, security score | Mock sessions when `AUTH` mock | Per-block errors |
| `?tab=settings` | `users/me` preferences + notification prefs | — | Save to API |
| `/dashboard/support` | `SUPPORT_DATA_SOURCE=live` | Demo banner when mock | Ticket list + create |
| `/dashboard/support/[id]` | ticket detail + reply/close | i18n live-required message | |
| `/dashboard/disputes` | disputes API | demo banner when mock | |
| `/dashboard/notifications` | notifications API | — | i18n metadata |
| `/dashboard/documents` | `GET /documents` | `documents.liveRequired` when `AUTH` mock | `formatApiError` |
| `/dashboard/statements` | statements API | demo kinds in mock | Linked from profile |

## Env flags

| Variable | Values | Effect |
|----------|--------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | URL backend | Wallet, auth, catalog `GET /releases` |
| `NEXT_PUBLIC_ADMIN_API_BASE_URL` | optional | Admin API (default = API_BASE_URL) |
| `NEXT_PUBLIC_ADMIN_DATA_SOURCE` | `mock` \| `live` | Admin portal services |
| `NEXT_PUBLIC_WALLET_DATA_SOURCE` | `mock` \| `live` | Wallet, orders, market, catalog live bridge |

Production/staging:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_ADMIN_DATA_SOURCE=live
NEXT_PUBLIC_WALLET_DATA_SOURCE=live
```

## Service layer

| Service | Live branch | Mock fallback | Notes |
|---------|-------------|---------------|-------|
| `wallet.service.ts` | ✓ | ✓ | Wallet, deposits, withdrawals, orders, market |
| `catalog.service.ts` | ✓ | — (uses mock catalog list) | `GET /releases` when wallet live |
| `auth.service.ts` | ✓ | — | Always API |
| `adminUsers.service.ts` | ✓ | ✓ | Requires `AdminApiClient` + live |
| `adminRounds.service.ts` | ✓ | ✓ | |
| `adminTracks.service.ts` | ✓ | ✓ | |
| `adminReports.service.ts` | ✓ | ✓ | |
| `adminAnalytics.service.ts` + `*Analytics.service.ts` | ✓ | ✓ empty mock | `fetchAnalytics` |
| `adminPlatformRevenue.service.ts` | ✓ | ✓ | |
| `adminPlatformFees.service.ts` | ✓ | ✓ | Settings fees tab |
| `adminSupport.service.ts` | ✓ | ✓ | |
| `adminCompliance.service.ts` | ✓ | ✓ | |
| `adminRoles.service.ts` | ✓ | ✓ | |
| `adminAudit.service.ts` | ✓ | ✓ | |
| `adminDashboard.service.ts` | ✓ | ✓ | |
| `adminDeposits/Withdrawals/Wallets/Holdings/Revenue/SecondaryMarket` | ✓ | ✓ | |
| `adminSettings.service.ts` | ✗ | ✓ only | **Unused** — settings UI uses platform-fees API |
| `adminSearch.service.ts` | ✓ | ✓ | |

Orders/market: нет отдельных `orders.service.ts` / `market.service.ts` — всё в `wallet.service.ts`.

## Route matrix

| Route | Назначение | Data source | Live API | Mock fallback | Status | Issues | Next action |
|-------|------------|-------------|----------|---------------|--------|--------|-------------|
| `/` | Лендинг | Static | — | — | Static | — | — |
| `/login` | Вход | Live | `POST /auth/login` | — | Live | — | — |
| `/register` | Регистрация | Live | `POST /auth/register` | — | Live | — | — |
| `/dashboard/profile` | Account Center (overview, tabs) | `AUTH_DATA_SOURCE` (+ wallet for holdings) | `users/me`, KYC, legal, security, settings | Demo banner + prototype query params (dev only) | **Live** | KYC file upload P1 | Provider upload |
| `/dashboard/documents` | Документы пользователя | `AUTH_DATA_SOURCE` | `GET /documents` | live-required message | **Live** | — | — |
| `/dashboard/support` | Тикеты пользователя | `SUPPORT_DATA_SOURCE` | user support API | Demo banner | **Live** | — | — |
| `/dashboard/notifications` | Inbox | Live | notifications API | — | **Live** | — | — |
| `/assets` | Редирект/обзор | Mixed | Partial | Mock nav | Partial | Legacy mock pages | Keep as nav hub |
| `/assets/payouts/deposit` | Пополнение | Wallet live | deposit-address, deposits | Mock UI | **Live** | QR placeholder | Optional QR lib |
| `/assets/payouts/withdraw` | Вывод | Wallet live | withdrawals POST/GET | Mock message | **Live** | — | — |
| `/catalog` | Каталог | Wallet live → catalog API | `GET /releases` | `catalog-mock` | **Live** | Artist = symbol stub | Join artists API later |
| `/catalog/buy/[id]` | Покупка UNT | Wallet live | round + `POST /orders` | Mock rows only in mock mode | **Live** | Analytics pages still mock | Wire release analytics API |
| `/dashboard/secondary-market` | Вторичный рынок | Wallet live | market listings/trades | Rich mock UI | **Live** (market/orders/history tabs) | watchlist/analytics/rules mock | Optional API later |
| `/support` | Поддержка | Static + chat widget | User tickets API N/A | Static status | **Partial** | No user ticket API | Backend user support |
| `/news` | Новости | Static | — | Static | Static | — | CMS later |
| `/fees` | Комиссии | Static/educational | — | — | Static | — | — |
| `/system-status` | Статус | Static | — | — | Static | — | — |
| `/admin/login` | Staff login | Live | auth + `/admin/v1/access` | — | Live | — | — |
| `/admin` | Dashboard | `ADMIN_DATA_SOURCE` | dashboard v1 | Mock | **Live** | Persona cards | — |
| `/admin/users` | Users list | Admin live | users + stats | Mock | **Live** | — | — |
| `/admin/users/[id]` | User detail | Admin live | user, wallet, audit, support, compliance | Mock fields | **Live** | Wallet tx list may be empty | Ensure wallet tx endpoint |
| `/admin/tracks` | Tracks | Admin live | tracks CRUD + media upload (Supabase) | Mock | **Live** | Configure SUPABASE_* in backend | Artists API |
| `/admin/rounds` | Rounds | Admin live | rounds lifecycle (7-section drawer, checklist, catalog preview) | Mock | **Live** | — | — |
| `/admin/wallets` | Wallets | Admin live | `GET /wallets`, `/summary`, `/:id?include=` | Mock | **Live** | min locked, date range | Finance analytics link |
| `/admin/deposits` | Deposits | Admin live | `GET /deposits/summary`, list, detail `?include=`, reconcile/review | Mock | **Live** | TRON explorer env optional | Finance analytics link |
| `/admin/withdrawals` | Withdrawals | Admin live | `GET /withdrawals/summary`, list, detail `?include=`, approve/hold/reject/complete | Mock | **Live** | `?status=requested` → pending | Finance analytics link |
| `/admin/holdings` | Holdings | Admin live | `GET /holdings`, `/summary`, `/:id?include=` | Mock | **Live** | min/max value filters, date range sort | Analytics drilldown links |
| `/admin/revenue` | Revenue | Admin live | revenue events | Mock | **Live** | — | — |
| `/admin/secondary-market` | Admin market | Admin live | listings/trades | Mock | **Live** | — | — |
| `/admin/platform-revenue` | Platform revenue | Admin live | summary/transactions | Mock | **Live** | — | — |
| `/admin/reports` | Reports | Admin live | jobs/worker/generate | Mock | **Live** | — | — |
| `/admin/support` | Support | Admin live | tickets | Mock | **Live** | — | — |
| `/admin/compliance` | Compliance | Admin live | risk flags | Mock | **Live** | — | — |
| `/admin/roles` | Roles | Admin live | roles list | Mock matrix static | **Live** | Matrix UI static | — |
| `/admin/settings` | Settings | Admin live | platform-fees only | Other tabs N/A | **Partial** | Only fees live | General settings API |
| `/admin/audit-log` | Audit | Admin live | audit-logs | Mock | **Live** | — | — |
| `/admin/analytics` | Analytics hub (executive BI) | Admin live | trends + analytics summaries, tasks | Rich mock overview | **Live** | custom period UI | See ANALYTICS_DASHBOARDS.md |
| `/admin/analytics/finance` | Finance analytics | Admin live | finance endpoints | Mock | **Live** | — | — |
| `/admin/analytics/users` | User intelligence dashboard | Admin live | users/* + dormant/risk | Rich mock | **Live** | filter UI client-side | See ANALYTICS_DASHBOARDS.md |
| `/admin/analytics/tracks` | Track & Round Intelligence (KPI groups, rounds table, units/holders/revenue/secondary, readiness, top/attention) | Admin live | `tracks/summary`, `round-progress`, `units`, `revenue`, `holders`, `secondary-activity`, `readiness`, `top` | Mock dataset | **Live** | — | CONTENT_MANAGER: finance KPI hidden |
| `/admin/analytics/market` | Secondary Market Intelligence (depth, liquidity, prices, risk, KPI groups) | Admin live | `market/summary`, `volume`, `listings`, `trades`, `top-users`, `fees`, `depth`, `liquidity`, `prices`, `risk` | Mock dataset | **Live** | — | COMPLIANCE: risk emphasis |
| `/admin/analytics/revenue` | Revenue Distribution Intelligence (pipeline, split, by-release, failed, ledger reconciliation) | Admin live | `revenue/summary`, `events`, `distributions`, `by-track`, `payouts`, `pipeline`, `split`, `top-holders`, `failed`, `reconciliation` | Mock dataset | **Live** | — | CONTENT_MANAGER: limited PII |
| `/admin/analytics/risk` | Risk Intelligence Dashboard (queue, rules, SLA, repeat offenders, freeze impact, resolution quality) | Admin live | `risk/summary`, `by-severity`, `by-type`, `queue-aging`, `high-value-operations`, `queue`, `rules-performance`, `repeat-offenders`, `freeze-impact`, `resolution-quality` | `admin-analytics-risk.mock.ts` | **Live** | severity/entity/rule/status filters | COMPLIANCE / ACCOUNTANT / BUSINESS_ANALYST views |
| `/admin/analytics/operations` | Operations Intelligence Dashboard (queue, SLA, finance tickets, escalations, workload, pain points) | Admin live | `support/summary`, `by-status`, `by-category`, `response-time`, `queue`, `sla`, `finance-related`, `escalations`, `workload`, `resolution-quality`, `product-pain-points` | `admin-analytics-support.mock.ts` | **Live** | status/category/priority/team filters | SUPPORT_MANAGER / BUSINESS_ANALYST |

## Mock-only surfaces (intentional fallback)

- Admin portal when `NEXT_PUBLIC_ADMIN_DATA_SOURCE` ≠ `live`
- Wallet/deposit/withdraw/market when `NEXT_PUBLIC_WALLET_DATA_SOURCE` ≠ `live`
- Catalog list/buy mock IDs when wallet source is mock
- Secondary market: tabs `watchlist`, `analytics`, `rules`, order book — demo UI
- `/support` chat — no REST ticket creation for end users
- Marketing pages: `/news`, `/fees`, `/referral-program`, calculator, market-overview educational mocks

## Known issues

1. Catalog live: artist name stubbed from `symbol` until public releases include artists.
2. User support: frontend static; admin support is live.
3. `adminSettings.service.ts` is legacy mock — not wired to UI.

## Verification

```powershell
cd apps/frontend
pnpm run build
```

```powershell
cd apps/backend
npm run test:e2e -- --testPathPattern="admin-access|withdrawal-ledger|wallet-read|primary-order|secondary-market"
```
