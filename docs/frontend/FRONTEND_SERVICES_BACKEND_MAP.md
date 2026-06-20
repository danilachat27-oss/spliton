# Frontend Services to Backend Map (Spliton)

Дата: 2026-06-17

## Примечания

- Источники: `apps/frontend/services`, `apps/frontend/hooks`, `apps/frontend/lib/api`, `apps/frontend/features/**/api|hooks`.
- Ниже перечислены API-facing сервисы/хуки; UI-only hooks (i18n, nav, toasts) вынесены в примечания.

| Service/Hook | Где используется | Endpoint | Method | Live/mock | Error handling | Проблемы |
| ------------ | ---------------- | -------- | ------ | --------- | -------------- | -------- |
| `auth.service` | login/register/reset/auth provider | `/api/v1/auth/*`, `/api/v1/users/me` | GET/POST | live | `ApiError` | Нет единой матрицы статусов по UX |
| `two-factor.service` | profile security, 2FA flows | `/api/v1/auth/2fa/*` | GET/POST/DELETE | live | custom parse | Частично разрозненная обработка 4xx |
| `user-me.service` | profile/account/security/legal | `/api/v1/me/*` | GET/PATCH/POST/DELETE | live | custom + status checks | Локальные ветки 401/403 не унифицированы |
| `notifications.service` | user notifications/preferences | `/api/v1/notifications*`, `/api/v1/notification-preferences` | GET/PATCH | live | generic `Error` | Потеря кода ошибки |
| `wallet.service` | wallet summary/activity/deposit/withdraw/order | `/api/v1/wallet/*`, `/api/v1/orders/*` | GET/POST/PATCH/DELETE | live | `WalletApiError`, parse helpers | Есть retry/fallback сценарии, нужна явная деградация |
| `portfolio.service` | assets overview/positions/metrics/payouts | `/api/v1/portfolio/*` | GET | live | `parseApiClientError` | Есть `.json().catch(() => ({}))` |
| `catalog.service` | catalog, buy page, search/filter | `/api/v1/catalog/*` | GET | live + fallback | parse errors | `fetchCatalogReleaseById` может вернуть `null` после ошибки |
| `secondary-market.service` | listings/orderbook/trades/buy/sell | `/api/v1/market/*`, `/api/v1/orders/*` | GET/POST/DELETE | live + partial mock | market error parser | Риск demo fallback в части табов |
| `market-overview.service` | market overview pages/widgets | `/api/v1/market/overview/*` | GET | live | `parseApiClientError` | - |
| `market-charts.service` | charts hooks | `/api/v1/market/charts/*` | GET | live | `parseApiClientError` | Нужно следить за contract drift |
| `release-analytics.service` | analytics releases list/detail | `/api/v1/analytics/releases/*`, `/api/v1/releases/:id/*` | GET | live + partial mock | `parseApiClientError` | Mixed live/mock в деталях |
| `kyc.service` | user KYC status/start/submit | `/api/v1/kyc/*` | GET/POST | live | custom parser | - |
| `onboarding.service` | onboarding flow | `/api/v1/onboarding*` | GET/PATCH/POST | live | `parseApiClientError` | - |
| `legal.service` | legal consents/eligibility | `/api/v1/legal/*`, `/api/v1/compliance/eligibility/*` | GET/POST | live | custom error with status | Не единый формат с остальными сервисами |
| `documents.service` | statements/docs/receipts | `/api/v1/documents*`, `/api/v1/*/receipt` | GET/POST | live | parse errors | - |
| `help-center.service` | support public content | `/api/v1/help/*` | GET | live + gating | `HelpCenterApiError`, `404 -> null` | Частично мягкая деградация |
| `news.service` | news list/detail | `/api/v1/news*` | GET | live + mock | `404 -> null` | Demo news path в non-live |
| `platform-fees.service` | fees page | `/api/v1/platform/fees` | GET | live + constants | generic error | Недостаточно typed ошибок |
| `system-status.service` | system status page | `/api/v1/system-status*` | GET | live + mock | status-based throw | Риск demo status в live домене |
| `referrals.service` | referral pages | `/api/v1/referrals/*` | GET/POST | live + notes | mixed handling | Проверить отсутствие demo totals |
| `partners.service` | partner program | `/api/v1/partners/*` | GET/POST | live + static | mixed handling | Часть данных статична |
| `user/userSupport.service` | user support/disputes | `/api/v1/support/tickets*` | GET/POST/PATCH | live + gated mock | custom errors | Нужно жестко отключить mock в live |
| `calculator.service` | assets calculator | `/api/v1/services/calculator/*` | GET | live + constants | generic | Hardcoded constants рядом |
| `useWalletActivityLive` | wallet activity UI | wallet service endpoints | GET | live | hook-level `setError` | Потеря деталей ошибки до message |
| `usePortfolioLive` | assets overview UI | portfolio endpoints | GET | live + fallback risk | hook-level `setError` | Нужно исключить fallback mock |
| `usePortfolioCharts` | metrics charts | portfolio charts endpoints | GET | live + seed risk | hook-level | Demo series риск |
| `usePayoutsOverview` | payouts summary | portfolio payout endpoints | GET | live + mock risk | hook-level | Финансовый fallback риск |
| `usePayoutsHistoryPage` | payouts history | payouts history endpoint | GET | live + fallback rows | hook-level | fallback на mock недопустим в live |
| `useSecondaryMarketLive` | secondary market UI | market endpoints | GET/POST | live + partial mock | hook-level | Риск silent fallback |
| `useSecondaryMarketCharts` | market charts | market charts endpoints | GET | live + demo risk | hook-level | Проверить non-live guards |
| `useMarketOverviewState` | market overview | market overview endpoints | GET | live | hook-level | - |
| `usePublicPlatformFees` | fees UI | platform fees endpoint | GET | live + constants | hook-level | Риск hardcoded fallback |
| `useKycStatus` | profile KYC | kyc endpoints | GET/POST | live | hook-level | - |
| `useEligibilitySummary` | legal eligibility | legal/compliance endpoints | GET | live | hook-level | - |
| `useLegalConsentGate` | legal gate | legal consent endpoints | GET/POST | live | hook-level | - |

