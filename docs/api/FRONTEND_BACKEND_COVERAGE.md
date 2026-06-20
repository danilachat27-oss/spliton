# Frontend ↔ Backend Coverage (Spliton)

Дата: 2026-06-17  
Источники: frontend routes/services + backend controllers (`apps/backend/src/modules/**`)

## USER API

| Frontend area | Required data/action | Existing backend endpoint | Exists? | Works? | Missing DTO/RBAC/Audit? | Priority |
| ------------- | -------------------- | ------------------------- | ------- | ------ | ----------------------- | -------- |
| Auth | login/register/verify/reset/logout/logout-all | `/api/v1/auth/*` | Yes | Yes (по контрактам) | Logout-all audit проверить | P0 |
| Profile overview | account data/completeness/preferences | `/api/v1/me/*` | Yes | Yes | DTO consistency для completeness/security score | P0 |
| Security | sessions/events/2FA/password change | `/api/v1/me/sessions*`, `/api/v1/auth/2fa/*`, `/api/v1/me/password` | Yes | Partial (UI mixed) | Security events/score не должны быть fake | P0 |
| Notifications | list/read/preferences | `/api/v1/notifications*`, `/api/v1/notification-preferences` | Yes | Yes | Нет единого error DTO map | P1 |
| Wallet summary/activity | balance/ledger/activity | `/api/v1/wallet/*` | Yes | Yes | Нужен запрет mock fallback | P0 |
| Deposit/Withdraw | create/request/status | `/api/v1/wallet/deposits*`, `/api/v1/wallet/withdrawals*` | Yes | Yes | Audit trail для финансовых мутаций | P0 |
| Portfolio | overview/positions/metrics/cashflow | `/api/v1/portfolio/*` | Yes | Yes | Chart DTO consistency | P0 |
| Payouts | history/schedule/comparison | `/api/v1/portfolio/payouts*` | Yes | Partial (UI fallback risk) | Исключить fake payout data | P0 |
| Documents/Statements | statement/receipt generation | `/api/v1/documents*`, `*/receipt` | Yes | Yes | 404/409 handling унифицировать | P1 |
| Disputes | list/detail/messages | `/api/v1/disputes*` | Yes | Yes | Attachment/audit контракт проверить | P1 |
| Support tickets | list/create/detail/messages | `/api/v1/support/tickets*` | Yes | Partial (gated paths) | Жесткий live-only режим | P1 |

## ADMIN API

| Frontend area | Required data/action | Existing backend endpoint | Exists? | Works? | Missing DTO/RBAC/Audit? | Priority |
| ------------- | -------------------- | ------------------------- | ------- | ------ | ----------------------- | -------- |
| Admin access/RBAC | login/access/permissions | `/api/admin/v1/access*`, `/api/admin/v1/roles*` | Yes | Yes | Проверить полный action-audit ролей | P0 |
| Admin dashboard | KPI/charts/activity feed | `/api/admin/v1/dashboard*`, `/api/admin/v1/analytics/*` | Yes | Partial (mock-capable UI) | Fake KPI/charts блокируют live | P0 |
| Admin users | list/detail/status/roles/KYC links | `/api/admin/v1/users*` | Yes | Yes | Полнота audit админ-действий | P0 |
| Admin tracks/releases | list/create/edit/publish/drawers | `/api/admin/v1/tracks*`, `/api/admin/v1/releases*` | Yes | Partial (legacy mock refs) | Publish checklist и DTO drift | P0 |
| Admin rounds | list/create/publish | `/api/admin/v1/rounds*` | Yes | Partial | Часть workflow UI-only | P1 |
| Admin dictionaries | artists/genres/labels | `/api/admin/v1/artists*`, `/api/admin/v1/release-genres*`, `/api/admin/v1/labels*` | Yes | Yes | Validation/i18n error map | P2 |
| Admin finance deposits | moderation/flags/actions | `/api/admin/v1/deposits*` | Yes | Partial (mock-capable) | Fake fallback запрещен | P0 |
| Admin finance withdrawals | review/approve/reject | `/api/admin/v1/withdrawals*` | Yes | Partial (mock-capable) | Fake fallback запрещен | P0 |
| Admin wallets/ledger | wallets/detail/ledger | `/api/admin/v1/wallets*` | Yes | Partial (mock-capable) | Fake ledger запрещен | P0 |
| Admin holdings | holdings exposure | `/api/admin/v1/holdings*` | Yes | Partial (mock-capable) | Fake holdings запрещен | P0 |
| Admin revenue/platform revenue | revenue/distributions/summary | `/api/admin/v1/revenue-events*`, `/api/admin/v1/platform-revenue*` | Yes | Partial (mock-capable) | Fake revenue/charts запрещены | P0 |
| Admin reports | report jobs/data | `/api/admin/v1/reports*` | Yes | Partial | `catch => null` path скрывает ошибки | P1 |
| Admin secondary market | listings/trades/cancel/unlock | `/api/admin/v1/secondary-market*` | Yes | Partial (mock-capable) | fake listings/trades запрещены | P0 |
| Admin support/compliance | tickets/cases/ops | `/api/admin/v1/support*`, `/api/admin/v1/compliance*` | Yes | Partial | RBAC/action audit усилить | P1 |
| Admin settings/system status | settings/legal/system | `/api/admin/v1/settings*`, `/api/admin/v1/system-status*`, `/api/admin/v1/legal*` | Yes | Yes | - | P2 |

