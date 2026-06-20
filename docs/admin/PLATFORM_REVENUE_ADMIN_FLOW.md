# Admin Platform Revenue Flow

Spliton Operator Portal — `/admin/platform-revenue` (Доход платформы).

## Data source

All platform revenue comes from the `fees` table, written via `PlatformFeeLedgerService` on:

- primary purchase (`primary_purchase_fee`)
- withdrawal complete (`withdrawal_fee`)
- secondary market trade (`secondary_market_fee`)

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/admin/v1/platform-revenue/summary?period=` | KPI + delta vs previous period |
| GET | `/api/admin/v1/platform-revenue/by-source` | Source breakdown with counts |
| GET | `/api/admin/v1/platform-revenue/by-period?groupBy=day\|week\|month` | Time series + per-source buckets |
| GET | `/api/admin/v1/platform-revenue/by-release` | Revenue by release/round |
| GET | `/api/admin/v1/platform-revenue/fee-settings-history` | Platform fee setting versions |
| GET | `/api/admin/v1/platform-revenue/transactions` | Paginated fee rows |
| GET | `/api/admin/v1/platform-revenue/transactions/:id` | Detail + audit |
| GET | `/api/admin/v1/platform-fees` | Current active settings |
| PATCH | `/api/admin/v1/platform-fees` | SUPER_ADMIN only |

## Frontend tabs

1. **Обзор** — KPI cards with delta, sparklines, tooltips
2. **Источники** — donut + bar charts (color-coded), source table
3. **Динамика** — line chart (negative = red), multi-line by source
4. **Транзакции** — full table + detail drawer
5. **Комиссии** — current settings + history table
6. **Релизы и раунды** — top releases bar chart + table
7. **Экспорт** — async report jobs
8. **Настройки** — fee edit (SUPER_ADMIN) or link to Settings

## RBAC

| Role | Access |
|------|--------|
| SUPER_ADMIN | Full + PATCH fees |
| ACCOUNTANT | Full read + export |
| BUSINESS_ANALYST | Read-only (global hook) |
| Others | Per permission matrix |

Mock data uses `@spliton.demo` only.

## Chart colors

| Source | Color |
|--------|-------|
| primary_purchase_fee | blue `#2563eb` |
| withdrawal_fee | amber `#f59e0b` |
| secondary_market_fee | violet `#8b5cf6` |
| Negative delta / values | red `#e11d48` |
