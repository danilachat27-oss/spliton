# Platform Revenue UI

## Route

`/admin/platform-revenue` — раздел «Доход платформы» в операторской панели.

## Live (при `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live`)

- KPI-карточки: общий доход, комиссии первички, выводов, вторичного рынка
- Графики: линия по периоду, столбцы по источникам (`AdminLineChart`, `AdminBarChart`)
- Таблица транзакций с копированием ID
- Экспорт CSV через async report job (`platform_revenue_transactions`)

## API

- `GET /api/admin/v1/platform-revenue/summary`
- `GET /api/admin/v1/platform-revenue/by-period`
- `GET /api/admin/v1/platform-revenue/by-source`
- `GET /api/admin/v1/platform-revenue/transactions` (paginated)

## Permissions

| Role | View | Export |
|------|------|--------|
| SUPER_ADMIN | ✓ | ✓ |
| ACCOUNTANT | ✓ | ✓ |
| BUSINESS_ANALYST | ✓ | ✓ |
| Others | по матрице finance/revenue | — |

## Placeholder / backlog

- Stacked bar по источникам во времени (если нужен отдельный endpoint)
- Drill-down в drawer трека/раунда по клику на строку
- XLSX export (disabled в UI)