## PUBLIC API

| Frontend area | Required data/action | Existing backend endpoint | Exists? | Works? | Missing DTO/RBAC/Audit? | Priority |
| ------------- | -------------------- | ------------------------- | ------- | ------ | ----------------------- | -------- |
| Catalog | releases/list/filter/detail | `/api/v1/catalog/*` | Yes | Yes | DTO versioning check | P0 |
| Buy flow (primary) | order creation/validation | `/api/v1/orders/primary`, `/api/v1/catalog/releases/{id}` | Yes | Partial (fallback logic) | Не подменять данные mock при API ошибке | P0 |
| News | list/detail | `/api/v1/news*` | Yes | Partial (non-live mock path) | Прод-only live content | P1 |
| Help center | categories/articles | `/api/v1/help/*` | Yes | Yes | - | P2 |
| System status | incidents/health snapshot | `/api/v1/system-status*` | Yes | Partial (gated mock path) | Только live в публичном домене | P1 |
| Legal public pages | policies/legal docs | `/api/v1/legal/*` (частично) | Yes | Mostly | часть страниц статические | P2 |

## FINANCE API

| Frontend area | Required data/action | Existing backend endpoint | Exists? | Works? | Missing DTO/RBAC/Audit? | Priority |
| ------------- | -------------------- | ------------------------- | ------- | ------ | ----------------------- | -------- |
| User wallet ledger | balance/activity/history | `/api/v1/wallet/*` | Yes | Yes | Единая i18n ошибок по 422/500 | P0 |
| User payouts | history/chart/comparison | `/api/v1/portfolio/payouts*` | Yes | Partial (UI fallback) | Исключить fake chart/history | P0 |
| Admin treasury | accounts/limits/reconciliation | `/api/admin/v1/treasury*` | Yes | Yes | audit completeness проверить | P1 |

## MARKET API

| Frontend area | Required data/action | Existing backend endpoint | Exists? | Works? | Missing DTO/RBAC/Audit? | Priority |
| ------------- | -------------------- | ------------------------- | ------- | ------ | ----------------------- | -------- |
| User secondary market | listings/orderbook/trades | `/api/v1/market/*` | Yes | Partial (demo widgets) | orderbook/trade history только live | P0 |
| User buy/sell actions | create/cancel/buy listing | `/api/v1/orders*`, `/api/v1/market/listings*` | Yes | Yes | Проверка race/conflict UX | P1 |
| Market overview analytics | charts/depth/history | `/api/v1/market/overview*`, `/api/v1/market/charts*` | Yes | Yes | chart DTO consistency | P1 |
| Admin market control | listings/trades/cancel/unlock | `/api/admin/v1/secondary-market*` | Yes | Partial (mock-capable) | action audit обязателен | P0 |

## SUPPORT API

| Frontend area | Required data/action | Existing backend endpoint | Exists? | Works? | Missing DTO/RBAC/Audit? | Priority |
| ------------- | -------------------- | ------------------------- | ------- | ------ | ----------------------- | -------- |
| User support | tickets/messages/attachments | `/api/v1/support/tickets*` | Yes | Partial (gated UI) | attachment validation + audit | P1 |
| User disputes | disputes/messages | `/api/v1/disputes*` | Yes | Yes | SLA/status taxonomy check | P1 |
| Admin support | queue/actions | `/api/admin/v1/support*` | Yes | Partial | action audit and RBAC granularity | P1 |

## ANALYTICS API

| Frontend area | Required data/action | Existing backend endpoint | Exists? | Works? | Missing DTO/RBAC/Audit? | Priority |
| ------------- | -------------------- | ------------------------- | ------- | ------ | ----------------------- | -------- |
| Release analytics (user/public) | list/detail/charts/history | `/api/v1/analytics/releases*`, `/api/v1/releases/{id}/*` | Yes | Partial (mixed UI paths) | Убрать mixed mock/live branches | P1 |
| Admin analytics | users/revenue/finance/market/risk/tracks/ops | `/api/admin/v1/analytics/*` | Yes | Partial (mock-capable) | fake charts/KPI блокируют live | P0 |

## SETTINGS / DICTIONARIES API

| Frontend area | Required data/action | Existing backend endpoint | Exists? | Works? | Missing DTO/RBAC/Audit? | Priority |
| ------------- | -------------------- | ------------------------- | ------- | ------ | ----------------------- | -------- |
| Admin settings | platform/system settings | `/api/admin/v1/settings*` | Yes | Yes | audit settings mutation | P1 |
| Dictionaries | artists/genres/labels | `/api/admin/v1/artists*`, `/release-genres*`, `/labels*` | Yes | Yes | validation error mapping | P2 |
| Roles/permissions | role matrix/actions | `/api/admin/v1/roles*` | Yes | Yes | enforce full RBAC coverage | P0 |

## MISSING_BACKEND

На уровне существующих frontend services критичных явных `MISSING_BACKEND` endpoint не обнаружено.  
Основной риск не в отсутствии endpoint, а в `PARTIAL/mock-capable` frontend ветках и нестрогой деградации при ошибках API.

## Критичные блокеры до live подключения

1. Убрать все fake/mock источники из финансовых и рыночных UI веток.
2. Ввести hard policy: в prod/staging `NEXT_PUBLIC_*_DATA_SOURCE=live`.
3. Запретить silent fallback на demo при API ошибках.
4. Добить единый error contract для `422/500` (UI + i18n + request id).
