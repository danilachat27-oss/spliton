# Admin Withdrawals Flow

Operator portal **`/admin/withdrawals`** — контроль исходящих USDT TRC20 выводов.

## API

| Method | Path | Описание |
|--------|------|----------|
| GET | `/withdrawals/summary` | KPI за период |
| GET | `/withdrawals` | Список с фильтрами |
| GET | `/withdrawals/:id` | Detail; `?include=ledger,audit,user` |
| POST | `/withdrawals/:id/approve` | Одобрить → lock + PROCESSING |
| POST | `/withdrawals/:id/hold` | На удержание |
| POST | `/withdrawals/:id/reject` | Отклонить → unlock |
| POST | `/withdrawals/:id/complete` | Завершить → debit locked + tx hash |

## Safety

- Ledger mutations via `AdminWithdrawalSettlementService`
- Status guards prevent double complete
- Audit on every mutation

## Frontend

- `withdrawals-section.tsx` — KPI, filters, table, analytics link
- `admin-withdrawal-drawer.tsx` — tabs + approve/hold/reject/complete

## RBAC

ACCOUNTANT / COMPLIANCE mutate; SUPPORT_MANAGER read-only.

## Tests

`apps/backend/test/admin-withdrawals.e2e-spec.ts`, `withdrawal-ledger.e2e-spec.ts`
