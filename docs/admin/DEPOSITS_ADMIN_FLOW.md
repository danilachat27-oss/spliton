# Admin Deposits Flow

Operator portal **`/admin/deposits`** — контроль входящих USDT TRC20 пополнений.

## API

| Method | Path | Описание |
|--------|------|----------|
| GET | `/deposits/summary` | KPI за период (`dateFrom`/`dateTo`) |
| GET | `/deposits` | Список с фильтрами |
| GET | `/deposits/:id` | Detail; `?include=ledger,audit,user` |
| PATCH | `/deposits/:id/status` | Смена статуса (complete → ledger credit) |
| POST | `/deposits/:id/review` | Manual review |
| POST | `/deposits/:id/reconcile` | Settle via WalletLedgerService |

## Safety

- Double credit blocked: `DEPOSIT_ALREADY_SETTLED` on reconcile
- Failed/rejected via `markFailed` — no balance credit
- Manual review — status only, no ledger mutation
- All mutations → `AdminAuditService`

## Frontend

- `deposits-section.tsx` — KPI, filters, table, analytics link
- `admin-deposit-drawer.tsx` — tabs + confirm actions
- Explorer: `NEXT_PUBLIC_TRON_EXPLORER_BASE_URL` + `/#/transaction/{txHash}`

## RBAC

ACCOUNTANT / SUPER_ADMIN mutate; SUPPORT/COMPLIANCE read (+ review per matrix); BUSINESS_ANALYST read-only.

## Tests

`apps/backend/test/admin-deposits.e2e-spec.ts`