## Admin services (агрегированно)

| Service/Hook | Где используется | Endpoint | Method | Live/mock | Error handling | Проблемы |
| ------------ | ---------------- | -------- | ------ | --------- | -------------- | -------- |
| `adminDashboard.service` | admin dashboard | `/api/admin/v1/dashboard/*` | GET | live + mock-capable | `AdminApiClient` | KPI fallback policy неоднородна |
| `adminUsers.service` | users list/detail/actions | `/api/admin/v1/users*` | GET/PATCH/POST | live + mock-capable | `ApiError` | Нужны жесткие RBAC/audit проверки |
| `adminRoles.service` | roles/permissions | `/api/admin/v1/roles*` | GET/POST/PATCH/DELETE | live | `ApiError` | Проверить audit на mutate |
| `adminCompliance.service` | compliance cases | `/api/admin/v1/compliance*` | GET/POST/PATCH | live + mock-capable | `ApiError` | Часть flows TODO |
| `adminKyc.service` | KYC review | `/api/admin/v1/kyc/*` | GET/PATCH | live + mock fallback | `ApiError` + mock reviews | **P0** fake KYC fallback |
| `adminSupport.service` | support admin | `/api/admin/v1/support/tickets*` | GET/PATCH | live + mock-capable | `ApiError` | mock деградация |
| `adminDisputes.service` | disputes admin | `/api/admin/v1/disputes*` | GET/PATCH | live + mock-capable | `ApiError` | - |
| `adminDeposits.service` | deposits admin | `/api/admin/v1/deposits*` | GET/PATCH/POST | live + mock-capable | `ApiError` | **P0** финансовый fallback |
| `adminWithdrawals.service` | withdrawals admin | `/api/admin/v1/withdrawals*` | GET/PATCH/POST | live + mock-capable | `ApiError` | **P0** финансовый fallback |
| `adminWallets.service` | wallets admin | `/api/admin/v1/wallets*` | GET/PATCH | live + mock-capable | `ApiError` | **P0** ledger fallback |
| `adminHoldings.service` | holdings admin | `/api/admin/v1/holdings*` | GET | live + mock-capable | `ApiError` | **P0** fake holdings risk |
| `adminRevenue.service` | revenue events/distributions | `/api/admin/v1/revenue-events*` | GET/POST/PATCH | live + mock-capable | `ApiError` | **P0** fake revenue risk |
| `adminPlatformRevenue.service` | platform revenue | `/api/admin/v1/platform-revenue*` | GET | live + mock-capable | `ApiError` | **P0** fake KPI risk |
| `adminFinanceAnalytics.service` | finance analytics | `/api/admin/v1/analytics/finance/*` | GET | live + mock-capable | `ApiError` | **P0** fake chart risk |
| `adminRevenueAnalytics.service` | revenue analytics | `/api/admin/v1/analytics/revenue/*` | GET | live + mock-capable | `ApiError` | **P0** fake chart risk |
| `adminRiskAnalytics.service` | risk analytics | `/api/admin/v1/analytics/risk/*` | GET | live + mock-capable | `ApiError` | **P0** fake risk flags |
| `adminMarketAnalytics.service` | market analytics | `/api/admin/v1/analytics/market/*` | GET | live + mock-capable | `ApiError` | demo series risk |
| `adminTrackAnalytics.service` | tracks analytics | `/api/admin/v1/analytics/tracks/*` | GET | live + mock-capable | `ApiError` | - |
| `adminUserAnalytics.service` | users analytics | `/api/admin/v1/analytics/users/*` | GET | live + mock-capable | `ApiError` | fake growth risk |
| `adminSupportAnalytics.service` | operations analytics | `/api/admin/v1/analytics/operations/*` | GET | live + mock-capable | `ApiError` | - |
| `adminTracks.service` | tracks/releases | `/api/admin/v1/tracks*`, `/releases*` | GET/POST/PATCH | live + mock-capable | `ApiError` | Legacy mock workspace risk |
| `adminRounds.service` | rounds | `/api/admin/v1/rounds*` | GET/POST/PATCH | live + mock-capable | `ApiError` | Часть checklist UI-only |
| `adminArtists/Labels/ReleaseGenres` | dictionaries | `/api/admin/v1/artists*`, `/labels*`, `/release-genres*` | CRUD | live + mock-capable | `ApiError` | - |
| `adminReports.service` | reports jobs/data | `/api/admin/v1/reports*` | GET/POST | live + mock-capable | `ApiError` + `null` catch paths | Потеря ошибки (`catch => null`) |
| `adminSettings.service` | settings | `/api/admin/v1/settings*` | GET/PATCH | live + mock-capable | `ApiError` | - |
| `adminAudit.service` | audit logs | `/api/admin/v1/audit-logs*` | GET | live + mock-capable | `ApiError` | - |
| `adminSecondaryMarket.service` | market admin listings/trades | `/api/admin/v1/secondary-market*` | GET/PATCH/POST | live + mock-capable | `ApiError` | **P0** fake listings/trades |

## Проверка API клиента и статусов

- Единые клиенты есть: `ApiClientError` (user/public) и `AdminApiClient` (admin).
- `401/403`: в целом обрабатываются.
- `404`: часто переводится в `null`/empty (news/help-center и др.).
- `409`: есть точечная обработка (wallet/order/register).
- `422`: нет единого validation adapter (пробел).
- `500`: в основном generic handling, без единых i18n кодов и request-id проброса в UI.

## Главные проблемы

1. `P0`: `catch => mock` или `catch => null` в финансовых/admin сценариях.
2. `P0`: смешанный live/mock для admin analytics/finance/secondary market.
3. `P1`: неоднородная обработка ошибок и недостаток статуса/кода в UI.
4. `P1`: прямые fallback данные в hooks и компонентах вместо строгих error/empty states.
