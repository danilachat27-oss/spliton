# Spliton — Admin Reports & Export Center

Страница: `/admin/reports`

## Вкладки

| Вкладка | Назначение |
|---------|------------|
| Обзор | KPI, последний успешный отчёт, worker warning |
| Каталог отчётов | Карточки шаблонов по категориям |
| История задач | Таблица report jobs + detail drawer |
| Расписание | Placeholder для scheduler |
| Воркер и хранилище | Worker health, queue, storage mode |
| Экспорт и доступы | RBAC matrix по шаблонам |

## API

| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/admin/v1/reports/summary` | KPI overview |
| GET | `/api/admin/v1/reports` | Paginated jobs |
| GET | `/api/admin/v1/reports/worker/status` | Worker + storage |
| POST | `/api/admin/v1/reports/generate?type=&dateFrom=&dateTo=` | Create job |
| GET | `/api/admin/v1/reports/:id?include=audit` | Job detail |
| GET | `/api/admin/v1/reports/:id/download` | Download CSV (audit logged) |
| POST | `/api/admin/v1/reports/:id/retry` | Retry failed |

Шаблоны — frontend catalog (`admin-reports-catalog.ts`), типы стабильны в backend `buildCsv`.

## RBAC

- **SUPER_ADMIN / ADMIN** — все отчёты
- **ACCOUNTANT / COMPLIANCE** — finance + compliance (generate all in group)
- **BUSINESS_ANALYST** — analytics set (read + generate listed types)
- **CONTENT_MANAGER** — `tracks_round_progress` only
- **SUPPORT_MANAGER** — `support_tickets` only

Download проверяет `assertReportGenerate` по типу отчёта.

## Formats

- **CSV** — active
- **XLSX** — UI disabled (coming soon)
- **JSON** — UI disabled

## Live mode

`NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` — jobs/summary/worker from API; empty state без fake jobs.
Mock — `@spliton.demo` fixtures only.

## TODO

- Scheduled reports (scheduler)
- Per-report filters in generate API
- XLSX export
- Configurable retention policy
