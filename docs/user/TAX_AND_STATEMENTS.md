# Tax and statements (Spliton user)

## Disclaimer

Выписки Spliton — **информационные** материалы для личного учёта. Не являются налоговой, бухгалтерской или юридической консультацией. Перед отчётностью проконсультируйтесь со специалистом.

## User UI

- `/dashboard/statements` — запрос выписки
- `/dashboard/documents` — скачивание готовых PDF/XLSX

## API

- `GET /api/v1/accounting/statements` — доступные типы
- `POST /api/v1/accounting/statements/request` — постановка job

## Типы (foundation)

- annual income summary
- monthly wallet statement
- trading summary
- payouts / fees / deposits / withdrawals summaries

## RBAC

Пользователь видит только свои выписки. Admin accounting exports — роли ACCOUNTANT / SUPER_ADMIN (см. `docs/finance/ACCOUNTING_EXPORTS.md`).
