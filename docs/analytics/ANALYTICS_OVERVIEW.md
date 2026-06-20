# Analytics — Overview

Операторская аналитика Spliton: backend aggregation + frontend workspace `/admin/analytics/*`. Данные **не** считаются на клиенте для тяжёлых KPI.

## Разделы

| UI route | Domain | API |
|----------|--------|-----|
| `/admin/analytics` | Сводка | `GET /analytics/overview`, dashboard trends |
| `/admin/analytics/finance` | Финансы | `/analytics/finance/*` |
| `/admin/analytics/users` | Пользователи | `/analytics/users/*` |
| `/admin/analytics/tracks` | Треки / раунды | `/analytics/tracks/*` |
| `/admin/analytics/market` | Вторичный рынок | `/analytics/market/*` |
| `/admin/analytics/revenue` | Распределение дохода | `/analytics/revenue/*` |
| `/admin/analytics/risk` | Риск / compliance | `/analytics/risk/*` |
| `/admin/analytics/operations` | Поддержка | `/analytics/support/*` |

## Роли

- `SUPER_ADMIN` — все области  
- `BUSINESS_ANALYST` — все области **read-only**  
- `ACCOUNTANT` — finance, revenue, market  
- `CONTENT_MANAGER` — tracks  
- `COMPLIANCE` — risk, market  
- `SUPPORT_MANAGER` — users, operations  

Матрица: [BUSINESS_ANALYST_ROLE.md](BUSINESS_ANALYST_ROLE.md), [Admin Roles](../admin/ADMIN_ROLES_AND_ACCESS.md).

## ENV

`NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` — live endpoints; mock без поддельных значений на графиках.

## Документы

| Тема | Файл |
|------|------|
| Архитектура | [ANALYTICS_ARCHITECTURE.md](ANALYTICS_ARCHITECTURE.md) |
| Dashboard & charts | [ANALYTICS_DASHBOARDS.md](ANALYTICS_DASHBOARDS.md) |
| CSV export | [ANALYTICS_EXPORTS.md](ANALYTICS_EXPORTS.md) |
| Performance & indexes | [ANALYTICS_PERFORMANCE.md](ANALYTICS_PERFORMANCE.md) |

## Архив

`docs/archive/reports/ADMIN_ANALYTICS_ARCHITECTURE.md`, `ADMIN_DASHBOARD_LIVE.md`, `ADMIN_CHARTS_AND_METRICS.md`.
